# IAM SaaS Backend – API Documentation

Base URL: `/api/v1`  
Authentication: Bearer JWT (except for login, register, refresh, OAuth callbacks).  
Tenant context: Send `X-Tenant-Id` or `X-Tenant-Slug` when not inferred from auth.

---

## Authentication

### Register
`POST /auth/register`

**Body:**
```json
{
  "tenantId": "uuid (optional if X-Tenant-Id set)",
  "email": "user@example.com",
  "password": "min 8 chars",
  "username": "optional",
  "firstName": "optional",
  "lastName": "optional"
}
```

**Response:** `201` – `{ user, accessToken, refreshToken, expiresIn, sessionId }`

---

### Login (username/password)
`POST /auth/login`

**Body:**
```json
{
  "tenantId": "optional",
  "email": "user@example.com",
  "username": "optional (use email or username)",
  "password": "string"
}
```

**Response:** `200` – `{ user, accessToken, refreshToken, expiresIn, sessionId }`

---

### Refresh token
`POST /auth/refresh`

**Body:** `{ "refreshToken": "string" }` or cookie `refreshToken`

**Response:** `200` – `{ accessToken, refreshToken, expiresIn }`

---

### Logout
`POST /auth/logout`

**Body (optional):** `{ "refreshToken": "string" }`  
Revokes refresh token and current session when provided.

**Response:** `200` – `{ success, message }`

---

### Me (current user)
`GET /auth/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200` – `{ user }`

---

### Google OAuth
- `GET /auth/google?tenantId=xxx` – Redirects to Google.
- `GET /auth/google/callback` – Callback; redirects to `/auth/callback?accessToken=...&refreshToken=...`.

---

### Facebook OAuth
- `GET /auth/facebook?tenantId=xxx` – Redirects to Facebook.
- `GET /auth/facebook/callback` – Callback; same redirect as Google.

---

### Login OTP (passwordless)
`POST /auth/otp/request`

**Body:** `{ "email": "...", "tenantId": "optional" }`

**Response:** `200` – `{ message, data: { expiresIn } }` (OTP sent to email in full implementation).

`POST /auth/otp/verify`

**Body:** `{ "email": "...", "code": "6-digit", "tenantId": "optional" }`

**Response:** `200` – Same shape as login (user, accessToken, refreshToken, sessionId).

---

### MFA (2FA) setup
`GET /auth/mfa/setup`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200` – `{ secret, qrDataUrl }` for TOTP app.

`POST /auth/mfa/verify`

**Body:** `{ "token": "6-digit" }`

**Response:** `200` – MFA enabled.

---

## Users

All require `Authorization: Bearer <token>` and permission `user:read` / `user:create` / `user:update` / `user:delete` as noted.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /users | user:read | List users (paginated). Query: `page`, `limit`, `search` |
| GET | /users/:id | user:read | Get user by ID |
| POST | /users | user:create | Create user. Body: email, password?, username?, firstName?, lastName?, phone?, roleIds? |
| PATCH | /users/:id | user:update | Update user (same fields + isActive, roleIds) |
| DELETE | /users/:id | user:delete | Delete user |

**List response:** `{ users, total, page, limit }`

---

## Roles

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /roles | role:read | List roles (tenant-scoped) |
| GET | /roles/:id | role:read | Get role by ID |
| POST | /roles | role:create | Create role. Body: name, code, description?, permissionIds?, menuIds? |
| PATCH | /roles/:id | role:update | Update role (same fields + isActive). System roles cannot be deleted |
| DELETE | /roles/:id | role:delete | Delete role (non-system only) |

---

## Sessions

| Method | Path | Description |
|--------|------|-------------|
| GET | /sessions | List current user's active sessions |
| DELETE | /sessions/:id | Revoke a session by ID |
| POST | /sessions/revoke-all | Revoke all other sessions (keeps current) |

All require authentication.

---

## Tenants

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /tenants | tenant:read | List tenants. Query: `page`, `limit`, `search` |
| GET | /tenants/slug/:slug | (auth) | Get tenant by slug |
| GET | /tenants/:id | tenant:read | Get tenant by ID |
| POST | /tenants | tenant:create | Create tenant. Body: name, slug, domain?, logo?, settings? |
| PATCH | /tenants/:id | tenant:update | Update tenant |
| POST | /tenants/:tenantId/modules/:moduleId/enable | tenant:update | Enable module for tenant. Body: config? |
| POST | /tenants/:tenantId/modules/:moduleId/disable | tenant:update | Disable module |

---

## Menus

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /menus | menu:read | List all menus (tenant) |
| GET | /menus/me | (auth) | Menus for current user (by role) |
| GET | /menus/:id | menu:read | Get menu by ID |
| POST | /menus | menu:create | Create menu. Body: title, path?, icon?, parentId?, moduleId?, order?, permissionCode? |
| PATCH | /menus/:id | menu:update | Update menu |
| DELETE | /menus/:id | menu:delete | Delete menu |

---

## Permissions

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /permissions | permission:read | List permissions. Query: `module` (module code) |

---

## Policies (PBAC)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /policies | policy:read | List policies (tenant) |
| GET | /policies/:id | policy:read | Get policy by ID |
| POST | /policies | policy:create | Create policy. Body: name, code, effect (ALLOW\|DENY), priority?, description?, rules? [{ attributeId, operator, value }] |
| PATCH | /policies/:id | policy:update | Update policy |
| DELETE | /policies/:id | policy:delete | Delete policy |

---

## ACL (Access Control List)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /acl | acl:read | List ACL entries. Query: subjectType, subjectId, resourceType, resourceId |
| POST | /acl | acl:create | Create entry. Body: subjectType (user\|role), subjectId, resourceType, resourceId?, permission, conditions? |
| DELETE | /acl/:id | acl:delete | Delete ACL entry |

---

## IAM Model Summary

- **RBAC:** Roles have permissions (code, e.g. `user:read`). User gets permissions via `UserRole`. Middleware: `requirePermission({ permissionCode: 'user:read' })`.
- **ABAC:** User attributes stored in `UserAttribute`; policies can reference them. Use `getUserAttributes()` and `evaluateABACCondition()` in services.
- **PBAC:** Policies (allow/deny) with rules on attributes; evaluated by priority. Use `checkPBAC(ctx)` in `iam.service`.
- **ACL:** Per-subject (user/role) and resource (type + id) permissions in `ACLEntry`. Use `checkACL(...)` for resource-level checks.
- **Multi-tenant:** Every request has `tenantId` (from auth or `X-Tenant-Id` / `X-Tenant-Slug`). Data is scoped by tenant.
- **Modules:** Enable/disable features per tenant via `TenantModule`. Use `requireModule('billing')` middleware for module-specific routes.

---

## Errors

- `400` – Validation or bad request.
- `401` – Missing or invalid token.
- `403` – Forbidden (insufficient permissions or module disabled).
- `404` – Resource not found.
- `500` – Server error.

Response shape: `{ success: false, message: string, errors?: array }`
