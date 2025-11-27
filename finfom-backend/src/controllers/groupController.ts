import { Response } from 'express';
import Group from '../models/Group';
import File from '../models/File';
import { AuthRequest } from '../types';

// Add this to your groupController

export const createOrGetGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { groupName } = req.body;
    
    if (!groupName || typeof groupName !== 'string' || groupName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const normalizedGroupName = groupName.trim();

    // Try to find existing group with exact name match
    let group = await Group.findOne({ title: normalizedGroupName });

    if (!group) {
      // If no exact match exists, create a new group
      group = await Group.create({
        title: normalizedGroupName,
        description: `Group for ${normalizedGroupName}`,
        ownerId: req.user!._id
      });
    }

    res.json({ 
      success: true, 
      data: group,
      message: group ? 'Group retrieved successfully' : 'Group created successfully'
    });

  } catch (error: any) {
    if (error.code === 11000) {
      // If duplicate key error occurs, find and return the existing group
      const { groupName } = req.body;
      const existingGroup = await Group.findOne({ title: groupName.trim() });
      if (existingGroup) {
        return res.json({ 
          success: true, 
          data: existingGroup, 
          message: 'Group already exists and has been retrieved'
        });
      }
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Also add this endpoint to get all existing groups for the dropdown
export const getAllGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: groups });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};