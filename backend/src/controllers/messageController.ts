import { Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message';
import Project from '../models/Project';
import ChatReadCursor from '../models/ChatReadCursor';
import { decryptMessage } from '../utils/crypto';
import { uploadChatAttachmentToGridFS, getChatAttachmentsBucket } from '../utils/gridfs';

// ─── Get Messages for a Project ───────────────────────────────────────────────
export const getMessages = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Validate project existence and membership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(userId);
    const isMember = (project.members || []).some((m) => String(m.user) === String(userId));
    if (!isOwner && !isMember && project.isPrivate) {
      return res.status(403).json({ message: 'Not authorized to view messages for this project' });
    }

    // Fetch the latest 100 messages
    const messages = await Message.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'name email avatar role')
      .populate('readBy.user', 'name avatar email');

    // Decrypt messages before sending them to the client
    const decryptedMessages = messages.map((msg) => {
      const decryptedContent = decryptMessage(msg.content, msg.iv);
      return {
        _id: msg._id,
        project: msg.project,
        sender: msg.sender,
        content: decryptedContent,
        attachments: msg.attachments || [],
        readBy: msg.readBy || [],
        reactions: msg.reactions || {},
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      };
    });

    // Oldest first for chat timeline
    res.json(decryptedMessages.reverse());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Upload Chat Attachment ──────────────────────────────────────────────────
export const uploadAttachment = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Verify project authorization
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(userId);
    const isMember = (project.members || []).some((m) => String(m.user) === String(userId));
    if (!isOwner && !isMember && project.isPrivate) {
      return res.status(403).json({ message: 'Not authorized to upload files to this project channel' });
    }

    const fileId = await uploadChatAttachmentToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype || 'application/octet-stream',
      {
        projectId: new mongoose.Types.ObjectId(projectId),
        uploadedBy: userId,
      }
    );

    const attachmentId = new mongoose.Types.ObjectId();

    const attachmentData = {
      _id: attachmentId,
      fileId: fileId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
      uploadedBy: userId,
      createdAt: new Date(),
    };

    res.status(201).json({
      message: 'Attachment uploaded successfully',
      attachment: attachmentData,
    });
  } catch (error: any) {
    console.error('Error uploading chat attachment:', error);
    res.status(500).json({ message: error.message || 'Failed to upload attachment' });
  }
};

// ─── Stream / Download Chat Attachment ─────────────────────────────────────────
export const getAttachmentStream = async (req: any, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const isPreview = req.query.preview === 'true' || req.query.inline === 'true';
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({ message: 'Invalid attachment ID' });
    }

    const targetObjId = new mongoose.Types.ObjectId(attachmentId);

    // 1. Locate message containing this attachment or check GridFS file metadata directly
    let fileId: mongoose.Types.ObjectId | null = null;
    let originalName = 'download';
    let mimeType = 'application/octet-stream';
    let size: number | undefined = undefined;
    let projectId: string | null = null;

    const message = await Message.findOne({
      $or: [{ 'attachments._id': targetObjId }, { 'attachments.fileId': targetObjId }],
    }).populate('project', 'owner members isPrivate');

    if (message) {
      const att = message.attachments.find(
        (a) => String(a._id) === String(targetObjId) || String(a.fileId) === String(targetObjId)
      );
      if (att) {
        fileId = att.fileId;
        originalName = att.originalName;
        mimeType = att.mimeType;
        size = att.size;
        projectId = String(message.project?._id || message.project);
      }

      // Authorization check via message's project
      const proj: any = message.project;
      if (proj) {
        const isOwner = String(proj.owner) === String(userId);
        const isMember = (proj.members || []).some((m: any) => String(m.user || m) === String(userId));
        if (!isOwner && !isMember && proj.isPrivate) {
          return res.status(403).json({ message: 'Not authorized to access this attachment' });
        }
      }
    } else {
      // If message hasn't been saved yet, check GridFS file metadata directly
      const bucket = getChatAttachmentsBucket();
      const files = await bucket.find({ _id: targetObjId }).toArray();
      if (files && files.length > 0) {
        const file = files[0];
        fileId = file._id as any;
        originalName = file.filename;
        mimeType = file.metadata?.contentType || 'application/octet-stream';
        size = file.length;
        if (file.metadata?.projectId) {
          projectId = String(file.metadata.projectId);
          const proj = await Project.findById(projectId);
          if (proj) {
            const isOwner = String(proj.owner) === String(userId);
            const isMember = (proj.members || []).some((m: any) => String(m.user || m) === String(userId));
            if (!isOwner && !isMember && proj.isPrivate) {
              return res.status(403).json({ message: 'Not authorized to access this attachment' });
            }
          }
        }
      }
    }

    if (!fileId) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const bucket = getChatAttachmentsBucket();
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    downloadStream.on('error', (err) => {
      console.error('GridFS download stream error:', err);
      if (!res.headersSent) {
        res.status(404).json({ message: 'Attachment file not found in storage' });
      }
    });

    const disposition = isPreview ? 'inline' : `attachment; filename="${encodeURIComponent(originalName)}"`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.removeHeader('X-Frame-Options');
    if (size) {
      res.setHeader('Content-Length', size);
    }
    res.setHeader('Cache-Control', 'private, max-age=86400, must-revalidate');

    downloadStream.pipe(res);
  } catch (error: any) {
    console.error('Error fetching chat attachment:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to retrieve attachment' });
    }
  }
};

// ─── Get Global and Per-Project Unread Counts ─────────────────────────────────
export const getUnreadCounts = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    // 1. Fetch all projects accessible to the user
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }, { isPrivate: false }],
      status: { $ne: 'archived' },
    }).select('_id name key color');

    const projectUnreadMap: Record<string, number> = {};
    const projectDetails: Array<{
      projectId: string;
      projectName: string;
      projectKey: string;
      projectColor: string;
      unreadCount: number;
      lastMessage?: any;
    }> = [];

    let totalUnread = 0;

    // 2. Efficiently count unread messages per project for this user
    await Promise.all(
      userProjects.map(async (p) => {
        const projectIdStr = String(p._id);

        const unreadCount = await Message.countDocuments({
          project: p._id,
          sender: { $ne: userId },
          'readBy.user': { $ne: userId },
        });

        projectUnreadMap[projectIdStr] = unreadCount;
        totalUnread += unreadCount;

        // Fetch latest message snippet for metadata
        const lastMsg = await Message.findOne({ project: p._id })
          .sort({ createdAt: -1 })
          .populate('sender', 'name avatar')
          .lean();

        projectDetails.push({
          projectId: projectIdStr,
          projectName: p.name,
          projectKey: p.key,
          projectColor: p.color,
          unreadCount,
          lastMessage: lastMsg
            ? {
                _id: lastMsg._id,
                sender: lastMsg.sender,
                createdAt: lastMsg.createdAt,
              }
            : undefined,
        });
      })
    );

    res.json({
      totalUnread,
      projects: projectUnreadMap,
      projectDetails,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Mark a Project Conversation as Read ──────────────────────────────────────
export const markConversationAsRead = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const { lastReadMessageId } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const now = new Date();

    // 1. Update or upsert user's read cursor for this project
    let cursorQuery: any = { user: userId, project: projectId };
    let cursorUpdate: any = { lastReadAt: now };

    if (lastReadMessageId && mongoose.Types.ObjectId.isValid(lastReadMessageId)) {
      cursorUpdate.lastReadMessageId = lastReadMessageId;
    } else {
      const latestMsg = await Message.findOne({ project: projectId }).sort({ createdAt: -1 }).select('_id');
      if (latestMsg) {
        cursorUpdate.lastReadMessageId = latestMsg._id;
      }
    }

    await ChatReadCursor.findOneAndUpdate(cursorQuery, { $set: cursorUpdate }, { upsert: true, new: true });

    // 2. Mark all messages in this project as read by this user
    const messageFilter: any = {
      project: projectId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
    };

    if (lastReadMessageId && mongoose.Types.ObjectId.isValid(lastReadMessageId)) {
      const targetMsg = await Message.findById(lastReadMessageId).select('createdAt');
      if (targetMsg) {
        messageFilter.createdAt = { $lte: targetMsg.createdAt };
      }
    }

    const updateResult = await Message.updateMany(messageFilter, {
      $addToSet: {
        readBy: {
          user: userId,
          readAt: now,
        },
      },
    });

    // 3. Emit real-time synchronization events via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Sync across all tabs/devices of this user
      io.to(String(userId)).emit('chat:read_state:sync', {
        projectId: String(projectId),
        unreadCount: 0,
        readAt: now.toISOString(),
      });

      // Notify project room for read receipt checkmarks
      io.to(`project:${projectId}`).emit('chat:message:read:update', {
        projectId: String(projectId),
        userId: String(userId),
        user: {
          _id: String(userId),
          name: req.user.name,
          avatar: req.user.avatar,
        },
        readAt: now.toISOString(),
      });
    }

    res.json({
      success: true,
      projectId: String(projectId),
      unreadCount: 0,
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Mark All Conversations as Read ───────────────────────────────────────────
export const markAllConversationsAsRead = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // 1. Find all user projects
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }, { isPrivate: false }],
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    // 2. Mark all messages as read by this user
    await Message.updateMany(
      {
        project: { $in: projectIds },
        sender: { $ne: userId },
        'readBy.user': { $ne: userId },
      },
      {
        $addToSet: {
          readBy: {
            user: userId,
            readAt: now,
          },
        },
      }
    );

    // 3. Update all cursors
    await Promise.all(
      projectIds.map((pid) =>
        ChatReadCursor.findOneAndUpdate(
          { user: userId, project: pid },
          { $set: { lastReadAt: now } },
          { upsert: true }
        )
      )
    );

    // 4. Emit sync to all tabs
    const io = req.app.get('io');
    if (io) {
      io.to(String(userId)).emit('chat:read_state:sync', {
        all: true,
        totalUnread: 0,
        projects: {},
        readAt: now.toISOString(),
      });
    }

    res.json({
      success: true,
      totalUnread: 0,
      readAt: now.toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

