import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { initializeSocketIO } from './services/realtime.service';

const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);

const server = httpServer.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port} (${config.env})`);
  logger.info(`API prefix: ${config.apiPrefix}`);
  logger.info('Socket.IO initialized');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
