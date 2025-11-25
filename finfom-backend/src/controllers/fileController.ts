import { Response } from 'express';
import File from '../models/File';
import cloudinary from '../config/cloudinary';
import { AuthRequest, FileUploadRequest } from '../types';
import { Readable } from 'stream';

export const uploadFile = async (req: FileUploadRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, groupId, visibility, password } = req.body;

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'finfom-files', resource_type: 'auto' },
      async (error, result) => {
        if (error || !result) {
          return res.status(500).json({ message: 'Error uploading to cloud' });
        }

        const file = await File.create({
          title: title || req.file!.originalname,
          description,
          uploaderId: req.user!._id,
          groupId: groupId || undefined,
          cloudinaryId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          visibility: visibility || 'private',
          password: visibility === 'password' ? password : undefined,
          size: req.file!.size,
          fileType: req.file!.mimetype
        });

        res.status(201).json({ success: true, data: file });
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, groupId } = req.query;
    const query: any = { uploaderId: req.user!._id };

    if (search) query.$text = { $search: search as string };
    if (groupId) query.groupId = groupId;

    const files = await File.find(query)
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
        pages: Math.ceil(total / Number(limit))
      }
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
      const isMatch = await fileWithPassword!.comparePassword(password);
      
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

    // Check permissions (same as getFile)
    if (file.visibility === 'private') {
      if (!req.user || file.uploaderId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    file.downloads += 1;
    await file.save();

    res.json({
      success: true,
      data: { downloadUrl: file.secureUrl, fileName: file.title }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

    if (title) file.title = title;
    if (description !== undefined) file.description = description;
    if (groupId !== undefined) file.groupId = groupId;
    if (visibility) file.visibility = visibility;
    if (visibility === 'password' && password) file.password = password;

    await file.save();
    res.json({ success: true, data: file });
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

    if (search) query.$text = { $search: search as string };

    const files = await File.find(query)
      .populate('uploaderId', 'username')
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
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};