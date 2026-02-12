import app from './app';
import { config } from './config';
import { logger } from './lib/logger';

const server = app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port} (${config.env})`);
  logger.info(`API prefix: ${config.apiPrefix}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
