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
const projectSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, uppercase: true, trim: true, maxlength: 6 },
    description: { type: String },
    icon: { type: String },
    color: { type: String, default: '#6366f1' },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
        {
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
            joinedAt: { type: Date, default: Date.now },
        },
    ],
    isPrivate: { type: Boolean, default: false },
    type: { type: String, enum: ['scrum', 'kanban'], default: 'scrum' },
    status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
    startDate: { type: Date },
    endDate: { type: Date },
    sprints: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Sprint' }],
    boards: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Board' }],
    tags: [{ type: String }],
    githubRepo: { type: String },
    slackWebhook: { type: String },
}, { timestamps: true });
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
exports.default = mongoose_1.default.model('Project', projectSchema);
//# sourceMappingURL=Project.js.map