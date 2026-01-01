import mongoose from 'mongoose';
import { Response } from 'express';
import File from '../models/File';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../types';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import axios from 'axios';
import User from '../models/User';  
import sendEmail from '../utils/sendEmail';
import { createFolder } from '../controllers/fileController';
import Folder from '../models/Folder';
import redisClient from '../utils/redis';

//This function calculates MD5 hash of file buffer and returns it as a hex string
const calculateFileHash = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

// Upload file controller with versioning and duplicate detection
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    // Basic validation
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });

    const { title, description, visibility = 'private', password } = req.body;

    // Validate required fields
     if (!description || description.trim() === '') return res.status(400).json({ success: false, message: 'File description is required' });

    const { buffer, originalname, mimetype, size } = req.file;

    const fileHash = calculateFileHash(buffer);

    const finalTitle = (title?.trim() || originalname).trim();

    // 1. Check for identical content (same hash) — reuse existing file
    const identicalDuplicate = await File.findOne({
      fileHash,
      size,
      fileType: mimetype,
    });

    // If identical file found, return its info without re-uploading
    if (identicalDuplicate) {
      return res.status(200).json({
        success: true,
        data: identicalDuplicate,
        message: 'File content already exists in the system. Using existing file.',
        isDuplicate: true,
        link: identicalDuplicate.secureUrl,
      });
    }

    // 2. Check for versioning: same title, same user, same group
    const existingFileForVersion = await File.findOne({
      title: { $regex: new RegExp(`^${finalTitle}$`, 'i') }, // case-insensitive exact match
      uploaderId: req.user._id,
    });

    if (existingFileForVersion) {
  console.log(`New version detected for file "${finalTitle}" (ID: ${existingFileForVersion._id})`);

  const newVersionNumber = (existingFileForVersion.currentVersion || 1) + 1;

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'finfom-uploads', resource_type: mimetype.startsWith('image/') ? 'image' : 'raw' },
    async (error, result) => {
      if (error || !result) {
        console.error('Cloudinary upload failed:', error);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, message: 'Failed to upload new version' });
        }
      }

      try {
        // Reload the document after upload (fresh state)
        const freshFile = await File.findById(existingFileForVersion._id);

        if (!freshFile) {
          throw new Error('File not found after upload');
        }

        // Safety: Initialize versions array
        if (!Array.isArray(freshFile.versions)) {
          freshFile.versions = [];
        }

        // Save old version
        freshFile.versions.push({
          versionNumber: freshFile.currentVersion || 1,
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
          cloudinaryId: freshFile.cloudinaryId,
          url: freshFile.url,
          secureUrl: freshFile.secureUrl,
          size: freshFile.size,
          fileType: freshFile.fileType,
        });

        // Update current
        freshFile.currentVersion = newVersionNumber;
        freshFile.cloudinaryId = result.public_id;
        freshFile.url = result.url;
        freshFile.secureUrl = result.secure_url;
        freshFile.size = size;
        freshFile.fileType = mimetype;
        freshFile.title = finalTitle;
        freshFile.description = description.trim();
        freshFile.fileHash = fileHash;
        freshFile.updatedAt = new Date();

        // Save the fresh document
        await freshFile.save();

        console.log('Versions array after save:', freshFile.versions);

        if (!res.headersSent) {
          res.status(200).json({
            success: true,
            data: freshFile,
            message: `New version uploaded (v${newVersionNumber})`,
            isNewVersion: true,
          });
        }
      } catch (dbError: any) {
        console.error('Version save error:', dbError.message);
        await cloudinary.uploader.destroy(result.public_id).catch(() => {});
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Failed to save new version', error: dbError.message });
        }
      }
    }
  );

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  stream.pipe(uploadStream);
} else{

      // 3. Normal new file upload
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'finfom-uploads', resource_type: mimetype.startsWith('image/') ? 'image' : 'raw' },
        async (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload failed:', error);
            if (!res.headersSent) {
              return res.status(500).json({ success: false, message: 'Failed to upload to Cloudinary' });
            }
          }

          // Save new file document
          try {
            const newFile = await File.create({
              title: finalTitle,
              description: description.trim(),
              visibility,
              password: visibility === 'password' ? password : null,
              size,
              fileType: mimetype,
              fileHash,
              uploaderId: req.user._id,
              cloudinaryId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
              currentVersion: 1,
              versions: [],
            });

            res.status(201).json({
              success: true,
              data: newFile,
              message: 'File uploaded and saved successfully!',
            });
          } catch (dbError: any) {
            await cloudinary.uploader.destroy(result.public_id).catch(() => {});
            if (!res.headersSent) {
              res.status(500).json({ success: false, message: 'Failed to save new file metadata to database', error: dbError.message });
            }
          }
        }
      );

      // Pipe the buffer to Cloudinary upload stream
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    }
  } catch (error: any) {
    console.error('Upload controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message,
    });
  }
};

// Revert to previous version function
export const revertToPreviousVersion = async (req: AuthRequest, res: Response) => {
  try {
    let file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (file.uploaderId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (file.currentVersion <= 1) {
      return res.status(400).json({ success: false, message: 'No previous version to revert to' });
    }

    // Poll for versions array to be non-empty (wait for upload commit)
    let attempts = 0;
    while (!Array.isArray(file.versions) || file.versions.length === 0) {
      if (attempts >= 10) {
        console.error('Timeout waiting for versions array');
        return res.status(500).json({ success: false, message: 'Timeout waiting for versions history' });
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // wait 500ms
      file = await File.findById(req.params.id);
      attempts++;
      }

    // Safety: Ensure versions is an array
    if (!Array.isArray(file.versions)) {
      file.versions = [];
    }

    // Find previous version
    const previousVersion = file.versions.find(v => v.versionNumber === file.currentVersion - 1);

    if (!previousVersion) {
      console.error('Previous version not found in array');
      return res.status(404).json({ success: false, message: 'Previous version not found in history' });
    }

    // Save current as new backup version
    const newVersionNumber = file.currentVersion + 1;

    file.versions.push({
      versionNumber: file.currentVersion,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      cloudinaryId: file.cloudinaryId,
      url: file.url,
      secureUrl: file.secureUrl,
      size: file.size,
      fileType: file.fileType,
    });

    // Restore previous to current
    file.currentVersion = newVersionNumber;
    file.cloudinaryId = previousVersion.cloudinaryId;
    file.url = previousVersion.url;
    file.secureUrl = previousVersion.secureUrl;
    file.size = previousVersion.size;
    file.fileType = previousVersion.fileType;
    file.fileHash = previousVersion.fileHash || file.fileHash;
    file.updatedAt = new Date();

    // Mark modified
    file.markModified('versions');

    await file.save();

    console.log('File moved — new folderId:', file.folderId);
    console.log('Full file after move:', {
      _id: file._id,
      title: file.title,
      folderId: file.folderId,
      uploaderId: file.uploaderId,
    });

    res.json({
      success: true,
      data: file,
      message: `Reverted to previous version (${previousVersion.versionNumber}). New backup version created (v${newVersionNumber})`,
    });
  } catch (error: any) {
    console.error('Revert error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to revert version', error: error.message });
  }
};

// Get user's files with pagination and search function

export const moveFileToFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { folderId } = req.body; // new folder ID (or null for root)
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (file.uploaderId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update folderId (null = root)
    file.folderId = folderId || null;

    await file.save();

    // Invalidate Redis cache for this user
    await redisClient.del(`myFiles:${req.user._id}:*`);

    res.json({ success: true, data: file, message: 'File moved successfully' });
  } catch (error: any) {
    console.error('Move file error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}; 

// Get single file with access control
export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploaderId', 'username email')
      .populate ('title')
      .select('+password');  // <- This loads the hidden password hash

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Public files: Allow everyone
    if (file.visibility === 'public') {
      return res.json({ success: true, data: file });
    }

    // Password-protected files
    if (file.visibility === 'password') {
      // Owner bypass
      if (req.user && file.uploaderId._id.toString() === req.user._id.toString()) {
        return res.json({ success: true, data: file });
      }

      const { password } = req.body;
      if (!password) {
        return res.status(401).json({ message: 'Password required' });
      }

      const isMatch = await file.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      return res.json({ success: true, data: file });
    }

    // Private files: Only owner
    if (file.visibility === 'private') {
      if (!req.user || file.uploaderId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ success: true, data: file });
  } catch (error: any) {
    console.error('getFile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single folder with access control
export const getFolder = async (req: AuthRequest, res: Response) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .select('title description createdAt uploaderId');

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Only owner can view folder details
    if (folder.uploaderId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, data: folder });
  } catch (error: any) {
    console.error('getFolder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//Download file controller with fixed Cloudinary URL signing

export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Permission checks (your existing code)
    if (file.visibility === 'private') {
      if (!req.user || file.uploaderId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Increment downloads
    file.downloads += 1;
    await file.save();
  // === SEND DOWNLOAD NOTIFICATION ===
if (!req.user || file.uploaderId.toString() !== req.user._id.toString()) {
  try {
    const uploader = await User.findById(file.uploaderId).select('email username');
    if (uploader?.email) {
      const subject = `Your file "${file.title}" was downloaded`;
      const message = `
          Someone just downloaded your file on Finfom!

          File: ${file.title}
          Time: ${new Date().toLocaleString()}
          Downloaded by: ${req.user ? req.user.username : 'Guest (via public link)'}

          View your files: ${process.env.CLIENT_URL || 'http://localhost:5173'}/files

          This is an automated notification from Finfom.
      `.trim();

      await sendEmail({
        email: uploader.email,
        subject,
        message,
      });
    }
  } catch (emailErr) {
    console.error('Failed to send download notification:', emailErr);
    // Don't break the download if email fails
  }
}

    // Build Cloudinary download URL
    // The secureUrl is already stored from the upload response (e.g., result.secure_url)
    // For downloads, add fl_attachment flag to force download instead of preview
    let downloadUrl = file.secureUrl;
    
    // Modify URL to add attachment flag if not already present
    if (!downloadUrl.includes('/fl_attachment/')) {
      downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    
    console.log('[Download] File details:', {
      fileId: req.params.id,
      title: file.title,
      cloudinaryId: file.cloudinaryId,
      originalUrl: file.secureUrl,
      downloadUrl,
    });

    // Buffer the entire file before sending (not streaming)
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'arraybuffer', // Buffer entire response instead of streaming
      timeout: 30000,
      validateStatus: (status) => status < 500,
    });

    console.log('[Download] Cloudinary response:', {
      status: response.status,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      dataLength: response.data.length,
      dataType: typeof response.data,
    });

    // If Cloudinary returned an error or empty response, log the actual response
    if (!response.data || response.data.length === 0) {
      console.error('[Download] Empty file from Cloudinary:', {
        fileId: req.params.id,
        cloudinaryId: file.cloudinaryId,
        url: downloadUrl,
        responseStatus: response.status,
        responseText: response.data?.toString?.('utf-8'),
      });
      return res.status(404).json({ message: 'File content is empty from storage' });
    }

    // Set headers
    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.title)}"`);
    res.setHeader('Content-Length', response.data.length);

    // Send buffered data
    res.send(response.data);  } catch (error: any) {
    console.error('Download failed:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
    });

    if (!res.headersSent) {
      if (error.response?.status === 404) {
        res.status(404).json({ message: 'File not available (Cloudinary 404)' });
      } else {
        res.status(500).json({ message: 'Download failed', details: error.message });
      }
    }
  }
};

// Update file metadata function
export const updateFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.uploaderId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.folderId !== undefined) {
      if (req.body.folderId) {
        const targetFolder = await Folder.findById(req.body.folderId);
        if (!targetFolder || targetFolder.uploaderId.toString() !== req.user._id.toString()) {
          return res.status(400).json({ message: 'Invalid folder' });
        }
      }
      file.folderId = req.body.folderId || null;
    }

    const { title, description, visibility, password } = req.body;

    if (title) file.title = title.trim();
    if (description !== undefined) file.description = description.trim();

    if (visibility) file.visibility = visibility;
    if (visibility === 'password' && password) {
      file.password = password;
    }

    // Update fields if provided  
    if (req.body.expiresAt === null || req.body.expiresAt) {
    file.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    }

    await file.save();
    const updatedFile = await File.findById(file._id).populate( 'title');
    res.json({ success: true, data: updatedFile });
    } catch (error: any) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update file metadata function
export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.uploaderId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete current file from Cloudinary
    if (file.cloudinaryId) {
      await cloudinary.uploader.destroy(file.cloudinaryId).catch((err) => {
        console.error('Failed to delete current Cloudinary file:', err);
      });
    }

    // Delete all old versions from Cloudinary
    if (file.versions && file.versions.length > 0) {
      const deletePromises = file.versions.map((version) => {
        if (version.cloudinaryId) {
          return cloudinary.uploader.destroy(version.cloudinaryId).catch((err) => {
            console.error('Failed to delete version Cloudinary file:', err);
          });
        }
        return Promise.resolve();
      });

      await Promise.all(deletePromises);
    }

    // Delete the file document from DB
    await file.deleteOne();

    res.json({ success: true, message: 'File and all versions deleted successfully' });
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify file password function
export const verifyFilePassword = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id).select('+password');
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (file.visibility !== 'password') {
      return res.status(400).json({ success: false, message: 'File is not password protected' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required' });
    }

    const isMatch = await file.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    res.json({ success: true, message: 'Password correct' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Restore file version function
export const restoreFileVersion = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (file.uploaderId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { versionNumber } = req.body;

    // Find the version to restore
    const versionToRestore = file.versions.find(v => v.versionNumber === versionNumber);
    if (!versionToRestore) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }

    // Save current as new version (backup)
    const newVersionNumber = (file.currentVersion || 1) + 1;

    file.versions.push({
      versionNumber: file.currentVersion || 1,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      cloudinaryId: file.cloudinaryId,
      url: file.url,
      secureUrl: file.secureUrl,
      size: file.size,
      fileType: file.fileType,
    });

    // Restore old version to current
    file.currentVersion = newVersionNumber;
    file.cloudinaryId = versionToRestore.cloudinaryId;
    file.url = versionToRestore.url;
    file.secureUrl = versionToRestore.secureUrl;
    file.size = versionToRestore.size;
    file.fileType = versionToRestore.fileType;
    file.updatedAt = new Date();

    await file.save();

    res.json({
      success: true,
      data: file,
      message: `Restored version ${versionNumber}. New version created (v${newVersionNumber})`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to restore version', error: error.message });
  }
};

export const getMyFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, folderId } = req.query;
    const userId = req.user!._id.toString();

    const cacheKey = `myFiles:${userId}:${page}:${limit}:${search || 'none'}:${folderId || 'root'}`;

    // Check Redis cache
    let cached = null;
    try {
      cached = await redisClient.get(cacheKey);
    } catch (redisErr) {
      // Silent ignore — Redis failed, fall back to DB
    }

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Build query
    const query: any = {
      uploaderId: req.user!._id,
    };

    // Folder filtering
    if (folderId) {
      query.folderId = folderId;
    } else {
      query.folderId = null; // Root files only
    }

    // Search
    if (search) {
      query.$text = { $search: search as string };
    }

    // Fetch files (paginated)
    const files = await File.find(query)
      .populate('uploaderId', 'username _id')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Count total (for pagination)
    const total = await File.countDocuments({
      uploaderId: req.user!._id,
      ...(search && { $text: { $search: search as string } }),
    });

    const response = {
      success: true,
      data: files,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };

    // Cache response
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response)); // 5 minutes
    } catch (redisErr) {
      // Silent ignore
    }

    res.json(response);
  } catch (error: any) {
    console.error('getMyFiles error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get public files with pagination and search function
export const getPublicFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query: any = {
      visibility: { $in: ['public', 'password'] },  // ← Include both public and password
    };

    if (search) {
      query.$text = { $search: search as string };
    }

    const files = await File.find(query)
      .populate('uploaderId', 'username')
      .populate( 'title')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//Get getAllAccessibleFiles function
export const getAllAccessibleFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query: any = {
      $or: [
        { uploaderId: req.user!._id },  // My files (all visibility)
        { visibility: 'public' },       // All public files
        { visibility: 'password' },     // All password-protected files (will prompt in frontend)
      ],
    };

    if (search) {
      query.$text = { $search: search as string };
    }

    const files = await File.find(query)
      .populate('uploaderId', 'username')
      .populate( 'title')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get analytics for user's files function 

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // CAST user ID FIRST (before using it)
    const userId = new mongoose.Types.ObjectId(req.user._id);


    const files = await File.find({ uploaderId: userId });
 
    if (files.length > 0) {
    }

    const totalDownloads = files.reduce((sum, file) => sum + (file.downloads || 0), 0);
    const totalFiles = files.length;
    const storageUsed = files.reduce((sum, file) => sum + file.size, 0);

    const topFiles = files
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 10)
      .map(f => ({
        _id: f._id,
        title: f.title,
        downloads: f.downloads || 0,
        fileType: f.fileType,
        createdAt: f.createdAt,
      }));

    // Downloads by date
    const downloadsMap = {};
    files.forEach(file => {
      const date = new Date(file.updatedAt).toISOString().split('T')[0];
      downloadsMap[date] = (downloadsMap[date] || 0) + (file.downloads || 0);
    });

    const downloadsByDate = Object.keys(downloadsMap)
      .map(date => ({ _id: date, downloads: downloadsMap[date] }))
      .sort((a, b) => a._id.localeCompare(b._id));

    // File types for pie chart
    const fileTypesMap = {};
    files.forEach(file => {
      const type = file.fileType || 'unknown';
      fileTypesMap[type] = (fileTypesMap[type] || 0) + 1;
    });

    const fileTypes = Object.keys(fileTypesMap).map(type => ({
      _id: type,
      count: fileTypesMap[type],
    }));

console.log('Analytics data computed for user:', {
  totalDownloads, totalFiles, storageUsed, 
});

    res.json({
      success: true,
      data: {
        totalDownloads,
        totalFiles,
        storageUsed,
        topFiles,
        downloadsByDate,
        fileTypes,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Folder management controllers
export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, parentFolder } = req.body;

    const folder = await Folder.create({
      title,
      description,
      uploaderId: req.user._id,
      parentFolder: parentFolder || null,
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyFolders = async (req: AuthRequest, res: Response) => {
  try {
    const folders = await Folder.find({ uploaderId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: folders });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateFolder = async (req: AuthRequest, res: Response) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder || folder.uploaderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    folder.title = req.body.title || folder.title;
    folder.description = req.body.description || folder.description;

    await folder.save();
    res.json({ success: true, data: folder });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder || folder.uploaderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Optional: check if folder has files or subfolders
    await Folder.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: 'Folder deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
};


