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


# New Features Implementation Summary

This document summarizes all the new features added to transform the IAM backend into an advanced SaaS dashboard.

## ✅ Implemented Features

### 1. **Notifications System** (`src/services/notification.service.ts`)
**Status**: ✅ Complete

**Features**:
- ✅ In-app notifications with read/unread status
- ✅ Email notifications via nodemailer
- ✅ Push notifications (placeholder for web-push/FCM)
- ✅ SMS notifications (placeholder for Twilio/AWS SNS)
- ✅ Notification preferences per user
- ✅ Notification templates
- ✅ Bulk notifications
- ✅ Notification statistics

**API Endpoints**:
- `POST /api/v1/notifications` - Create notification
- `POST /api/v1/notifications/bulk` - Bulk notifications
- `GET /api/v1/notifications` - List user notifications
- `GET /api/v1/notifications/unread/count` - Unread count
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `GET /api/v1/notifications/preferences` - Get preferences
- `PATCH /api/v1/notifications/preferences` - Update preference
- `GET /api/v1/notifications/stats` - Statistics

**Usage Example**:
```typescript
import * as notificationService from './services/notification.service';

// Create notification
await notificationService.createNotification({
  tenantId: 'tenant-id',
  userId: 'user-id',
  type: 'info',
  title: 'Welcome!',
  message: 'Your account has been created',
  actionUrl: '/dashboard',
  sendEmail: true,
});

// Send from template
await notificationService.sendNotificationFromTemplate(
  'tenant-id',
  'user-id',
  'user.welcome',
  { name: 'John' }
);
```

---

### 2. **File Storage & Management** (`src/services/file.service.ts`)
**Status**: ✅ Complete

**Features**:
- ✅ File upload with multer
- ✅ Local file storage
- ✅ File sharing with password protection
- ✅ Expiring share links
- ✅ Download limits
- ✅ Storage quotas per tenant
- ✅ File statistics
- ✅ MIME type validation
- ✅ File size limits

**API Endpoints**:
- `POST /api/v1/files` - Upload file
- `GET /api/v1/files` - List files
- `GET /api/v1/files/:id` - Get file info
- `GET /api/v1/files/:id/download` - Download file
- `DELETE /api/v1/files/:id` - Delete file
- `POST /api/v1/files/:fileId/share` - Create share link
- `GET /api/v1/files/share/:token` - Access shared file
- `GET /api/v1/files/:fileId/shares` - List shares
- `DELETE /api/v1/files/:fileId/share/:token` - Revoke share
- `GET /api/v1/files/storage/usage` - Storage usage
- `GET /api/v1/files/stats` - File statistics

**Configuration**:
- `UPLOAD_DIR` - Upload directory (default: `./uploads`)
- `MAX_FILE_SIZE` - Max file size in bytes (default: 100MB)
- `DEFAULT_STORAGE_QUOTA` - Default storage quota (default: 1GB)
- `DEFAULT_FILE_QUOTA` - Default file count quota (default: 1000)

---

### 3. **Advanced Search & Filtering** (`src/services/search.service.ts`)
**Status**: ✅ Complete

**Features**:
- ✅ Full-text search across resources
- ✅ Advanced filters (eq, ne, gt, gte, lt, lte, in, contains, etc.)
- ✅ Date range filtering
- ✅ Saved searches
- ✅ Search suggestions
- ✅ Global search across all resource types
- ✅ Resource-specific search implementations

**Supported Resources**:
- Users
- Roles
- Permissions
- Files
- Menus
- Policies
- Tenants

**API Endpoints**:
- `POST /api/v1/search` - Advanced search
- `GET /api/v1/search/global` - Global search
- `POST /api/v1/search/saved` - Save search
- `GET /api/v1/search/saved` - List saved searches
- `DELETE /api/v1/search/saved/:id` - Delete saved search
- `GET /api/v1/search/suggestions` - Get suggestions

**Usage Example**:
```typescript
import * as searchService from './services/search.service';

// Advanced search
const results = await searchService.searchResources({
  tenantId: 'tenant-id',
  resourceType: 'user',
  query: 'john',
  filters: [
    { field: 'isActive', operator: 'eq', value: true },
    { field: 'createdAt', operator: 'gte', value: new Date('2024-01-01') },
  ],
  page: 1,
  limit: 20,
});

// Global search
const globalResults = await searchService.globalSearch(
  'tenant-id',
  'search query',
  ['user', 'role'],
  20
);
```

---

### 4. **Export & Import** (`src/services/export-import.service.ts`)
**Status**: ✅ Complete

**Features**:
- ✅ Export to CSV, JSON, XLSX
- ✅ Import from CSV, JSON, XLSX
- ✅ Field selection
- ✅ Filtered exports
- ✅ Bulk import with validation
- ✅ Error handling and reporting
- ✅ Job tracking
- ✅ Update existing records option

**Supported Resources**:
- Users
- Roles
- Permissions
- Menus

**API Endpoints**:
- `POST /api/v1/export-import/export` - Export resources
- `GET /api/v1/export-import/export/:jobId` - Get export job
- `POST /api/v1/export-import/import` - Import resources
- `GET /api/v1/export-import/import/:jobId` - Get import job
- `GET /api/v1/export-import/jobs` - List jobs

**Usage Example**:
```typescript
import * as exportImportService from './services/export-import.service';

// Export users
const exportResult = await exportImportService.exportResources({
  tenantId: 'tenant-id',
  userId: 'user-id',
  resourceType: 'user',
  format: 'csv',
  filters: { isActive: true },
  fields: ['email', 'firstName', 'lastName'],
});

// Import users
const importResult = await exportImportService.importResources({
  tenantId: 'tenant-id',
  userId: 'user-id',
  resourceType: 'user',
  format: 'csv',
  fileId: 'file-id',
  options: {
    skipErrors: false,
    updateExisting: true,
  },
});
```

---

### 5. **Real-time Features** (`src/services/realtime.service.ts`)
**Status**: ✅ Complete

**Features**:
- ✅ WebSocket support via Socket.IO
- ✅ Server-Sent Events (SSE)
- ✅ Real-time notifications
- ✅ Live activity feed
- ✅ User presence tracking
- ✅ Room subscriptions
- ✅ Connection management

**API Endpoints**:
- `GET /api/v1/realtime/sse` - SSE endpoint
- WebSocket: `/socket.io` - WebSocket connection

**Usage Example**:
```typescript
import { emitToUser, sendRealtimeNotification } from './services/realtime.service';

// Send real-time notification
sendRealtimeNotification('user-id', 'tenant-id', {
  id: 'notification-id',
  type: 'info',
  title: 'New Message',
  message: 'You have a new message',
});

// Emit custom event
emitToUser('user-id', 'custom-event', {
  data: 'custom data',
});
```

**Client-side (Socket.IO)**:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5177', {
  auth: {
    token: 'your-access-token'
  }
});

socket.on('connected', (data) => {
  console.log('Connected', data);
});

socket.on('notification', (data) => {
  console.log('New notification', data);
});

socket.on('activity', (data) => {
  console.log('Activity update', data);
});
```

---

## 📦 Database Schema Updates

All new models have been added to `prisma/schema.prisma`:

1. **Notification** - In-app notifications
2. **NotificationPreference** - User notification preferences
3. **NotificationTemplate** - Notification templates
4. **File** - File storage records
5. **FileShare** - File sharing links
6. **SavedSearch** - Saved search queries
7. **ExportJob** - Export job tracking
8. **ImportJob** - Import job tracking

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install json2csv socket.io
npm install --save-dev @types/json2csv
```

### 2. Run Database Migration
```bash
npx prisma migrate dev --name add_notifications_files_search_export_realtime
```

### 3. Environment Variables
Add to `.env`:
```env
# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
DEFAULT_STORAGE_QUOTA=1073741824
DEFAULT_FILE_QUOTA=1000

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com

# Socket.IO
CORS_ORIGIN=http://localhost:3000
```

### 4. Create Upload Directory
```bash
mkdir -p uploads
```

## 🎯 Next Steps

1. **Run migrations**: `npx prisma migrate dev`
2. **Install dependencies**: `npm install`
3. **Start server**: `npm run dev`
4. **Test endpoints**: Use Swagger UI at `/api-docs`

## 📝 Notes

- All services follow clean architecture principles
- Proper error handling and validation
- Multi-tenant aware
- Permission-based access control
- Comprehensive logging
- Type-safe TypeScript implementation

## 🔒 Security Considerations

- File uploads validated by MIME type and size
- Share links protected with passwords and expiration
- Storage quotas prevent abuse
- All endpoints require authentication
- Permission checks on sensitive operations
- Input validation on all endpoints

## 🚀 Future Enhancements

- [ ] Image resizing/optimization (sharp library)
- [ ] S3/cloud storage integration
- [ ] Push notification implementation (web-push)
- [ ] SMS notification implementation (Twilio)
- [ ] Elasticsearch integration for advanced search
- [ ] Background job processing (Bull/BullMQ)
- [ ] File virus scanning
- [ ] Advanced analytics dashboard
