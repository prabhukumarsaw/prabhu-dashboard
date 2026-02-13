"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./lib/logger");
const realtime_service_1 = require("./services/realtime.service");
const httpServer = (0, http_1.createServer)(app_1.default);
// Initialize Socket.IO
(0, realtime_service_1.initializeSocketIO)(httpServer);
const server = httpServer.listen(config_1.config.port, () => {
    logger_1.logger.info(`Server listening on port ${config_1.config.port} (${config_1.config.env})`);
    logger_1.logger.info(`API prefix: ${config_1.config.apiPrefix}`);
    logger_1.logger.info('Socket.IO initialized');
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down');
    server.close(() => process.exit(0));
});
//# sourceMappingURL=index.js.map