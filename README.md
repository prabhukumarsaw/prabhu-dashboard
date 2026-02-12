# IAM SaaS Backend

Advanced Identity and Access Management backend for SaaS applications. Built with **Node.js**, **Express**, **Prisma**, and supports **RBAC**, **ABAC**, **PBAC**, and **ACL** with **multi-tenant** architecture.

## Features

- **IAM**
  - **RBAC** – Role-based access; roles have permissions; users get roles.
  - **ABAC** – Attribute-based; user attributes and conditions.
  - **PBAC** – Policy-based; allow/deny policies with priority.
  - **ACL** – Resource-level access control (subject + resource + permission).

- **Authentication**
  - Username/password with secure hashing (bcrypt).
  - **JWT** access + refresh tokens.
  - **Google** and **Facebook** OAuth 2.0.
  - **OTP** for passwordless login (email OTP).
  - **TOTP (2FA)** setup and verify.

- **User management**
  - CRUD users, roles, permissions, menus.
  - Session list and revoke (single or all).
  - Per-user roles and optional role expiry.

- **Multi-tenant**
  - Tenant-scoped data; tenant from `X-Tenant-Id` or `X-Tenant-Slug` or JWT.
  - **Modules** – enable/disable features per tenant (`TenantModule`).

- **Extensibility**
  - Module-based design; add new modules and permissions.
  - Policy and ACL for fine-grained and resource-level control.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express
- **ORM:** Prisma (PostgreSQL)
- **Auth:** JWT, Passport (Local, JWT, Google, Facebook), bcrypt, otplib, nodemailer (for OTP)
- **Validation:** express-validator
- **Docs:** Swagger (OpenAPI), `docs/API.md`

## Project Structure

```
├── prisma/
│   ├── schema.prisma    # Data model (tenants, users, roles, permissions, sessions, OTP, ACL, policies, menus, modules)
│   └── seed.ts          # Seed default tenant, admin role, permissions
├── src/
│   ├── config/          # App config, Passport strategies, Swagger
│   ├── controllers/    # Auth, user, role, session, tenant, menu, permission
│   ├── lib/             # Logger, Prisma client, JWT, password, validate
│   ├── middleware/     # auth, tenant, IAM (requirePermission), module, error
│   ├── routes/          # Route definitions
│   ├── services/        # Auth, user, role, session, tenant, menu, permission, IAM
│   ├── types/           # Express request types (user, tenantId)
│   ├── app.ts           # Express app setup
│   └── index.ts         # Server entry
├── docs/
│   └── API.md           # Full API documentation
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

1. **Clone and install**
   ```bash
   cd IAM
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`.
   - Set `DATABASE_URL` (PostgreSQL).
   - Set `JWT_SECRET` and optionally OAuth and SMTP for Google/Facebook and OTP email.

3. **Database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   - API: `http://localhost:3000/api/v1`
   - Health: `http://localhost:3000/health`
   - Swagger UI: `http://localhost:3000/api-docs`

## Default seed

- **Tenant:** `default` (slug).
- **Admin user:** `admin@example.com` / `Admin@123`.
- **Role:** Admin with all core permissions.

## API overview

- **Auth:** `/api/v1/auth` – register, login, refresh, logout, me, Google/Facebook OAuth, OTP request/verify, MFA setup/verify.
- **Users:** `/api/v1/users` – list, get, create, update, delete (permissions: `user:read`, `user:create`, `user:update`, `user:delete`).
- **Roles:** `/api/v1/roles` – list, get, create, update, delete.
- **Sessions:** `/api/v1/sessions` – list, revoke one, revoke all others.
- **Tenants:** `/api/v1/tenants` – list, get by id/slug, create, update, enable/disable module.
- **Menus:** `/api/v1/menus` – list, my menus, get, create, update, delete.
- **Permissions:** `/api/v1/permissions` – list (optional filter by module).

See **`docs/API.md`** for request/response shapes and all endpoints.

## Adding a new module

1. Insert a row in `Module` (e.g. `code: 'billing'`).
2. Create permissions (e.g. `billing:read`, `billing:write`) linked to that module.
3. Enable for a tenant via `POST /tenants/:tenantId/modules/:moduleId/enable`.
4. For routes under that module, use `requireModule('billing')` middleware after tenant resolution.

## License

MIT.
