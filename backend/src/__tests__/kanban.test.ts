import request from 'supertest';
import express from 'express';
import { updateTaskStatus } from '../controllers/taskController';
import Task from '../models/Task';

jest.mock('../models/Task', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn()
  }
}));
// Prevent other models imported in taskController from crashing Mongoose
jest.mock('../models/Sprint', () => ({ __esModule: true, default: {} }));
jest.mock('../models/Notification', () => ({ __esModule: true, default: {} }));
jest.mock('../models/Comment', () => ({ __esModule: true, default: {} }));

const app = express();
app.use(express.json());

// Mock Auth & set up route directly for testing controller
app.put('/api/tasks/:id/status', (req: any, res: any, next) => {
  req.user = { _id: 'user1' };
  next();
}, updateTaskStatus);

describe('Kanban Interactions (TC-09, TC-10)', () => {
  let mockEmit: jest.Mock;
  let mockTo: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Socket.IO App instance attached to express
    mockEmit = jest.fn();
    mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
    app.set('io', { to: mockTo });
  });

  it('TC-09: Kanban Drag and Drop -> Status updated, board synced (Pass)', async () => {
    const mockUpdatedTask = {
      _id: 'task1',
      project: 'proj1',
      status: 'in_progress',
      boardColumn: 'doing'
    };

    (Task.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockUpdatedTask)
    });

    const res = await request(app)
      .put('/api/tasks/task1/status')
      .send({ status: 'in_progress', boardColumn: 'doing', boardOrder: 1 });

    expect(res.status).toBe(200);
    // Check if task status updated in DB
    expect(Task.findByIdAndUpdate).toHaveBeenCalled();
    // Check if board synced via websockets
    expect(mockTo).toHaveBeenCalledWith('project:proj1');
    expect(mockEmit).toHaveBeenCalledWith('task:moved', expect.any(Object));
  });

  it('TC-10: Real-time Board Sync -> Board updates without refresh (DELIBERATE FAIL)', async () => {
    const mockUpdatedTask = {
      _id: 'task2',
      project: 'proj2',
      status: 'done',
      boardColumn: 'completed'
    };

    (Task.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockUpdatedTask)
    });

    await request(app)
      .put('/api/tasks/task2/status')
      .send({ status: 'done', boardColumn: 'completed', boardOrder: 2 });

    // ❌ DELIBERATE FAILURE:
    // The controller correctly emits 'task:moved', but we intentionally assert 
    // that it emitted 'board:refresh:all', which never actually happens.
    // 🛠️ TO FIX: Change 'board:refresh:all' to 'task:moved'
    expect(mockEmit).toHaveBeenCalledWith('task:moved', expect.any(Object));
  });
});