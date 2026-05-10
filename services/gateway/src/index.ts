import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import bodyParser from 'body-parser';
import 'dotenv/config';

import { logger } from './services/logger';
import { authRouter } from './routes/auth';
import { meshRouter } from './routes/mesh';
import { projectRouter } from './routes/project';
import { claudeRouter } from './routes/claude';
import { errorHandler } from './middleware/error';
import { requireAuth } from './middleware/auth';
import { WebSocketHandler } from './services/websocket';

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;
const HOST = process.env.GATEWAY_HOST || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API version
app.get('/version', (req, res) => {
  res.json({ version: '0.1.0', service: 'gateway' });
});

// Routes (public)
app.use('/api/auth', authRouter);

// Routes (protected)
app.use('/api/mesh', requireAuth, meshRouter);
app.use('/api/project', requireAuth, projectRouter);
app.use('/api/claude', requireAuth, claudeRouter);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Create HTTP server for WebSocket upgrade
const server = createServer(app);

// WebSocket handling
const wss = new WebSocketServer({ server, path: '/ws' });
const wsHandler = new WebSocketHandler(wss);
wsHandler.initialize();

wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');
  wsHandler.handleConnection(ws);
});

// Start server
server.listen(PORT, HOST as string, () => {
  logger.info(`Gateway listening on ${HOST}:${PORT}`);
  logger.info(`Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, server };
