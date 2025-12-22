// src/routes/groups.ts
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

// ROUTES 
router.post('/', createGroup, clearGroupCache);
router.post('/create-or-get', createOrGetGroup);
router.get('/', getAllGroups);                   
router.get('/my-groups', getMyGroups);          
router.get('/:id', getGroup);
router.get('/:id/files', getGroupFiles);
router.put('/:id', updateGroup, clearGroupCache);
router.delete('/:id', deleteGroup, clearGroupCache);
router.get('/:id/files', protect, getGroupFiles);

export default router;