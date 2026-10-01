import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getBusinessMemory,
  createBusinessMemoryItem,
  updateBusinessMemoryItem,
  archiveBusinessMemoryItem,
  approveBusinessMemoryCandidate,
} from '../controllers/business.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/:id/memory', getBusinessMemory);
router.post('/:id/memory', createBusinessMemoryItem);
router.patch('/:id/memory/:memoryId', updateBusinessMemoryItem);
router.post('/:id/memory/:memoryId/archive', archiveBusinessMemoryItem);
router.post('/:id/memory/candidates/:memoryId/approve', approveBusinessMemoryCandidate);

export default router;

