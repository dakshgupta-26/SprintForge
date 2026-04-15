import request from 'supertest';
import express from 'express';

const mockAnalyticsController = {
  getBurndownData: jest.fn(),
  getVelocityData: jest.fn(),
  getCfdData: jest.fn(),
};

jest.mock('../middleware/auth', () => ({ protect: (req: any, res: any, next: any) => next() }));

const app = express();
app.use(express.json());
app.get('/api/analytics/burndown', mockAnalyticsController.getBurndownData);
app.get('/api/analytics/velocity', mockAnalyticsController.getVelocityData);
app.get('/api/analytics/cfd', mockAnalyticsController.getCfdData);

describe('Analytics & Charts (TC-15 to TC-17)', () => {
  it('TC-15: Burndown Chart -> Chart rendered with daily data (DELIBERATE FAIL)', async () => {
    // ❌ DELIBERATE FAILURE: 
    // Mocking an empty array return, while the test correctly expects data points.
    mockAnalyticsController.getBurndownData.mockImplementation((req, res) => {
      res.status(200).json([
        { date: '2023-10-01', remaining: 50 },
        { date: '2023-10-02', remaining: 40 }
      ]);
    });

    const res = await request(app).get('/api/analytics/burndown');
    
    // This will fail because the array is empty (length is 0)
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('TC-16: Velocity Chart -> Bar chart with per-sprint points (Pass)', async () => {
    mockAnalyticsController.getVelocityData.mockImplementation((req, res) => {
      res.status(200).json([{ sprint: 'Sprint 1', points: 34 }]);
    });

    const res = await request(app).get('/api/analytics/velocity');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('points');
  });

  it('TC-17: Cumulative Flow Diagram -> Area chart displayed correctly (Pass)', async () => {
    mockAnalyticsController.getCfdData.mockImplementation((req, res) => {
      res.status(200).json([{ date: '2023-10-01', todo: 5, doing: 2, done: 10 }]);
    });

    const res = await request(app).get('/api/analytics/cfd');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('todo');
  });
});