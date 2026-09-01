import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dotenv.config();

// Ensure Node.js resolves MongoDB Atlas SRV records smoothly on local Windows dev networks
// On Linux/Docker (Railway), preserve container default DNS (/etc/resolv.conf)
if (process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

// Routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import sprintRoutes from './routes/sprints';
import issueRoutes from './routes/issues';
import notificationRoutes from './routes/notifications';
import teamRoutes from './routes/teams';
import wikiRoutes from './routes/wiki';
import analyticsRoutes from './routes/analytics';
import messageRoutes from './routes/messages';
import callRoutes from './routes/calls';

// Socket handler
import { initSocket } from './socket';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { mongoSanitize } from './middleware/sanitize';
import { csrfProtection, isOriginAllowed } from './middleware/csrf';

const app = express();
const server = http.createServer(app);

// Enable trust proxy for Railway, Render, Vercel, and Cloudflare reverse proxies
app.set('trust proxy', 1);

const corsOriginCallback = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  callback(null, isOriginAllowed(origin));
};

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: corsOriginCallback,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app for use in controllers
app.set('io', io);
initSocket(io);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    xContentTypeOptions: true,
    frameguard: false, // Frameguard disabled to allow embedded PDF/image attachments across configured origins
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true,
  })
);

// CORS configuration with credentials support
app.use(
  cors({
    origin: corsOriginCallback,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// NoSQL Injection Defense (strips $ and . keys from body, query, params)
app.use(mongoSanitize);

// CSRF Defense for mutating requests
app.use(csrfProtection);

// Serve local static assets (if any)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting on authentication routes
app.use('/api/auth', rateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/calls', callRoutes);

// Health checks
import { verifyEmailTransporter, getEmailHealthStatus } from './services/emailService';

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health/email', async (req, res) => {
  try {
    const emailStatus = await getEmailHealthStatus();
    res.json(emailStatus);
  } catch {
    res.status(500).json({
      configured: false,
      provider: 'mailjet',
      status: 'degraded',
    });
  }
});

// Centralized error handler
app.use(errorHandler);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sprintforge';

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 SprintForge API running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO ready`);
    });

    // Verify email service on backend startup without blocking port listening
    verifyEmailTransporter().catch((err) => {
      console.warn('⚠️ Non-blocking email startup check error:', err?.message || err);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

export default app;

