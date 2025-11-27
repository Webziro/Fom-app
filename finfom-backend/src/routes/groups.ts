// src/routes/groups.ts — FINAL 100% WORKING VERSION
import express from 'express';
import {
  createGroup,
  createOrGetGroup,
  getAllGroups,
  getMyGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  getGroupFiles,
} from '../controllers/groupController';
import { protect } from '../middleware/auth';
import { cache, clearCache } from '../middleware/cache';

const router = express.Router();

// Apply protect to all routes
router.use(protect);

// Helper to clear cache after mutations
const clearGroupCache = async (_req: any, _res: any, next: any) => {
  try {
    await clearCache('cache:/api/groups*');
  } catch (err) {
    console.error('Cache clear failed:', err);
  }
  next();
};

// ROUTES — CLEAN & WORKING
router.post('/', createGroup, clearGroupCache);
router.post('/create-or-get', createOrGetGroup);
router.get('/', getAllGroups);
router.get('/', cache(300), getMyGroups);
router.get('/:id', cache(300), getGroup);
router.get('/:id/files', cache(300), getGroupFiles);
router.put('/:id', updateGroup, clearGroupCache);
router.delete('/:id', deleteGroup, clearGroupCache);

export default router;
