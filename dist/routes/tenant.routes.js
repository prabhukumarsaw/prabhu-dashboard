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
const tenantController = __importStar(require("../controllers/tenant.controller"));
const express_validator_1 = require("express-validator");
const lib_1 = require("../lib");
const router = (0, express_1.Router)();
router.get('/', middleware_1.authRequired, (0, middleware_1.requirePermission)({ permissionCode: 'tenant:read' }), [(0, express_validator_1.query)('page').optional().isInt({ min: 1 }), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }), (0, express_validator_1.query)('search').optional().isString()], lib_1.validate, tenantController.list);
router.get('/slug/:slug', middleware_1.authRequired, [(0, express_validator_1.param)('slug').notEmpty()], lib_1.validate, tenantController.getBySlug);
router.get('/:id', middleware_1.authRequired, (0, middleware_1.requirePermission)({ permissionCode: 'tenant:read' }), [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, tenantController.getById);
router.post('/', middleware_1.authRequired, (0, middleware_1.requirePermission)({ permissionCode: 'tenant:create' }), [(0, express_validator_1.body)('name').notEmpty().trim(), (0, express_validator_1.body)('slug').notEmpty().trim(), (0, express_validator_1.body)('domain').optional().trim(), (0, express_validator_1.body)('logo').optional().trim(), (0, express_validator_1.body)('settings').optional().isObject()], lib_1.validate, tenantController.create);
router.patch('/:id', middleware_1.authRequired, (0, middleware_1.requirePermission)({ permissionCode: 'tenant:update' }), [(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.body)('name').optional().trim(), (0, express_validator_1.body)('slug').optional().trim(), (0, express_validator_1.body)('domain').optional().trim(), (0, express_validator_1.body)('logo').optional().trim(), (0, express_validator_1.body)('settings').optional().isObject(), (0, express_validator_1.body)('isActive').optional().isBoolean()], lib_1.validate, tenantController.update);
router.post('/:tenantId/modules/:moduleId/enable', middleware_1.authRequired, (0, middleware_1.requirePermission)({ permissionCode: 'tenant:update' }), tenantController.enableModule);
router.post('/:tenantId/modules/:moduleId/disable', middleware_1.authRequired, (0, middleware_1.requirePermission)({ permissionCode: 'tenant:update' }), tenantController.disableModule);
exports.default = router;
//# sourceMappingURL=tenant.routes.js.map