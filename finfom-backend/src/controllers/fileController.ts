import mongoose from 'mongoose';
import { Response } from 'express';
import File from '../models/File';
import Group from '../models/Group';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../types';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import axios from 'axios';
import User from '../models/User';  
import sendEmail from '../utils/sendEmail';
import { createFolder } from '../controllers/fileController'; // or folderController
import Folder from '../models/Folder';

//This function calculates MD5 hash of file buffer and returns it as a hex string
const calculateFileHash = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};


// Upload file controller with versioning and duplicate detection

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    // Basic validation
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { title, description, groupId, visibility = 'private', password } = req.body;

    // Validate required fields
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'Group selection is required' });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({ success: false, message: 'File description is required' });
    }

    // Verify the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Selected group does not exist' });
    }

    const { buffer, originalname, mimetype, size } = req.file;

    // Calculate hash
    const fileHash = calculateFileHash(buffer);

    // 1. Check for identical content (same hash) — reuse existing file (save storage)
    const identicalDuplicate = await File.findOne({
      fileHash,
      size,
      fileType: mimetype,
    });

    if (identicalDuplicate) {
      console.log(`[DUPLICATE] Identical content already exists: ${fileHash}`);
      return res.status(200).json({
        success: true,
        data: identicalDuplicate,
        message: 'File content already exists in the system. Using existing file.',
        isDuplicate: true,
        link: identicalDuplicate.secureUrl,
      });
    }

    // 2. Check for versioning: same title, same user, same group
    const finalTitle = (title?.trim() || originalname).trim();

    const existingFileForVersion = await File.findOne({
      title: finalTitle,
      uploaderId: req.user._id,
      groupId,
    });

    if (existingFileForVersion) {
      console.log(`New version detected for file "${finalTitle}" (ID: ${existingFileForVersion._id})`);

      const newVersionNumber = (existingFileForVersion.currentVersion || 1) + 1;

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'finfom-uploads', resource_type: mimetype.startsWith('image/') ? 'image' : 'raw' },
        async (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload failed:', error);
            return res.status(500).json({ success: false, message: 'Failed to upload new version' });
          }

          try {
            // SAFETY: Initialize versions array
            if (!Array.isArray(existingFileForVersion.versions)) {
              existingFileForVersion.versions = [];
            }

            // Tell Mongoose the array was modified
            existingFileForVersion.markModified('versions');

            // Save old version
            existingFileForVersion.versions.push({
              versionNumber: existingFileForVersion.currentVersion || 1,
              uploadedAt: new Date(),
              uploadedBy: req.user._id,
              cloudinaryId: existingFileForVersion.cloudinaryId,
              url: existingFileForVersion.url,
              secureUrl: existingFileForVersion.secureUrl,
              size: existingFileForVersion.size,
              fileType: existingFileForVersion.fileType,
            });

            // Update current
            existingFileForVersion.currentVersion = newVersionNumber;
            existingFileForVersion.cloudinaryId = result.public_id;
            existingFileForVersion.url = result.url;
            existingFileForVersion.secureUrl = result.secure_url;
            existingFileForVersion.size = size;
            existingFileForVersion.fileType = mimetype;
            existingFileForVersion.title = finalTitle;
            existingFileForVersion.description = description.trim();
            existingFileForVersion.fileHash = fileHash;
            existingFileForVersion.updatedAt = new Date();

            await existingFileForVersion.save();

            res.status(200).json({
              success: true,
              data: existingFileForVersion,
              message: `New version uploaded (v${newVersionNumber})`,
              isNewVersion: true,
            });
          } catch (dbError: any) {
            console.error('Version save error:', dbError.message);
            await cloudinary.uploader.destroy(result.public_id).catch(() => {});
            res.status(500).json({ success: false, message: 'Failed to save new version', error: dbError.message });
          }
        }
      );

      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream.pipe(uploadStream);

      return;
    }

    // 3. Normal new file upload
    console.log('Uploading new file (no duplicate or version found)');

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'finfom-uploads', resource_type: mimetype.startsWith('image/') ? 'image' : 'raw' },
      async (error, result) => {
        if (error || !result) {
          console.error('Cloudinary upload failed:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload to Cloudinary',
            error: error?.message,
          });
        }

        try {
          const newFile = await File.create({
            title: finalTitle,
            description: description.trim(),
            groupId,
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
          res.status(500).json({
            success: false,
            message: 'Failed to save new file metadata to database',
            error: dbError.message,
          });
        }
      }
    );

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(uploadStream);

  } catch (error: any) {
    console.error('Upload controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message,
    });
  }
};

// Get user's files with pagination and search function
export const getMyFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, folderId } = req.query;
    const query: any = {
      uploaderId: req.user!._id,  // Only user's files
    };

    if (folderId) {
      query.folderId = folderId;  // Filter by specific folder
    } else {
      query.folderId = null;  // Root: no folder
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const files = await File.find(query)
      .populate('groupId', 'title')
      .populate('uploaderId', 'username _id')
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

// Get single file with access control
export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploaderId', 'username email')
      .populate('groupId', 'title')
      .select('+password');  // ← This loads the hidden password hash

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

    // Build correct Cloudinary URL (force raw + attachment)
    let publicId = file.cloudinaryId;
    if (!publicId.includes('/v')) {
      publicId = `v1/${publicId}`;
    }

    let downloadUrl = `https://res.cloudinary.com/dtr6g5tbm/raw/upload/fl_attachment/${publicId}`;

    // Add filename if possible
    const ext = file.title.split('.').pop() || 'pdf';
    downloadUrl += `.${ext}`;

    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      timeout: 30000,
      validateStatus: (status) => status < 500, // Don't throw on 404
    });

    // Set headers
    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.title)}"`);

    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) res.status(500).json({ message: 'Stream failed' });
    });

  } catch (error: any) {
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

    const { title, description, groupId, visibility, password } = req.body;

    if (title) file.title = title.trim();
    if (description !== undefined) file.description = description.trim();
    if (groupId !== undefined) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(400).json({ message: 'Invalid group' });
      }
      file.groupId = groupId as any;
    }
    if (visibility) file.visibility = visibility;
    if (visibility === 'password' && password) {
      file.password = password;
    }

    // Update fields if provided  
    if (req.body.expiresAt === null || req.body.expiresAt) {
    file.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    }

    await file.save();
    const updatedFile = await File.findById(file._id).populate('groupId', 'title');
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
      .populate('groupId', 'title')
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
      .populate('groupId', 'title')
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


