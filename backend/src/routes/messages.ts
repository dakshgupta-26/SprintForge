import { Router } from 'express';
import {
  getMessages,
  getUnreadCounts,
  markConversationAsRead,
  markAllConversationsAsRead,
  uploadAttachment,
  getAttachmentStream,
} from '../controllers/messageController';
import { protect } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { chatAttachmentUpload } from '../middleware/chatUpload';

const router = Router();
router.use(protect); // Ensure all routes require authentication

// Global & unread aggregation endpoints (must be defined before param routes)
router.get('/unread', getUnreadCounts);
router.post('/read-all', markAllConversationsAsRead);

// Attachment upload & streaming endpoints
router.post('/upload/:projectId', chatAttachmentUpload.single('file'), uploadAttachment);
router.get('/attachments/:attachmentId', getAttachmentStream);
router.get('/attachments/:attachmentId/preview', getAttachmentStream);

// Project specific read marker and messages
router.post('/:projectId/read', markConversationAsRead);
router.get('/:projectId', requirePermission('view'), getMessages);

export default router;

