import express from 'express';
import {
  uploadFile,
  getMyFiles,
  getFile,
  downloadFile,
  previewFile,
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
router.get('/:id/preview', attachUser, previewFile); // Preview endpoint (inline display, no auth required but attachUser adds context)



// Protected routes (order matters: more specific first)
router.get('/folders', protect, getMyFolders);
router.post('/folders', protect, createFolder);
router.put('/folders/:id', protect, updateFolder);
router.delete('/folders/:id', protect, deleteFolder);
router.get('/folders/:id', protect, getFolder);

router.get('/accessible', protect, getAllAccessibleFiles);
router.get('/', protect, getMyFiles);

router.post('/:id/verify-password', protect, verifyFilePassword);
router.post('/:id/restore-version', protect, restoreFileVersion);
router.post('/:id/revert-previous', protect, revertToPreviousVersion);

router.put('/:id', protect, updateFile);
router.delete('/:id', protect, deleteFile);

// Analytics route
router.get('/analytics', protect, (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}, getAnalytics);

// Public GET by ID (must come after all more specific /:id/* routes and after folders/analytics)
router.get('/:id', getFile);

export default router;