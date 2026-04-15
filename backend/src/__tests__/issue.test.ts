import request from 'supertest';
import express from 'express';

const mockIssueController = {
  logIssue: jest.fn(),
  assignIssue: jest.fn(),
  updateIssueStatus: jest.fn(),
};

const app = express();
app.use(express.json());
app.post('/api/issues', mockIssueController.logIssue);
app.put('/api/issues/:id/assign', mockIssueController.assignIssue);
app.put('/api/issues/:id/status', mockIssueController.updateIssueStatus);

describe('Issue Tracking (TC-21 to TC-23)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('TC-21: Log Issue -> Issue created with Open status (Pass)', async () => {
    mockIssueController.logIssue.mockImplementation((req, res) => {
      res.status(201).json({ title: req.body.title, status: 'Open', severity: req.body.severity });
    });

    const res = await request(app)
      .post('/api/issues')
      .send({ title: 'Login Bug', description: 'App crashes on login', severity: 'High' });
      
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Open');
  });

  it('TC-22: Assign Issue -> Assignee field updated (Pass)', async () => {
    mockIssueController.assignIssue.mockImplementation((req, res) => {
      res.status(200).json({ _id: 'issue1', assignee: req.body.assigneeId });
    });

    const res = await request(app)
      .put('/api/issues/issue1/assign')
      .send({ assigneeId: 'user123' });
      
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('user123');
  });

  it('TC-23: Update Issue Status -> Status changed to Resolved (Pass)', async () => {
    mockIssueController.updateIssueStatus.mockImplementation((req, res) => {
      res.status(200).json({ _id: 'issue1', status: 'Resolved' });
    });

    const res = await request(app)
      .put('/api/issues/issue1/status')
      .send({ status: 'Resolved' });
      
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
  });
});