import { Router } from 'express';
import { createWiki, getWikis, getWiki, updateWiki, deleteWiki } from '../controllers/wikiController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect);
router.route('/').get(getWikis).post(requirePermission('create'), createWiki);
router.route('/:id').get(getWiki).put(requirePermission('edit'), updateWiki).delete(requirePermission('delete'), deleteWiki);

export default router;
