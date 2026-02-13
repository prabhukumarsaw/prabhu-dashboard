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
exports.search = search;
exports.globalSearch = globalSearch;
exports.saveSearch = saveSearch;
exports.getSavedSearches = getSavedSearches;
exports.deleteSavedSearch = deleteSavedSearch;
exports.getSuggestions = getSuggestions;
const searchService = __importStar(require("../services/search.service"));
async function search(req, res) {
    const tenantId = req.tenantId;
    const { resourceType, query, filters, dateRange, sortBy, sortOrder, page, limit } = req.body;
    if (!resourceType) {
        res.status(400).json({ success: false, message: 'resourceType is required' });
        return;
    }
    try {
        const result = await searchService.searchResources({
            tenantId,
            resourceType,
            query,
            filters,
            dateRange: dateRange
                ? {
                    field: dateRange.field,
                    start: new Date(dateRange.start),
                    end: new Date(dateRange.end),
                }
                : undefined,
            sortBy,
            sortOrder,
            page,
            limit,
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function globalSearch(req, res) {
    const tenantId = req.tenantId;
    const { query, resourceTypes, limit } = req.query;
    if (!query) {
        res.status(400).json({ success: false, message: 'query is required' });
        return;
    }
    try {
        const result = await searchService.globalSearch(tenantId, query, resourceTypes ? resourceTypes.split(',') : undefined, limit ? parseInt(limit, 10) : undefined);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function saveSearch(req, res) {
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const { name, resourceType, query, isPublic } = req.body;
    if (!name || !resourceType || !query) {
        res.status(400).json({ success: false, message: 'name, resourceType, and query are required' });
        return;
    }
    try {
        const savedSearch = await searchService.saveSearch({
            tenantId,
            userId,
            name,
            resourceType,
            query,
            isPublic,
        });
        res.status(201).json({ success: true, data: savedSearch });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getSavedSearches(req, res) {
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const { resourceType } = req.query;
    try {
        const searches = await searchService.getSavedSearches(tenantId, userId, resourceType);
        res.json({ success: true, data: searches });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function deleteSavedSearch(req, res) {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
        await searchService.deleteSavedSearch(id, userId);
        res.json({ success: true, message: 'Saved search deleted' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getSuggestions(req, res) {
    const tenantId = req.tenantId;
    const { resourceType, query, limit } = req.query;
    if (!resourceType || !query) {
        res.status(400).json({ success: false, message: 'resourceType and query are required' });
        return;
    }
    try {
        const suggestions = await searchService.getSearchSuggestions(tenantId, resourceType, query, limit ? parseInt(limit, 10) : undefined);
        res.json({ success: true, data: suggestions });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=search.controller.js.map