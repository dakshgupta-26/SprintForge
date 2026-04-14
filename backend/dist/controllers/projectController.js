"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.inviteMember = exports.deleteProject = exports.updateProject = exports.getProject = exports.getProjects = exports.createProject = void 0;
const Project_1 = __importDefault(require("../models/Project"));
const User_1 = __importDefault(require("../models/User"));
const Task_1 = __importDefault(require("../models/Task"));
const Sprint_1 = __importDefault(require("../models/Sprint"));
const createProject = async (req, res) => {
    try {
        const { name, key, description, type, isPrivate, color, icon, startDate, endDate } = req.body;
        const project = await Project_1.default.create({
            name, key: key.toUpperCase(), description, type, isPrivate, color, icon, startDate, endDate,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'admin' }],
        });
        await User_1.default.findByIdAndUpdate(req.user._id, { $push: { projects: project._id } });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createProject = createProject;
const getProjects = async (req, res) => {
    try {
        const projects = await Project_1.default.find({
            $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
        })
            .populate('owner', 'name avatar email')
            .populate('members.user', 'name avatar email')
            .sort({ updatedAt: -1 });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getProjects = getProjects;
const getProject = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id)
            .populate('owner', 'name avatar email')
            .populate('members.user', 'name avatar email')
            .populate('sprints');
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const isMember = project.members.some((m) => m.user._id.toString() === req.user._id.toString());
        if (!isMember && project.isPrivate)
            return res.status(403).json({ message: 'Access denied' });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getProject = getProject;
const updateProject = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only project owner can update' });
        }
        const updated = await Project_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only project owner can delete' });
        }
        await Task_1.default.deleteMany({ project: req.params.id });
        await Sprint_1.default.deleteMany({ project: req.params.id });
        await Project_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteProject = deleteProject;
const inviteMember = async (req, res) => {
    try {
        const { email, role } = req.body;
        const project = await Project_1.default.findById(req.params.id);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        const invitee = await User_1.default.findOne({ email });
        if (!invitee)
            return res.status(404).json({ message: 'User not found with this email' });
        const alreadyMember = project.members.some((m) => m.user.toString() === invitee._id.toString());
        if (alreadyMember)
            return res.status(400).json({ message: 'User is already a member' });
        project.members.push({ user: invitee._id, role: role || 'member', joinedAt: new Date() });
        await project.save();
        await User_1.default.findByIdAndUpdate(invitee._id, { $push: { projects: project._id } });
        res.json({ message: 'Member invited successfully', project });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.inviteMember = inviteMember;
const removeMember = async (req, res) => {
    try {
        const { userId } = req.params;
        const project = await Project_1.default.findById(req.params.id);
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        project.members = project.members.filter((m) => m.user.toString() !== userId);
        await project.save();
        res.json({ message: 'Member removed', project });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.removeMember = removeMember;
//# sourceMappingURL=projectController.js.map