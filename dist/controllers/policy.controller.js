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
const policyService = __importStar(require("../services/policy.service"));
async function list(req, res) {
    const policies = await policyService.listPolicies(req.tenantId);
    res.json({ success: true, data: { policies } });
}
async function getById(req, res) {
    const policy = await policyService.getPolicyById(req.params.id, req.tenantId);
    if (!policy) {
        res.status(404).json({ success: false, message: 'Policy not found' });
        return;
    }
    res.json({ success: true, data: { policy } });
}
async function create(req, res) {
    const { name, code, description, effect, priority, rules } = req.body;
    const policy = await policyService.createPolicy(req.tenantId, {
        name,
        code,
        description,
        effect,
        priority,
        rules,
    });
    res.status(201).json({ success: true, data: { policy } });
}
async function update(req, res) {
    const policy = await policyService.updatePolicy(req.params.id, req.tenantId, req.body);
    res.json({ success: true, data: { policy } });
}
async function remove(req, res) {
    await policyService.deletePolicy(req.params.id, req.tenantId);
    res.json({ success: true, message: 'Policy deleted' });
}
//# sourceMappingURL=policy.controller.js.map