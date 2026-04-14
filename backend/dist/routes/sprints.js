"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sprintController_1 = require("../controllers/sprintController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.route('/').get(sprintController_1.getSprints).post(sprintController_1.createSprint);
router.route('/:id').get(sprintController_1.getSprint).put(sprintController_1.updateSprint);
router.put('/:id/start', sprintController_1.startSprint);
router.put('/:id/complete', sprintController_1.completeSprint);
router.post('/:id/tasks', sprintController_1.addTaskToSprint);
router.delete('/:id/tasks/:taskId', sprintController_1.removeTaskFromSprint);
router.get('/:id/burndown', sprintController_1.getBurndownData);
exports.default = router;
//# sourceMappingURL=sprints.js.map