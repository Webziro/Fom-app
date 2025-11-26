import { Response } from 'express';
import File from '../models/File';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../types';
import { Readable } from 'stream';
import * as crypto from 'crypto';

// Utility: Calculate MD5 hash for duplicate detection
const calculateFileHash = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Basic checks
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const { title, description, groupId, visibility = 'private', password } = req.body;

    // 2. Generate hash for duplicate detection
    const fileHash = calculateFileHash(buffer);

    // 3. Check for existing identical file (same content + size + type)
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
        message: `File content already exists in the system. Using existing file.`,
        isDuplicate: true,
        link: existingFile.secureUrl,
      });
    }

    // 4. Final title fallback
    const finalTitle = (title?.trim() || originalname).trim();

    // 5. Upload to Cloudinary using stream (best for memory & large files)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'finfom-uploads',
        resource_type: 'auto',
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
          const newFile = await File.create({
            title: finalTitle,
            description: description?.trim() || null,
            groupId: groupId || null,
            visibility,
            password: visibility === 'password' ? password : null,

            // Deduplication fields
            size,
            fileType: mimetype,
            fileHash,

            uploaderId: req.user._id,
            cloudinaryId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
          });

          return res.status(201).json({
            success: true,
            data: newFile,
            message: 'File uploaded and saved successfully!',
          });
        } catch (dbError: any) {
          // Rollback: delete from Cloudinary if DB fails
          await cloudinary.uploader.destroy(result.public_id).catch(() => {});
          return res.status(500).json({
            success: false,
            message: 'Failed to save file metadata',
            error: dbError.message,
          });
        }
      }
    );

    // 6. Stream the buffer to Cloudinary
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