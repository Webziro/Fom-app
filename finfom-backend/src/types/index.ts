// types.ts — FIXED VERSION
import { Request } from 'express';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: any; // Use 'any' to avoid Express type conflicts
  file?: Express.Multer.File;
  body: {
    title?: string;
    description?: string;
    groupId?: string;
    groupName?: string;
    visibility?: 'public' | 'private' | 'password';
    password?: string;
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };
}