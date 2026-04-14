"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBurndownData = exports.removeTaskFromSprint = exports.addTaskToSprint = exports.completeSprint = exports.startSprint = exports.updateSprint = exports.getSprint = exports.getSprints = exports.createSprint = void 0;
const Sprint_1 = __importDefault(require("../models/Sprint"));
const Task_1 = __importDefault(require("../models/Task"));
const createSprint = async (req, res) => {
    try {
        const { name, goal, project, startDate, endDate } = req.body;
        const sprint = await Sprint_1.default.create({ name, goal, project, startDate, endDate, createdBy: req.user._id });
        res.status(201).json(sprint);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createSprint = createSprint;
const getSprints = async (req, res) => {
    try {
        const { project } = req.query;
        const sprints = await Sprint_1.default.find({ project })
            .populate({ path: 'tasks', populate: { path: 'assignees', select: 'name avatar' } })
            .sort({ createdAt: -1 });
        res.json(sprints);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSprints = getSprints;
const getSprint = async (req, res) => {
    try {
        const sprint = await Sprint_1.default.findById(req.params.id)
            .populate({ path: 'tasks', populate: [{ path: 'assignees', select: 'name avatar' }, { path: 'reporter', select: 'name avatar' }] });
        if (!sprint)
            return res.status(404).json({ message: 'Sprint not found' });
        res.json(sprint);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSprint = getSprint;
const updateSprint = async (req, res) => {
    try {
        const sprint = await Sprint_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!sprint)
            return res.status(404).json({ message: 'Sprint not found' });
        res.json(sprint);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateSprint = updateSprint;
const startSprint = async (req, res) => {
    try {
        const sprint = await Sprint_1.default.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
        if (!sprint)
            return res.status(404).json({ message: 'Sprint not found' });
        // Calculate total story points
        const tasks = await Task_1.default.find({ sprint: sprint._id });
        const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        sprint.totalPoints = totalPoints;
        await sprint.save();
        res.json(sprint);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.startSprint = startSprint;
const completeSprint = async (req, res) => {
    try {
        const sprint = await Sprint_1.default.findById(req.params.id).populate('tasks');
        if (!sprint)
            return res.status(404).json({ message: 'Sprint not found' });
        const completedTasks = sprint.tasks.filter((t) => t.status === 'done');
        const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        sprint.status = 'completed';
        sprint.completedPoints = completedPoints;
        sprint.velocity = completedPoints;
        await sprint.save();
        res.json(sprint);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.completeSprint = completeSprint;
const addTaskToSprint = async (req, res) => {
    try {
        const { taskId } = req.body;
        await Task_1.default.findByIdAndUpdate(taskId, { sprint: req.params.id });
        await Sprint_1.default.findByIdAndUpdate(req.params.id, { $addToSet: { tasks: taskId } });
        res.json({ message: 'Task added to sprint' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.addTaskToSprint = addTaskToSprint;
const removeTaskFromSprint = async (req, res) => {
    try {
        const { taskId } = req.params;
        await Task_1.default.findByIdAndUpdate(taskId, { sprint: null, status: 'todo', boardColumn: 'todo' });
        await Sprint_1.default.findByIdAndUpdate(req.params.id, { $pull: { tasks: taskId } });
        res.json({ message: 'Task moved to backlog' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.removeTaskFromSprint = removeTaskFromSprint;
const getBurndownData = async (req, res) => {
    try {
        const sprint = await Sprint_1.default.findById(req.params.id).populate('tasks');
        if (!sprint)
            return res.status(404).json({ message: 'Sprint not found' });
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const data = [];
        for (let i = 0; i <= dayCount; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const completedByDay = sprint.tasks
                .filter((t) => t.completedAt && new Date(t.completedAt) <= date)
                .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            data.push({
                day: i, date: date.toISOString().split('T')[0],
                remaining: Math.max(0, totalPoints - completedByDay),
                ideal: Math.round(totalPoints - (totalPoints / dayCount) * i),
            });
        }
        res.json({ sprint, totalPoints, data });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getBurndownData = getBurndownData;
//# sourceMappingURL=sprintController.js.map