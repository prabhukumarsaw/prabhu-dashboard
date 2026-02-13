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
const roleController = __importStar(require("../controllers/role.controller"));
const express_validator_1 = require("express-validator");
const lib_1 = require("../lib");
const router = (0, express_1.Router)();
router.use(middleware_1.authRequired);
router.get('/', (0, middleware_1.requirePermission)({ permissionCode: 'role:read' }), roleController.list);
router.get('/:id', (0, middleware_1.requirePermission)({ permissionCode: 'role:read' }), [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, roleController.getById);
router.post('/', (0, middleware_1.requirePermission)({ permissionCode: 'role:create' }), [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('code').notEmpty().trim(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('permissionIds').optional().isArray(),
    (0, express_validator_1.body)('menuIds').optional().isArray(),
], lib_1.validate, roleController.create);
router.patch('/:id', (0, middleware_1.requirePermission)({ permissionCode: 'role:update' }), [(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.body)('name').optional().trim(), (0, express_validator_1.body)('code').optional().trim(), (0, express_validator_1.body)('description').optional().trim(), (0, express_validator_1.body)('isActive').optional().isBoolean(), (0, express_validator_1.body)('permissionIds').optional().isArray(), (0, express_validator_1.body)('menuIds').optional().isArray()], lib_1.validate, roleController.update);
router.delete('/:id', (0, middleware_1.requirePermission)({ permissionCode: 'role:delete' }), [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, roleController.remove);
exports.default = router;
//# sourceMappingURL=role.routes.js.map