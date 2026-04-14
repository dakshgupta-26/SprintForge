"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.get('/me', auth_1.protect, authController_1.getMe);
router.put('/profile', auth_1.protect, authController_1.updateProfile);
router.put('/change-password', auth_1.protect, authController_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.js.map