import express from 'express';
import {
  uploadFile,
  getMyFiles,
  getFile,
  downloadFile,
  updateFile,
  deleteFile,
  getPublicFiles,
  getAllAccessibleFiles,
  getAnalytics,
  verifyFilePassword,
  restoreFileVersion,
  revertToPreviousVersion,
  createFolder,
  getMyFolders,
  updateFolder,
  deleteFolder,
  getFolder
} from '../controllers/fileController';
import { protect, attachUser } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadLimiter, downloadLimiter } from '../middleware/rateLimiter';
import { cache } from '../middleware/cache';

const router = express.Router();

// Public routes
router.get('/public', cache(300), getPublicFiles);

// IMPORTANT: More specific routes MUST come before generic /:id routes to avoid Express matching /upload as /:id
router.post(
  '/upload',
  protect,
  uploadLimiter,
  upload.single('file'),
  uploadFile
);

router.post('/:id/access', getFile); // Public access for password-protected files
// Allow optional auth for downloads: public files can be downloaded anonymously,
// private files require the requester to be the owner (attachUser fills req.user if token present).
router.post('/:id/download', downloadLimiter, attachUser, downloadFile);

// Protected routes
router.post('/:id/verify-password', protect, verifyFilePassword);
router.post('/:id/restore-version', protect, restoreFileVersion);
router.post('/:id/revert-previous', protect, revertToPreviousVersion);

router.get('/', protect, getMyFiles);
router.get('/accessible', protect, getAllAccessibleFiles);

router.put('/:id', protect, updateFile);
router.delete('/:id', protect, deleteFile);

// Folder routes
router.post('/folders', protect, createFolder);
router.get('/folders', protect, getMyFolders);
router.put('/folders/:id', protect, updateFolder);
router.delete('/folders/:id', protect, deleteFolder);
router.get('/folders/:id', protect, getFolder);

// Analytics route
router.get('/analytics', protect, (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}, getAnalytics);

export default router;