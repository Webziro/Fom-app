import { Response } from 'express';
import Group from '../models/Group';
import File from '../models/File';
import { AuthRequest } from '../types';

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const group = await Group.create({
      title,
      description,
      ownerId: req.user!._id
    });
    
    //Check if group has been created on the system by another user with same name, or similar description, 
    res.status(201).json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({ ownerId: req.user!._id }).sort({ createdAt: -1 });

    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const fileCount = await File.countDocuments({ groupId: group._id });
        return { ...group.toObject(), fileCount };
      })
    );

    res.json({ success: true, data: groupsWithCounts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.ownerId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.ownerId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description } = req.body;
    if (title) group.title = title;
    if (description !== undefined) group.description = description;
    await group.save();

    res.json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.ownerId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await File.updateMany({ groupId: group._id }, { $unset: { groupId: "" } });
    await group.deleteOne();

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getGroupFiles = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.ownerId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { page = 1, limit = 10 } = req.query;

    const files = await File.find({ groupId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await File.countDocuments({ groupId: req.params.id });

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