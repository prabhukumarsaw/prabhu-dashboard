import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'iam-saas' },
  transports: [
    new winston.transports.Console({
      format: config.env === 'production' ? logFormat : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});
