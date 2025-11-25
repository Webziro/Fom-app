import { Response } from 'express';
import crypto from 'crypto';

/**
 * Send standardized success response
 */
export const sendSuccess = (
  res: Response,
  data: any,
  statusCode: number = 200,
  message?: string
) => {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
};

/**
 * Send standardized error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate shareable link for file
 */
export const generateShareableLink = (
  fileId: string,
  baseUrl: string = process.env.CLIENT_URL || 'http://localhost:3000'
): string => {
  return `${baseUrl}/shared/${fileId}`;
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Generate pagination metadata
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

/**
 * Calculate time ago
 */
export const timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';

  return Math.floor(seconds) + ' seconds ago';
};

/**
 * Parse sort query string
 */
export const parseSortQuery = (sortQuery: string = '-createdAt') => {
  const sortField = sortQuery.startsWith('-') ? sortQuery.slice(1) : sortQuery;
  const sortOrder = sortQuery.startsWith('-') ? -1 : 1;
  
  return { [sortField]: sortOrder };
};

/**
 * Check if file type is allowed
 */
export const isAllowedFileType = (mimetype: string, filename: string): boolean => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',');
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  
  return allowedTypes.includes(ext);
};

/**
 * Delay execution (for testing purposes)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if file is image
 */
export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};