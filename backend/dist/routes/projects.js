"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controllers/projectController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.route('/').get(projectController_1.getProjects).post(projectController_1.createProject);
router.route('/:id').get(projectController_1.getProject).put(projectController_1.updateProject).delete(projectController_1.deleteProject);
router.post('/:id/invite', projectController_1.inviteMember);
router.delete('/:id/members/:userId', projectController_1.removeMember);
exports.default = router;
//# sourceMappingURL=projects.js.map