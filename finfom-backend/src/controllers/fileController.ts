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

//This function calculates MD5 hash of file buffer and returns it as a hex string
const calculateFileHash = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

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

    // Check for duplicate file content
    const fileHash = calculateFileHash(buffer);
    const existingFile = await File.findOne({
      fileHash,
      size,
      fileType: mimetype,
    });

    if (existingFile) {
      console.log(`[DUPLICATE] File already exists: ${fileHash}`);
      return res.status(200).json({
        success: true,
        data: existingFile,
        message: 'File content already exists in the system. Using existing file.',
        isDuplicate: true,
        link: existingFile.secureUrl,
      });
    }

    // Upload to Cloudinary using stream
    const uploadStream = cloudinary.uploader.upload_stream(
      
      { 
        folder: 'finfom-uploads', 
        resource_type: mimetype.startsWith('image/') ? 'image' : 'raw'  // ✅ Explicit type
      },
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
          const finalTitle = (title?.trim() || originalname).trim();

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
          });

          res.status(201).json({
            success: true,
            data: newFile,
            message: 'File uploaded and saved successfully!',
          });
        } catch (dbError: any) {
          // Rollback: delete from Cloudinary if database save fails
          await cloudinary.uploader.destroy(result.public_id).catch(() => { });
          return res.status(500).json({
            success: false,
            message: 'Failed to save new file metadata to database',
            error: dbError.message,
          });
        }
      }
    );

    // Stream the buffer to Cloudinary
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

export const getMyFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query: any = {
      $or: [
        { uploaderId: req.user!._id },
        { visibility: 'public' }
      ]
    };

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

export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploaderId', 'username email')
      .populate('groupId', 'title')
      .select('+password');  // ← This loads the hidden password hash

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
    console.log(`Download counted for file ${file._id}. New count: ${file.downloads}`);

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

      console.log(`Download notification sent to ${uploader.email}`);
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

    console.log('Attempting download from:', downloadUrl);

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

    await cloudinary.uploader.destroy(file.cloudinaryId);
    await file.deleteOne();

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get public files with pagination and search function
export const getPublicFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query: any = { visibility: 'public' };

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

    const userId = new mongoose.Types.ObjectId(req.user._id);  // ← CAST TO OBJECTID

    const files = await File.find({ uploaderId: userId });  // ← NOW MATCHES

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

    res.json({
      success: true,
      data: {
        totalDownloads,
        totalFiles,
        storageUsed,
        topFiles,
        downloadsByDate,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};