"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const taskSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ['story', 'task', 'bug', 'epic', 'subtask'], default: 'task' },
    status: { type: String, default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true },
    sprint: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Sprint' },
    assignees: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    reporter: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Task' },
    subtasks: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Task' }],
    labels: [{ type: String }],
    storyPoints: { type: Number, min: 0, max: 100 },
    estimatedHours: { type: Number },
    loggedHours: { type: Number, default: 0 },
    dueDate: { type: Date },
    startDate: { type: Date },
    completedAt: { type: Date },
    attachments: [
        {
            name: String,
            url: String,
            size: Number,
            uploadedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            uploadedAt: { type: Date, default: Date.now },
        },
    ],
    comments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Comment' }],
    linkedIssues: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Task' }],
    githubPRs: [{ type: String }],
    boardColumn: { type: String },
    boardOrder: { type: Number, default: 0 },
    aiEstimate: { type: Number },
    watchers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
taskSchema.index({ project: 1 });
taskSchema.index({ sprint: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ status: 1 });
exports.default = mongoose_1.default.model('Task', taskSchema);
//# sourceMappingURL=Task.js.map