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
const exportImportController = __importStar(require("../controllers/export-import.controller"));
const express_validator_1 = require("express-validator");
const lib_1 = require("../lib");
const router = (0, express_1.Router)();
router.use(middleware_1.authRequired);
// Export
router.post('/export', (0, middleware_1.requirePermission)({ permissionCode: 'export:create' }), [
    (0, express_validator_1.body)('resourceType').isIn(['user', 'role', 'permission', 'menu']),
    (0, express_validator_1.body)('format').isIn(['csv', 'json', 'xlsx']),
    (0, express_validator_1.body)('filters').optional().isObject(),
    (0, express_validator_1.body)('fields').optional().isArray(),
], lib_1.validate, exportImportController.exportResources);
router.get('/export/:jobId', [(0, express_validator_1.param)('jobId').isUUID()], lib_1.validate, exportImportController.getExportJob);
// Import
router.post('/import', (0, middleware_1.requirePermission)({ permissionCode: 'import:create' }), [
    (0, express_validator_1.body)('resourceType').isIn(['user', 'role', 'permission', 'menu']),
    (0, express_validator_1.body)('format').isIn(['csv', 'json', 'xlsx']),
    (0, express_validator_1.body)('fileId').isUUID(),
    (0, express_validator_1.body)('options').optional().isObject(),
], lib_1.validate, exportImportController.importResources);
router.get('/import/:jobId', [(0, express_validator_1.param)('jobId').isUUID()], lib_1.validate, exportImportController.getImportJob);
// List jobs
router.get('/jobs', [(0, express_validator_1.query)('type').isIn(['export', 'import'])], lib_1.validate, exportImportController.listJobs);
exports.default = router;
//# sourceMappingURL=export-import.routes.js.map