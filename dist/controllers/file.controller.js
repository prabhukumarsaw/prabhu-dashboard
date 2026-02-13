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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
exports.uploadFile = uploadFile;
exports.list = list;
exports.getById = getById;
exports.download = download;
exports.remove = remove;
exports.createShare = createShare;
exports.getByShareToken = getByShareToken;
exports.listShares = listShares;
exports.revokeShare = revokeShare;
exports.getStorageUsage = getStorageUsage;
exports.getStats = getStats;
const fileService = __importStar(require("../services/file.service"));
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10) },
});
exports.uploadMiddleware = upload.single('file');
async function uploadFile(req, res) {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'File is required' });
        return;
    }
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const { isPublic, metadata } = req.body;
    try {
        const file = await fileService.uploadFile({
            tenantId,
            userId,
            file: req.file,
            isPublic: isPublic === 'true' || isPublic === true,
            metadata: metadata ? JSON.parse(metadata) : undefined,
        });
        res.status(201).json({ success: true, data: file });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function list(req, res) {
    const tenantId = req.tenantId;
    const { userId, mimeType, search, page, limit } = req.query;
    try {
        const result = await fileService.listFiles(tenantId, {
            userId: userId,
            mimeType: mimeType,
            search: search,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getById(req, res) {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    try {
        const file = await fileService.getFileById(id, tenantId, userId);
        res.json({ success: true, data: file });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
}
async function download(req, res) {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    try {
        const file = await fileService.getFileById(id, tenantId, userId);
        const content = await fileService.getFileContent(id, tenantId, userId);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.send(content);
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
}
async function remove(req, res) {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    try {
        await fileService.deleteFile(id, tenantId, userId);
        res.json({ success: true, message: 'File deleted' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function createShare(req, res) {
    const { fileId } = req.params;
    const { password, expiresAt, maxDownloads } = req.body;
    try {
        const share = await fileService.createFileShare({
            fileId,
            password,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : undefined,
        });
        res.status(201).json({ success: true, data: share });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getByShareToken(req, res) {
    const { token } = req.params;
    const { password } = req.query;
    try {
        const file = await fileService.getFileByShareToken(token, password);
        const content = await fileService.getFileContent(file.id, file.tenantId);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.send(content);
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
}
async function listShares(req, res) {
    const { fileId } = req.params;
    try {
        const shares = await fileService.listFileShares(fileId);
        res.json({ success: true, data: shares });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function revokeShare(req, res) {
    const { fileId, token } = req.params;
    try {
        await fileService.revokeFileShare(token, fileId);
        res.json({ success: true, message: 'Share revoked' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getStorageUsage(req, res) {
    const tenantId = req.tenantId;
    try {
        const usage = await fileService.getTenantStorageUsage(tenantId);
        res.json({ success: true, data: usage });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getStats(req, res) {
    const tenantId = req.tenantId;
    const userId = req.query.userId || req.user?.id;
    try {
        const stats = await fileService.getFileStats(tenantId, userId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=file.controller.js.map