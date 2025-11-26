// types.ts — FINAL VERSION
import { Request } from 'express';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface  AuthRequest extends Request {
  file: Express.Multer.File; 
  body: {
    title?: string;
    description?: string;
    groupId?: string;
    visibility?: 'public' | 'private' | 'password';
    password?: string;
  };
  groupName: {
    type: String,
    required: true,
    trim: true,
  },
}