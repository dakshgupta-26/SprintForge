"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
// Issues are stored as Tasks with type='bug'
// This route just provides a filtered view
router.get('/', async (req, res) => {
    try {
        const Task = require('../models/Task').default;
        const { project } = req.query;
        const issues = await Task.find({ project, type: 'bug' })
            .populate('assignees', 'name avatar')
            .populate('reporter', 'name avatar')
            .sort({ createdAt: -1 });
        res.json(issues);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=issues.js.map