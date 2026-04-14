import { Response } from 'express';
import Message from '../models/Message';
import Project from '../models/Project';
import { decryptMessage } from '../utils/crypto';

export const getMessages = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;

    // Validate project existence and membership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view messages for this project' });
    }

    // Fetch the latest 100 messages
    const messages = await Message.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'name email avatar role');

    // Decrypt messages before sending them to the client
    const decryptedMessages = messages.map((msg) => {
      const decryptedContent = decryptMessage(msg.content, msg.iv);
      return {
        _id: msg._id,
        project: msg.project,
        sender: msg.sender,
        content: decryptedContent,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      };
    });

    // Reverse the array so the oldest is first, which is standard for chat interfaces
    res.json(decryptedMessages.reverse());
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
