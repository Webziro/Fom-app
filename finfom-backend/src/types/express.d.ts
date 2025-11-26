// src/types/express.d.ts
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
        email: string;
      };
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}