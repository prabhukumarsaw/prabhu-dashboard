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
exports.list = list;
exports.getById = getById;
exports.create = create;
exports.update = update;
exports.remove = remove;
const userService = __importStar(require("../services/user.service"));
const authService = __importStar(require("../services/auth.service"));
async function list(req, res) {
    const tenantId = req.tenantId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search;
    const result = await userService.listUsers(tenantId, page, limit, search);
    const users = result.users.map((u) => authService.sanitizeUser(u));
    res.json({
        success: true,
        data: { users, total: result.total, page: result.page, limit: result.limit },
    });
}
async function getById(req, res) {
    const { id } = req.params;
    const user = await userService.getUserById(id, req.tenantId);
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.json({ success: true, data: { user: authService.sanitizeUser(user) } });
}
async function create(req, res) {
    const { email, username, password, firstName, lastName, phone, roleIds } = req.body;
    const user = await userService.createUser({
        tenantId: req.tenantId,
        email,
        username,
        password,
        firstName,
        lastName,
        phone,
        roleIds,
    });
    res.status(201).json({ success: true, data: { user: authService.sanitizeUser(user) } });
}
async function update(req, res) {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.tenantId, req.body);
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.json({ success: true, data: { user: authService.sanitizeUser(user) } });
}
async function remove(req, res) {
    const { id } = req.params;
    await userService.deleteUser(id, req.tenantId);
    res.json({ success: true, message: 'User deleted' });
}
//# sourceMappingURL=user.controller.js.map