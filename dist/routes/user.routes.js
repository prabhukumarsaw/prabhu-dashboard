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
const userController = __importStar(require("../controllers/user.controller"));
const express_validator_1 = require("express-validator");
const lib_1 = require("../lib");
const router = (0, express_1.Router)();
router.use(middleware_1.authRequired);
router.get('/', (0, middleware_1.requirePermission)({ permissionCode: 'user:read' }), [(0, express_validator_1.query)('page').optional().isInt({ min: 1 }), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }), (0, express_validator_1.query)('search').optional().isString()], lib_1.validate, userController.list);
router.get('/:id', (0, middleware_1.requirePermission)({ permissionCode: 'user:read' }), [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, userController.getById);
router.post('/', (0, middleware_1.requirePermission)({ permissionCode: 'user:create' }), [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').optional().isLength({ min: 8 }),
    (0, express_validator_1.body)('username').optional().trim(),
    (0, express_validator_1.body)('firstName').optional().trim(),
    (0, express_validator_1.body)('lastName').optional().trim(),
    (0, express_validator_1.body)('phone').optional().trim(),
    (0, express_validator_1.body)('roleIds').optional().isArray(),
    (0, express_validator_1.body)('roleIds.*').optional().isUUID(),
], lib_1.validate, userController.create);
router.patch('/:id', (0, middleware_1.requirePermission)({ permissionCode: 'user:update' }), [
    (0, express_validator_1.param)('id').isUUID(),
    (0, express_validator_1.body)('email').optional().isEmail(),
    (0, express_validator_1.body)('password').optional().isLength({ min: 8 }),
    (0, express_validator_1.body)('username').optional().trim(),
    (0, express_validator_1.body)('firstName').optional().trim(),
    (0, express_validator_1.body)('lastName').optional().trim(),
    (0, express_validator_1.body)('phone').optional().trim(),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
    (0, express_validator_1.body)('roleIds').optional().isArray(),
], lib_1.validate, userController.update);
router.delete('/:id', (0, middleware_1.requirePermission)({ permissionCode: 'user:delete' }), [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, userController.remove);
exports.default = router;
//# sourceMappingURL=user.routes.js.map