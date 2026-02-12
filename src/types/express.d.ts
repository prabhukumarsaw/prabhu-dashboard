import { User, Tenant, Role } from '@prisma/client';

export type UserWithRelations = User & {
  tenant: Tenant;
  userRoles: { role: Role }[];
};

declare global {
  namespace Express {
    interface Request {
      user?: UserWithRelations;
      tenantId?: string;
      sessionId?: string;
    }
  }
}

export {};
