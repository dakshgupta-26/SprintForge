"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        const user = await User_1.default.create({ name, email, password });
        const token = generateToken(user._id.toString());
        res.status(201).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        user.lastSeen = new Date();
        await user.save({ validateBeforeSave: false });
        const token = generateToken(user._id.toString());
        res.json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).populate('projects', 'name key color icon');
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const { name, bio, title, avatar } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.user._id, { name, bio, title, avatar }, { new: true, runValidators: true });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User_1.default.findById(req.user._id).select('+password');
        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        await user.save();
        const token = generateToken(user._id.toString());
        res.json({ token, message: 'Password changed successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=authController.js.map