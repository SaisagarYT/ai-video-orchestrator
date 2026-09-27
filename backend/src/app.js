import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

// Route Imports
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import sceneRoutes from './routes/scene.routes.js';
import videoRoutes from './routes/video.routes.js';

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://ai-video-orchestrator.pages.dev',
  config.frontendUrl,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.endsWith('.pages.dev') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Idempotency-Key', 'X-Idempotency-Key'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (!config.isTest) {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// Mount Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/videos', videoRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI Video Orchestrator API',
    version: '2.0.0',
    slice: 'Slice 3 — Provider Architecture + Real LLM Integration',
    status: 'online',
    health: '/api/health',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
