"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.route('/').get(taskController_1.getTasks).post(taskController_1.createTask);
router.get('/backlog/:projectId', taskController_1.getBacklog);
router.route('/:id').get(taskController_1.getTask).put(taskController_1.updateTask).delete(taskController_1.deleteTask);
router.put('/:id/status', taskController_1.updateTaskStatus);
router.post('/:id/comments', taskController_1.addComment);
exports.default = router;
//# sourceMappingURL=tasks.js.map