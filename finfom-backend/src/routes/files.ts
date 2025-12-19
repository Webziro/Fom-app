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
  getAnalytics, verifyFilePassword, restoreFileVersion,
  createFolder, getMyFolders, updateFolder, deleteFolder, getFolder
} from '../controllers/fileController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadLimiter, downloadLimiter } from '../middleware/rateLimiter';
import { cache, clearCache } from '../middleware/cache';


const router = express.Router();


// Helper middleware — clears file cache after success
const clearFilesCache = (_req: any, _res: any, next: any) => {
  clearCache('cache:/api/files*')
    .catch(console.error)  // don't break the chain if cache fails
    .finally(next);
};

// Public routes
router.get('/public', cache(300), getPublicFiles);
router.post('/:id/access', getFile);
router.post('/:id/download', downloadLimiter, downloadFile);

router.post('/:id/access', getFile); // For accessing password-protected files
router.post('/:id/download', downloadLimiter, downloadFile);

// Protected routes
router.post('/:id/verify-password', protect, verifyFilePassword);
// Version restoration route
router.post('/:id/restore-version', protect, restoreFileVersion);


router.post(
  '/upload',
  protect,
  uploadLimiter,
  upload.single('file'),
  uploadFile,
  clearFilesCache 
);

router.get('/', protect, getMyFiles);

router.put(
  '/:id',
  protect,
  updateFile,
  clearFilesCache
);

router.delete(
  '/:id',
  protect,
  deleteFile,
  clearFilesCache
);

// Folder routes
router.post('/folders', protect, createFolder);
router.get('/folders', protect, getMyFolders);
router.put('/folders/:id', protect, updateFolder);
router.delete('/folders/:id', protect, deleteFolder);
router.post('/folders', protect, createFolder);
router.get('/folders', protect, getMyFolders);
router.put('/folders/:id', protect, updateFolder);
router.delete('/folders/:id', protect, deleteFolder);
router.get('/folders/:id', protect, getFolder);
router.get('/accessible', protect, getAllAccessibleFiles);
router.post('/:id/verify-password', protect, verifyFilePassword);

// Analytics route 
// router.get('/analytics', protect, getAnalytics);

// Set no-cache headers for analytics route
router.get('/analytics', protect, (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}, getAnalytics);

export default router;

