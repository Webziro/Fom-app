import express from 'express';
import {
  uploadFile,
  getMyFiles,
  getFile,
  downloadFile,
  updateFile,
  deleteFile,
  getPublicFiles
} from '../controllers/fileController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadLimiter, downloadLimiter } from '../middleware/rateLimiter';
import { cache, clearCache } from '../middleware/cache';

const router = express.Router();

// Public routes with caching
router.get('/public', cache(300), getPublicFiles);
router.get('/:id', getFile);
router.post('/:id/download', downloadLimiter, downloadFile);

// Protected routes
router.post('/upload', protect, uploadLimiter, 
  upload.single('file'), async (req, res, next) => {
  await uploadFile(req as any, res);
  await clearCache('cache:/api/files*');
});

router.get('/', protect, getMyFiles);

router.put('/:id', protect, async (req, res, next) => {
  await updateFile(req as any, res);
  await clearCache('cache:/api/files*');
});

router.delete('/:id', protect, async (req, res, next) => {
  await deleteFile(req as any, res);
  await clearCache('cache:/api/files*');
});

export default router;