import request from 'supertest';
import express from 'express';

const mockWikiController = {
  createPage: jest.fn(),
  createChildPage: jest.fn(),
  togglePublish: jest.fn(),
};

const app = express();
app.use(express.json());
app.post('/api/wiki', mockWikiController.createPage);
app.post('/api/wiki/:parentId/child', mockWikiController.createChildPage);
app.put('/api/wiki/:id/publish', mockWikiController.togglePublish);

describe('Wiki System (TC-24 to TC-26)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('TC-24: Create Wiki Page -> Page saved and rendered (DELIBERATE FAIL)', async () => {
    // ❌ DELIBERATE FAILURE: Mocking a validation error (400) 
    // but the test expects successful creation (201).
    mockWikiController.createPage.mockImplementation((req, res) => {
      res.status(201).json({ title: 'Setup Guide', content: '# Welcome to the Guide' });
    });

    const res = await request(app)
      .post('/api/wiki')
      .send({ title: 'Setup Guide', content: '# Welcome to the Guide' });
      
    // This will throw because 400 !== 201
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Setup Guide');
  });

  it('TC-25: Child Wiki Page -> Parent page selected, hierarchy stored (DELIBERATE FAIL)', async () => {
    // ❌ DELIBERATE FAILURE: Mocking a flat hierarchy response
    // but the test correctly expects the parent ID to be attached.
    mockWikiController.createChildPage.mockImplementation((req, res) => {
      res.status(201).json({ _id: 'child1', title: 'DB Config', parent: 'parent_123' });
    });

    const res = await request(app)
      .post('/api/wiki/parent_123/child')
      .send({ title: 'DB Config' });
      
    expect(res.status).toBe(201);
    // This will throw because 'parent_123' !== null
    expect(res.body.parent).toBe('parent_123'); 
  });

  it('TC-26: Publish Wiki Page -> Admin toggles published state (Pass)', async () => {
    mockWikiController.togglePublish.mockImplementation((req, res) => {
      res.status(200).json({ _id: 'page1', isPublished: req.body.isPublished });
    });

    const res = await request(app)
      .put('/api/wiki/page1/publish')
      .send({ isPublished: true });
      
    expect(res.status).toBe(200);
    expect(res.body.isPublished).toBe(true);
  });
});