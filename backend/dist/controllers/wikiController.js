"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWiki = exports.updateWiki = exports.getWiki = exports.getWikis = exports.createWiki = void 0;
const Wiki_1 = __importDefault(require("../models/Wiki"));
const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const createWiki = async (req, res) => {
    try {
        const { title, content, project, tags, parentPage } = req.body;
        const slug = slugify(title) + '-' + Date.now();
        const wiki = await Wiki_1.default.create({ title, content, project, tags, parentPage, slug, author: req.user._id });
        res.status(201).json(wiki);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createWiki = createWiki;
const getWikis = async (req, res) => {
    try {
        const { project } = req.query;
        const wikis = await Wiki_1.default.find({ project, isPublished: true })
            .populate('author', 'name avatar')
            .sort({ updatedAt: -1 });
        res.json(wikis);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getWikis = getWikis;
const getWiki = async (req, res) => {
    try {
        const wiki = await Wiki_1.default.findById(req.params.id)
            .populate('author', 'name avatar')
            .populate('lastEditedBy', 'name avatar');
        if (!wiki)
            return res.status(404).json({ message: 'Wiki page not found' });
        res.json(wiki);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getWiki = getWiki;
const updateWiki = async (req, res) => {
    try {
        const wiki = await Wiki_1.default.findByIdAndUpdate(req.params.id, { ...req.body, lastEditedBy: req.user._id, $inc: { version: 1 } }, { new: true });
        if (!wiki)
            return res.status(404).json({ message: 'Wiki not found' });
        res.json(wiki);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateWiki = updateWiki;
const deleteWiki = async (req, res) => {
    try {
        await Wiki_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Wiki page deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteWiki = deleteWiki;
//# sourceMappingURL=wikiController.js.map