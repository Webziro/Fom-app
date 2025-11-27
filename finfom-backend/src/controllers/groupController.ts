// Complete groupController.ts with ALL required functions
import { Response } from 'express';
import Group from '../models/Group';
import File from '../models/File';
import { AuthRequest } from '../types';

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Group title is required' });
    }

    const group = await Group.create({
      title: title.trim(),
      description: description?.trim() || '',
      ownerId: req.user!._id
    });

    res.status(201).json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrGetGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { groupName } = req.body;
    
    if (!groupName || typeof groupName !== 'string' || groupName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const normalizedGroupName = groupName.trim();
    let group = await Group.findOne({ title: normalizedGroupName });

    if (!group) {
      group = await Group.create({
        title: normalizedGroupName,
        description: `Group for ${normalizedGroupName}`,
        ownerId: req.user!._id
      });
    }

    res.json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: groups });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({ ownerId: req.user!._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: groups });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    res.json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.ownerId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, description } = req.body;
    if (title) group.title = title.trim();
    if (description !== undefined) group.description = description.trim();
    
    await group.save();
    res.json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.ownerId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await File.updateMany({ groupId: group._id }, { $unset: { groupId: null } });
    await group.deleteOne();

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGroupFiles = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const files = await File.find({ groupId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: files });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};