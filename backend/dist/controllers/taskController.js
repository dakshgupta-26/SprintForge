"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBacklog = exports.addComment = exports.deleteTask = exports.updateTaskStatus = exports.updateTask = exports.getTask = exports.getTasks = exports.createTask = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const Sprint_1 = __importDefault(require("../models/Sprint"));
const Notification_1 = __importDefault(require("../models/Notification"));
const Comment_1 = __importDefault(require("../models/Comment"));
// AI estimation logic
const estimateStoryPoints = (title, description, priority) => {
    const wordCount = (title + ' ' + description).split(' ').length;
    const complexityScore = Math.min(Math.ceil(wordCount / 10), 8);
    const priorityMultiplier = { low: 1, medium: 1.5, high: 2, critical: 3 }[priority] || 1;
    const points = [1, 2, 3, 5, 8, 13, 21];
    const rawEstimate = Math.round(complexityScore * priorityMultiplier);
    return points[Math.min(rawEstimate - 1, points.length - 1)] || 3;
};
const createTask = async (req, res) => {
    try {
        const { title, description, type, priority, project, sprint, assignees, labels, storyPoints, dueDate, boardColumn } = req.body;
        const aiEstimate = estimateStoryPoints(title, description || '', priority || 'medium');
        const task = await Task_1.default.create({
            title, description, type, priority, project, sprint, assignees, labels,
            storyPoints: storyPoints || aiEstimate, dueDate, boardColumn: boardColumn || 'todo',
            reporter: req.user._id, aiEstimate,
        });
        if (sprint) {
            await Sprint_1.default.findByIdAndUpdate(sprint, { $push: { tasks: task._id } });
        }
        // Notify assignees
        if (assignees?.length) {
            const notifications = assignees.map((userId) => ({
                recipient: userId, sender: req.user._id, type: 'task_assigned',
                title: 'New task assigned', message: `You were assigned to: ${title}`,
                link: `/tasks/${task._id}`,
            }));
            await Notification_1.default.insertMany(notifications);
            const io = req.app.get('io');
            assignees.forEach((userId) => io?.to(userId).emit('notification', { type: 'task_assigned' }));
        }
        const populated = await task.populate(['assignees', 'reporter']);
        res.status(201).json(populated);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    try {
        const { project, sprint, status, assignee, type, priority, search } = req.query;
        const filter = {};
        if (project)
            filter.project = project;
        if (sprint)
            filter.sprint = sprint;
        if (status)
            filter.status = status;
        if (assignee)
            filter.assignees = assignee;
        if (type)
            filter.type = type;
        if (priority)
            filter.priority = priority;
        if (search)
            filter.title = { $regex: search, $options: 'i' };
        const tasks = await Task_1.default.find(filter)
            .populate('assignees', 'name avatar email')
            .populate('reporter', 'name avatar')
            .sort({ boardOrder: 1, createdAt: -1 });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTasks = getTasks;
const getTask = async (req, res) => {
    try {
        const task = await Task_1.default.findById(req.params.id)
            .populate('assignees', 'name avatar email')
            .populate('reporter', 'name avatar email')
            .populate('subtasks')
            .populate({ path: 'comments', populate: { path: 'author', select: 'name avatar' } });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTask = getTask;
const updateTask = async (req, res) => {
    try {
        const task = await Task_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('assignees', 'name avatar email')
            .populate('reporter', 'name avatar');
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        const io = req.app.get('io');
        io?.to(`project:${task.project}`).emit('task:updated', task);
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateTask = updateTask;
const updateTaskStatus = async (req, res) => {
    try {
        const { status, boardColumn, boardOrder } = req.body;
        const task = await Task_1.default.findByIdAndUpdate(req.params.id, { status, boardColumn, boardOrder, ...(status === 'done' ? { completedAt: new Date() } : {}) }, { new: true }).populate('assignees', 'name avatar');
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        const io = req.app.get('io');
        io?.to(`project:${task.project}`).emit('task:moved', { taskId: task._id, status, boardColumn, boardOrder });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateTaskStatus = updateTaskStatus;
const deleteTask = async (req, res) => {
    try {
        const task = await Task_1.default.findByIdAndDelete(req.params.id);
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        if (task.sprint)
            await Sprint_1.default.findByIdAndUpdate(task.sprint, { $pull: { tasks: task._id } });
        res.json({ message: 'Task deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteTask = deleteTask;
const addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const comment = await Comment_1.default.create({ content, author: req.user._id, task: req.params.id });
        await Task_1.default.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } });
        const populated = await comment.populate('author', 'name avatar');
        const io = req.app.get('io');
        io?.to(`task:${req.params.id}`).emit('comment:added', populated);
        res.status(201).json(populated);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.addComment = addComment;
const getBacklog = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await Task_1.default.find({ project: projectId, sprint: null })
            .populate('assignees', 'name avatar')
            .sort({ boardOrder: 1 });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getBacklog = getBacklog;
//# sourceMappingURL=taskController.js.map