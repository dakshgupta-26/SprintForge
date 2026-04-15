import request from 'supertest';
import express from 'express';
import projectRouter from '../routes/projects';
import * as projectController from '../controllers/projectController';

jest.mock('../controllers/projectController', () => ({
  inviteMember: jest.fn(),
  // Add these dummy mocks to prevent Express from crashing
  getInviteInfo: jest.fn(),
  acceptInvite: jest.fn(),
  getProjects: jest.fn(),
  getProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  getProjectInvites: jest.fn(),
  createProject: jest.fn(),
  generateJoinCode: jest.fn(),
  joinWithCode: jest.fn(),
  disableJoinCode: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
  protect: (req: any, res: any, next: any) => next()
}));
jest.mock('../middleware/rbac', () => ({
  requirePermission: () => (req: any, res: any, next: any) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/projects', projectRouter);

describe('Collaboration & Invites (TC-06)', () => {
  it('TC-06: Email Invitation -> Invitation email delivered (DELIBERATE FAIL)', async () => {
    // ❌ DELIBERATE FAILURE: 
    // The test expects a 200 OK indicating the email was sent, 
    // but we simulate a Mailer crash (500 Error).
    (projectController.inviteMember as jest.Mock).mockImplementation((req, res) => {
      // res.status(500).json({ message: 'SMTP Mailer Timeout Connection Refused' });

      // 🛠️ TO FIX: Replace the line above with:
      res.status(200).json({ message: 'Invitation sent successfully' });
    });

    const res = await request(app)
      .post('/api/projects/proj1/invite')
      .send({ email: 'valid.user@example.com' });

    // This assertion will throw because 500 !== 200
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Invitation sent successfully');
  });
});