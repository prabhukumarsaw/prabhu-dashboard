import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IAM SaaS Backend API',
      version: '1.0.0',
      description: 'Identity and Access Management API with RBAC, ABAC, PBAC, ACL, multi-tenant support.',
    },
    servers: [{ url: `http://localhost:${config.port}${config.apiPrefix}`, description: 'Development' }],
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
      { name: 'Blogs', description: 'Blog management module' },
    ],
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
