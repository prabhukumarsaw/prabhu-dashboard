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
exports.exportResources = exportResources;
exports.importResources = importResources;
exports.getExportJob = getExportJob;
exports.getImportJob = getImportJob;
exports.listJobs = listJobs;
const exportImportService = __importStar(require("../services/export-import.service"));
async function exportResources(req, res) {
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const { resourceType, format, filters, fields } = req.body;
    if (!resourceType || !format) {
        res.status(400).json({ success: false, message: 'resourceType and format are required' });
        return;
    }
    try {
        const result = await exportImportService.exportResources({
            tenantId,
            userId,
            resourceType,
            format,
            filters,
            fields,
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function importResources(req, res) {
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const { resourceType, format, fileId, options } = req.body;
    if (!resourceType || !format || !fileId) {
        res.status(400).json({ success: false, message: 'resourceType, format, and fileId are required' });
        return;
    }
    try {
        const result = await exportImportService.importResources({
            tenantId,
            userId,
            resourceType,
            format,
            fileId,
            options,
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getExportJob(req, res) {
    const { jobId } = req.params;
    const userId = req.user?.id;
    try {
        const job = await exportImportService.getExportJob(jobId, userId);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }
        res.json({ success: true, data: job });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getImportJob(req, res) {
    const { jobId } = req.params;
    const userId = req.user?.id;
    try {
        const job = await exportImportService.getImportJob(jobId, userId);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }
        res.json({ success: true, data: job });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function listJobs(req, res) {
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const { type } = req.query;
    if (!type || (type !== 'export' && type !== 'import')) {
        res.status(400).json({ success: false, message: 'type must be "export" or "import"' });
        return;
    }
    try {
        const jobs = await exportImportService.listJobs(tenantId, userId, type);
        res.json({ success: true, data: jobs });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=export-import.controller.js.map