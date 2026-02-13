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
const searchController = __importStar(require("../controllers/search.controller"));
const express_validator_1 = require("express-validator");
const lib_1 = require("../lib");
const router = (0, express_1.Router)();
router.use(middleware_1.authRequired);
// Advanced search
router.post('/', [
    (0, express_validator_1.body)('resourceType').isIn(['user', 'role', 'permission', 'file', 'menu', 'policy', 'tenant']),
    (0, express_validator_1.body)('query').optional().isString(),
    (0, express_validator_1.body)('filters').optional().isArray(),
    (0, express_validator_1.body)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('limit').optional().isInt({ min: 1, max: 100 }),
], lib_1.validate, searchController.search);
// Global search
router.get('/global', [
    (0, express_validator_1.query)('query').notEmpty().isString(),
    (0, express_validator_1.query)('resourceTypes').optional().isString(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
], lib_1.validate, searchController.globalSearch);
// Saved searches
router.post('/saved', [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('resourceType').isIn(['user', 'role', 'permission', 'file', 'menu', 'policy', 'tenant']),
    (0, express_validator_1.body)('query').notEmpty(),
    (0, express_validator_1.body)('isPublic').optional().isBoolean(),
], lib_1.validate, searchController.saveSearch);
router.get('/saved', [(0, express_validator_1.query)('resourceType').optional().isIn(['user', 'role', 'permission', 'file', 'menu', 'policy', 'tenant'])], lib_1.validate, searchController.getSavedSearches);
router.delete('/saved/:id', [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, searchController.deleteSavedSearch);
// Search suggestions
router.get('/suggestions', [
    (0, express_validator_1.query)('resourceType').isIn(['user', 'role', 'permission', 'file', 'menu', 'policy', 'tenant']),
    (0, express_validator_1.query)('query').notEmpty().isString(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }),
], lib_1.validate, searchController.getSuggestions);
exports.default = router;
//# sourceMappingURL=search.routes.js.map