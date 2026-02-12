## IAM SaaS Backend – API Workflows & Example Payloads

This document shows **end‑to‑end workflows** with **dummy JSON payloads** for all main routes.

Base URL: `/api/v1`  
Auth: `Authorization: Bearer <ACCESS_TOKEN>` (where required)  
Tenant: Prefer header `X-Tenant-Slug: default` or `X-Tenant-Id: <uuid>`

---

## 1. Onboarding & Authentication

### 1.1 Register User

**Route:** `POST /auth/register`  
**Body:**

```json
{
  "tenantId": "default-tenant-id-or-omit-if-header",
  "email": "john.doe@example.com",
  "password": "StrongPassw0rd!",
  "username": "john.doe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "tenantId": "tenant-uuid",
      "email": "john.doe@example.com",
      "username": "john.doe",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2026-02-12T10:00:00.000Z"
    },
    "accessToken": "ACCESS_TOKEN",
    "refreshToken": "REFRESH_TOKEN",
    "expiresIn": "15m",
    "sessionId": "session-uuid"
  }
}
```

---

### 1.2 Password Login

**Route:** `POST /auth/login`  
**Body (email or username):**

```json
{
  "tenantId": "tenant-uuid-or-slug",
  "email": "john.doe@example.com",
  "password": "StrongPassw0rd!"
}
```

**Response (200):** same structure as register.

---

### 1.3 Refresh Token

**Route:** `POST /auth/refresh`  
**Body:**

```json
{
  "refreshToken": "REFRESH_TOKEN"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN",
    "refreshToken": "NEW_REFRESH_TOKEN",
    "expiresIn": "15m"
  }
}
```

---

### 1.4 Logout

**Route:** `POST /auth/logout`  
**Body (optional):**

```json
{
  "refreshToken": "REFRESH_TOKEN"
}
```

**Response:**

```json
{ "success": true, "message": "Logged out" }
```

---

### 1.5 Get Current User

**Route:** `GET /auth/me`  
**Headers:** `Authorization: Bearer ACCESS_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "tenantId": "tenant-uuid",
      "email": "john.doe@example.com",
      "roles": [
        { "id": "role-uuid", "code": "admin", "name": "Admin" }
      ]
    }
  }
}
```

---

### 1.6 Google OAuth Login (Browser Flow)

1. **Redirect user to backend:**

   `GET /auth/google?tenantId=default`

2. User signs in with Google, then backend redirects to your frontend:

   `GET /auth/callback?accessToken=ACCESS_TOKEN&refreshToken=REFRESH_TOKEN`

Use those tokens same as password login.

---

### 1.7 Facebook OAuth Login

Flow is identical to Google, using:

- `GET /auth/facebook?tenantId=default`
- Redirect to `/auth/callback?accessToken=...&refreshToken=...`

---

### 1.8 OTP (Passwordless) Login

#### Request OTP

**Route:** `POST /auth/otp/request`

```json
{
  "tenantId": "tenant-uuid-or-slug",
  "email": "john.doe@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent to email",
  "data": { "expiresIn": 600 }
}
```

#### Verify OTP

**Route:** `POST /auth/otp/verify`

```json
{
  "tenantId": "tenant-uuid-or-slug",
  "email": "john.doe@example.com",
  "code": "123456"
}
```

**Response:** same shape as password login (tokens + user).

---

### 1.9 MFA / 2FA (TOTP)

#### Setup

**Route:** `GET /auth/mfa/setup`  
**Headers:** `Authorization: Bearer ACCESS_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "secret": "BASE32_SECRET",
    "qrDataUrl": "data:image/png;base64,iVBORw0KGgoAAA..."
  }
}
```

#### Verify / Enable

**Route:** `POST /auth/mfa/verify`

```json
{
  "token": "123456"
}
```

**Response:**

```json
{ "success": true, "message": "MFA enabled" }
```

---

## 2. User Management (RBAC)

### 2.1 List Users

**Route:** `GET /users`  
**Query (optional):** `?page=1&limit=20&search=john`

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-uuid",
        "email": "john.doe@example.com",
        "username": "john.doe",
        "firstName": "John",
        "lastName": "Doe",
        "isActive": true,
        "userRoles": [
          { "role": { "id": "role-uuid", "code": "admin", "name": "Admin" } }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

### 2.2 Create User

**Route:** `POST /users`

```json
{
  "email": "alice@example.com",
  "password": "UserPass123!",
  "username": "alice",
  "firstName": "Alice",
  "lastName": "Smith",
  "phone": "+1555000111",
  "roleIds": ["role-uuid-admin", "role-uuid-editor"]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "new-user-uuid",
      "email": "alice@example.com",
      "username": "alice",
      "userRoles": [
        { "role": { "id": "role-uuid-admin", "code": "admin" } },
        { "role": { "id": "role-uuid-editor", "code": "editor" } }
      ]
    }
  }
}
```

---

### 2.3 Update User

**Route:** `PATCH /users/:id`

```json
{
  "firstName": "Alice Jane",
  "lastName": "Smith",
  "isActive": true,
  "roleIds": ["role-uuid-editor"]
}
```

---

### 2.4 Delete User

**Route:** `DELETE /users/:id`

**Response:**

```json
{ "success": true, "message": "User deleted" }
```

---

## 3. Roles & Permissions

### 3.1 List Roles

**Route:** `GET /roles`

**Response:**

```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "role-uuid-admin",
        "name": "Admin",
        "code": "admin",
        "isSystem": true,
        "rolePermissions": [
          { "permission": { "code": "user:read" } },
          { "permission": { "code": "user:create" } }
        ]
      }
    ]
  }
}
```

---

### 3.2 Create Role

**Route:** `POST /roles`

```json
{
  "name": "Manager",
  "code": "manager",
  "description": "Tenant manager",
  "permissionIds": ["perm-uuid-user-read", "perm-uuid-menu-read"],
  "menuIds": ["menu-uuid-dashboard"]
}
```

---

### 3.3 Update Role

**Route:** `PATCH /roles/:id`

```json
{
  "description": "Updated description",
  "permissionIds": ["perm-uuid-user-read"],
  "menuIds": []
}
```

---

### 3.4 List Permissions

**Route:** `GET /permissions?module=core`

**Response:**

```json
{
  "success": true,
  "data": {
    "permissions": [
      { "id": "perm-uuid", "code": "user:read", "resource": "user", "action": "read" }
    ]
  }
}
```

---

## 4. Tenants & Modules (Multi‑tenant)

### 4.1 List Tenants

**Route:** `GET /tenants?page=1&limit=10&search=default`

**Response:**

```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "tenant-uuid",
        "name": "Default Tenant",
        "slug": "default",
        "domain": "localhost",
        "isActive": true
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

### 4.2 Create Tenant

**Route:** `POST /tenants`

```json
{
  "name": "Acme Corp",
  "slug": "acme",
  "domain": "acme.example.com",
  "logo": "https://cdn.example.com/acme/logo.png",
  "settings": {
    "timezone": "UTC",
    "theme": "dark"
  }
}
```

---

### 4.3 Enable Module for Tenant

**Route:** `POST /tenants/:tenantId/modules/:moduleId/enable`

```json
{
  "config": {
    "plan": "pro",
    "limitProjects": 20
  }
}
```

---

## 5. Menus (Per‑tenant, Per‑role)

### 5.1 Create Menu Item

**Route:** `POST /menus`

```json
{
  "title": "Dashboard",
  "path": "/dashboard",
  "icon": "dashboard",
  "parentId": null,
  "moduleId": "module-uuid-core",
  "order": 1,
  "permissionCode": "dashboard:view"
}
```

---

### 5.2 List Menus for Tenant

**Route:** `GET /menus`

**Response (example):**

```json
{
  "success": true,
  "data": {
    "menus": [
      {
        "id": "menu-uuid-dashboard",
        "title": "Dashboard",
        "path": "/dashboard",
        "parentId": null,
        "order": 1
      }
    ]
  }
}
```

---

### 5.3 Menus for Current User

**Route:** `GET /menus/me`

**Response:** same as tenant menus, but filtered by the user’s roles.

---

## 6. Sessions

### 6.1 List My Sessions

**Route:** `GET /sessions`

**Response:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-uuid",
        "ip": "127.0.0.1",
        "userAgent": "Mozilla/5.0",
        "expiresAt": "2026-03-12T10:00:00.000Z",
        "revokedAt": null
      }
    ]
  }
}
```

---

### 6.2 Revoke One Session

**Route:** `DELETE /sessions/:id`

**Response:**

```json
{ "success": true, "message": "Session revoked" }
```

---

### 6.3 Revoke All Other Sessions

**Route:** `POST /sessions/revoke-all`

```json
{ }
```

**Response:**

```json
{ "success": true, "message": "All other sessions revoked" }
```

---

## 7. Policies (PBAC) & ACL

### 7.1 Create Policy

**Route:** `POST /policies`

```json
{
  "name": "Only HR can see salaries",
  "code": "hr-salary-view",
  "description": "Restrict salary view to HR department",
  "effect": "ALLOW",
  "priority": 10,
  "rules": [
    {
      "attributeId": "attr-uuid-department",
      "operator": "eq",
      "value": { "value": "HR" }
    }
  ]
}
```

---

### 7.2 List Policies

**Route:** `GET /policies`

**Response:** policies with their rules and attributes.

---

### 7.3 Create ACL Entry

**Route:** `POST /acl`

```json
{
  "subjectType": "user",
  "subjectId": "user-uuid",
  "resourceType": "report",
  "resourceId": "report-uuid",
  "permission": "read",
  "conditions": {
    "timeWindow": "09:00-18:00"
  }
}
```

---

### 7.4 List ACL Entries

**Route:** `GET /acl?subjectType=user&subjectId=user-uuid`

**Response:** list of ACL entries for that user.

---

## 8. Typical End‑to‑End Flow

1. **Admin logs in** via `/auth/login` and gets tokens.
2. Admin **creates a tenant** via `/tenants`.
3. Admin **creates roles** and **assigns permissions** via `/roles`.
4. Admin **creates users** and **assigns roles** via `/users`.
5. Configure **menus** via `/menus` for navigation.
6. Optionally add **policies** via `/policies` and **ACLs** via `/acl` for fine‑grained control.
7. Frontend calls `/auth/login` or `/auth/google`/`/auth/facebook`, then uses `/menus/me`, `/users`, etc., all scoped by tenant and checked through RBAC/ABAC/PBAC/ACL.

