"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification_1.default.find({ recipient: req.user._id })
            .populate('sender', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification_1.default.countDocuments({ recipient: req.user._id, isRead: false });
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        await Notification_1.default.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await Notification_1.default.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (req, res) => {
    try {
        await Notification_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notificationController.js.map