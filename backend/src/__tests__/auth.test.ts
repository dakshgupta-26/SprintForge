import request from 'supertest';
import express from 'express';
import authRouter from '../routes/auth';
import User from '../models/User';

// Mock the User model
jest.mock('../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Authentication (TC-01 to TC-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-01: Valid name, email, password -> Account created, JWT returned', async () => {
    const mockUser = { _id: 'user123', name: 'John Doe', email: 'john@example.com' };
    
    // Mock no existing user
    (User.findOne as jest.Mock).mockResolvedValue(null);
    // Mock user creation
    (User.create as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'John Doe', email: 'john@example.com', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('john@example.com');
  });

  it('TC-02: Duplicate Registration -> Error: Email already in use', async () => {
    // Mock existing user found
    (User.findOne as jest.Mock).mockResolvedValue({ email: 'john@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'John Doe', email: 'john@example.com', password: 'Password123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('TC-03: User Login with Correct credentials -> JWT token returned', async () => {
    const mockUser = { 
      _id: 'user123', 
      email: 'john@example.com',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    // Mock findOne to return query object with .select() chained
    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('TC-04: Invalid Login with Wrong password -> Error: Invalid credentials', async () => {
    const mockUser = { 
      _id: 'user123', 
      email: 'john@example.com',
      comparePassword: jest.fn().mockResolvedValue(false) // Fails password check
    };

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});