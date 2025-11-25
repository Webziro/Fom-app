import { Request } from 'express';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

export interface FileUploadRequest extends AuthRequest {
  body: {
    title: string;
    description?: string;
    groupId?: string;
    visibility: 'public' | 'private' | 'password';
    password?: string;
  };
}