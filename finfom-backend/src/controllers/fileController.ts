import { Response } from 'express';
import File from '../models/File';
import Group from '../models/Group';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../types';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import axios from 'axios';

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
      { folder: 'finfom-uploads', resource_type: 'auto' },
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
      .populate('groupId', 'title');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check visibility permissions
    if (file.visibility === 'private') {
      if (!req.user || file.uploaderId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (file.visibility === 'password') {
      const { password } = req.body;
      if (!password) {
        return res.status(401).json({ message: 'Password required' });
      }

      const fileWithPassword = await File.findById(req.params.id).select('+password');
      if (!fileWithPassword) {
        return res.status(404).json({ message: 'File not found' });
      }

      const isMatch = await fileWithPassword.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    res.json({ success: true, data: file });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permissions
    if (file.visibility === 'private') {
      if (!req.user || file.uploaderId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Increment download count
    file.downloads += 1;
    await file.save();

    // Stream the file from Cloudinary using axios for better handling
    const response = await axios({
      method: 'GET',
      url: file.secureUrl,
      responseType: 'stream',
    });

    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.title}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || file.fileType || 'application/octet-stream');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    // Pipe the file stream to response
    response.data.pipe(res);

  } catch (error: any) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

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

    await file.save();
    const updatedFile = await File.findById(file._id).populate('groupId', 'title');
    res.json({ success: true, data: updatedFile });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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
