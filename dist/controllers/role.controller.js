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
const roleService = __importStar(require("../services/role.service"));
async function list(req, res) {
    const roles = await roleService.listRoles(req.tenantId);
    res.json({ success: true, data: { roles } });
}
async function getById(req, res) {
    const role = await roleService.getRoleById(req.params.id, req.tenantId);
    if (!role) {
        res.status(404).json({ success: false, message: 'Role not found' });
        return;
    }
    res.json({ success: true, data: { role } });
}
async function create(req, res) {
    const { name, code, description, permissionIds, menuIds } = req.body;
    const role = await roleService.createRole(req.tenantId, {
        name,
        code,
        description,
        permissionIds,
        menuIds,
    });
    res.status(201).json({ success: true, data: { role } });
}
async function update(req, res) {
    const { id } = req.params;
    try {
        const role = await roleService.updateRole(id, req.tenantId, req.body);
        res.json({ success: true, data: { role } });
    }
    catch (e) {
        if (e.message?.includes('System roles')) {
            res.status(400).json({ success: false, message: e.message });
            return;
        }
        throw e;
    }
}
async function remove(req, res) {
    try {
        await roleService.deleteRole(req.params.id, req.tenantId);
        res.json({ success: true, message: 'Role deleted' });
    }
    catch (e) {
        if (e.message?.includes('System roles')) {
            res.status(400).json({ success: false, message: e.message });
            return;
        }
        throw e;
    }
}
//# sourceMappingURL=role.controller.js.map