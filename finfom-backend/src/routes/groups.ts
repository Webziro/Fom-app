import express from 'express';
import {
  createGroup,
  getMyGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  getGroupFiles
} from '../controllers/groupController';
import { protect } from '../middleware/auth';
import { cache, clearCache } from '../middleware/cache';

const router = express.Router();

router.use(protect);

router.post('/', async (req, res, next) => {
  await createGroup(req as any, res);
  await clearCache('cache:/api/groups*');
});

router.get('/', cache(300), getMyGroups);
router.get('/:id', cache(300), getGroup);
router.get('/:id/files', cache(300), getGroupFiles);

router.put('/:id', async (req, res, next) => {
  await updateGroup(req as any, res);
  await clearCache('cache:/api/groups*');
});

router.delete('/:id', async (req, res, next) => {
  await deleteGroup(req as any, res);
  await clearCache('cache:/api/groups*');
});

export default router;