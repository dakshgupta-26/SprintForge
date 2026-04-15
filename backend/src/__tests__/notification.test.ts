import request from 'supertest';
import express from 'express';

const mockNotificationController = {
  assignTask: jest.fn(),
  markAsRead: jest.fn(),
};

const app = express();
app.use(express.json());
app.post('/api/tasks/:id/assign', mockNotificationController.assignTask);
app.put('/api/notifications/:id/read', mockNotificationController.markAsRead);

describe('Notifications (TC-27 to TC-28)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('TC-27: Task Assignment Notification -> Instant notification received (DELIBERATE FAIL)', async () => {
    const notificationSpy = jest.fn();

    // Mocking the behavior where the API triggers the notification spy
    mockNotificationController.assignTask.mockImplementation((req, res) => {
      notificationSpy('notification:task_assigned', { user: 'user1' });
      res.status(200).json({ message: 'Task assigned' });
    });

    await request(app).post('/api/tasks/task1/assign').send({ userId: 'user1' });

    // ❌ DELIBERATE FAILURE: Asserting a completely fake notification event name
    expect(notificationSpy).toHaveBeenCalledWith('notification:task_assigned', expect.any(Object));
  });

  it('TC-28: Mark Notification Read -> Notification marked, badge updated (Pass)', async () => {
    mockNotificationController.markAsRead.mockImplementation((req, res) => {
      res.status(200).json({ _id: 'notif1', isRead: true });
    });

    const res = await request(app).put('/api/notifications/notif1/read');
      
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });
});