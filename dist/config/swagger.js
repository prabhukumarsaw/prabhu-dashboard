"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const index_1 = require("./index");
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'IAM SaaS Backend API',
            version: '1.0.0',
            description: 'Identity and Access Management API with RBAC, ABAC, PBAC, ACL, multi-tenant support.',
        },
        servers: [{ url: `http://localhost:${index_1.config.port}${index_1.config.apiPrefix}`, description: 'Development' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication (login, register, OAuth, OTP, MFA)' },
            { name: 'Users', description: 'User management' },
            { name: 'Roles', description: 'Role management' },
            { name: 'Sessions', description: 'Session management' },
            { name: 'Tenants', description: 'Tenant management' },
            { name: 'Menus', description: 'Menu management' },
            { name: 'Permissions', description: 'Permission listing' },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map