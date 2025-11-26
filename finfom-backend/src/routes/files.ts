import express from 'express';
import {
  uploadFile,
  getMyFiles,
  getFile,
  downloadFile,
  updateFile,
  deleteFile,
  getPublicFiles,
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
router.get('/:id', getFile);
router.post('/:id/download', downloadLimiter, downloadFile);


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

export default router;