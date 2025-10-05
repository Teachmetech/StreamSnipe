import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { config } from './config';
import { initializeDatabase } from './database/schema';
import { initWebSocket } from './websocket';
import { monitorService } from './services/monitor';

// Import routes
import authRoutes from './routes/auth';
import channelsRoutes from './routes/channels';
import recordingsRoutes from './routes/recordings';
import settingsRoutes from './routes/settings';
import statusRoutes from './routes/status';

// Initialize database
initializeDatabase();

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/recordings', recordingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/status', statusRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from frontend build (production)
if (config.nodeEnv === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize WebSocket
initWebSocket(server);

// Start monitor service
monitorService.start();

// Cleanup on exit
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  monitorService.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  monitorService.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║         StreamSnipe Server            ║
  ╠═══════════════════════════════════════╣
  ║  Server:  http://localhost:${config.port}     ║
  ║  WebSocket: ws://localhost:${config.port}/ws ║
  ║  Environment: ${config.nodeEnv.padEnd(18)} ║
  ║  Auth: ${(config.auth.enabled ? 'Enabled' : 'Disabled').padEnd(23)} ║
  ╚═══════════════════════════════════════╝
  `);
});

export { app, server };

