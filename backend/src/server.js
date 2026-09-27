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
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400,
  })
);

// Body Parsers & Request Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Mount Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/videos', videoRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'AI Video Orchestrator API',
    version: '2.0.0',
    status: 'online',
    docs: '/api/health',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AI Video Orchestrator Server running on port ${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Health check: http://localhost:${config.port}/api/health`);
  console.log(`=======================================================`);
});

const handleShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
