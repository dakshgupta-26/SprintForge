"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.get('/project/:projectId', analyticsController_1.getProjectAnalytics);
router.get('/project/:projectId/team', analyticsController_1.getTeamProductivity);
exports.default = router;
//# sourceMappingURL=analytics.js.map