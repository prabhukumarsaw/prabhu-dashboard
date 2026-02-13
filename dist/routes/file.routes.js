"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const fileController = __importStar(require("../controllers/file.controller"));
const express_validator_1 = require("express-validator");
const lib_1 = require("../lib");
const router = (0, express_1.Router)();
router.use(middleware_1.authRequired);
// Upload file
router.post('/', (0, middleware_1.requirePermission)({ permissionCode: 'file:create' }), fileController.uploadMiddleware, fileController.uploadFile);
// List files
router.get('/', [
    (0, express_validator_1.query)('userId').optional().isUUID(),
    (0, express_validator_1.query)('mimeType').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
], lib_1.validate, fileController.list);
// Get file info
router.get('/:id', [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, fileController.getById);
// Download file
router.get('/:id/download', [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, fileController.download);
// Delete file
router.delete('/:id', (0, middleware_1.requirePermission)({ permissionCode: 'file:delete' }), [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, fileController.remove);
// File sharing
router.post('/:fileId/share', [(0, express_validator_1.param)('fileId').isUUID(), (0, express_validator_1.query)('password').optional().isString(), (0, express_validator_1.query)('expiresAt').optional().isISO8601()], lib_1.validate, fileController.createShare);
router.get('/share/:token', fileController.getByShareToken);
router.get('/:fileId/shares', [(0, express_validator_1.param)('fileId').isUUID()], lib_1.validate, fileController.listShares);
router.delete('/:fileId/share/:token', [(0, express_validator_1.param)('fileId').isUUID(), (0, express_validator_1.param)('token').isString()], lib_1.validate, fileController.revokeShare);
// Storage usage
router.get('/storage/usage', fileController.getStorageUsage);
// Statistics
router.get('/stats', (0, middleware_1.requirePermission)({ permissionCode: 'file:read' }), [(0, express_validator_1.query)('userId').optional().isUUID()], lib_1.validate, fileController.getStats);
exports.default = router;
//# sourceMappingURL=file.routes.js.map