import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Wiki from '../models/Wiki';

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const createWiki = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, project, tags, parentPage } = req.body;
    const slug = slugify(title) + '-' + Date.now();
    const wiki = await Wiki.create({ title, content, project, tags, parentPage, slug, author: req.user._id });
    res.status(201).json(wiki);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getWikis = async (req: AuthRequest, res: Response) => {
  try {
    const { project } = req.query;
    const wikis = await Wiki.find({ project, isPublished: true })
      .populate('author', 'name avatar')
      .sort({ updatedAt: -1 });
    res.json(wikis);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getWiki = async (req: AuthRequest, res: Response) => {
  try {
    const wiki = await Wiki.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('lastEditedBy', 'name avatar');
    if (!wiki) return res.status(404).json({ message: 'Wiki page not found' });
    res.json(wiki);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWiki = async (req: AuthRequest, res: Response) => {
  try {
    const wiki = await Wiki.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastEditedBy: req.user._id, $inc: { version: 1 } },
      { new: true }
    );
    if (!wiki) return res.status(404).json({ message: 'Wiki not found' });
    res.json(wiki);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteWiki = async (req: AuthRequest, res: Response) => {
  try {
    await Wiki.findByIdAndDelete(req.params.id);
    res.json({ message: 'Wiki page deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
