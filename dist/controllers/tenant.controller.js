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
exports.getBySlug = getBySlug;
exports.create = create;
exports.update = update;
exports.enableModule = enableModule;
exports.disableModule = disableModule;
const tenantService = __importStar(require("../services/tenant.service"));
async function list(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search;
    const result = await tenantService.listTenants(page, limit, search);
    res.json({ success: true, data: result });
}
async function getById(req, res) {
    const tenant = await tenantService.getTenantById(req.params.id);
    if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
    }
    res.json({ success: true, data: { tenant } });
}
async function getBySlug(req, res) {
    const tenant = await tenantService.getTenantBySlug(req.params.slug);
    if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
    }
    res.json({ success: true, data: { tenant } });
}
async function create(req, res) {
    const { name, slug, domain, logo, settings } = req.body;
    const tenant = await tenantService.createTenant({ name, slug, domain, logo, settings });
    res.status(201).json({ success: true, data: { tenant } });
}
async function update(req, res) {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.json({ success: true, data: { tenant } });
}
async function enableModule(req, res) {
    const { tenantId, moduleId } = req.params;
    const config = req.body.config;
    const result = await tenantService.enableModule(tenantId, moduleId, config);
    res.json({ success: true, data: result });
}
async function disableModule(req, res) {
    const { tenantId, moduleId } = req.params;
    await tenantService.disableModule(tenantId, moduleId);
    res.json({ success: true, message: 'Module disabled' });
}
//# sourceMappingURL=tenant.controller.js.map