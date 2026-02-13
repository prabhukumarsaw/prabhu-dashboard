"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const logger_1 = require("../lib/logger");
function notFound(req, res) {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
}
function errorHandler(err, req, res, _next) {
    const status = err.statusCode ?? 500;
    logger_1.logger.error({ err, path: req.path, method: req.method });
    res.status(status).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
}
//# sourceMappingURL=error.middleware.js.map