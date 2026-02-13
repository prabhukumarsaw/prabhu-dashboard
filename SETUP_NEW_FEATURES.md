# Setup Guide for New Features

## Quick Start

### 1. Install New Dependencies
```bash
npm install json2csv socket.io
npm install --save-dev @types/json2csv
```

### 2. Generate Prisma Client
After adding the new models to the schema, generate the Prisma client:
```bash
npx prisma generate
```

### 3. Run Database Migration
```bash
npx prisma migrate dev --name add_notifications_files_search_export_realtime
```

### 4. Create Upload Directory
```bash
mkdir -p uploads
```

### 5. Update Environment Variables
Add to your `.env` file:
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

### 6. Start the Server
```bash
npm run dev
```

## Verification

After setup, verify the new endpoints:

1. **Notifications**: `GET /api/v1/notifications`
2. **Files**: `GET /api/v1/files`
3. **Search**: `POST /api/v1/search`
4. **Export/Import**: `POST /api/v1/export-import/export`
5. **Real-time**: WebSocket at `/socket.io` or SSE at `/api/v1/realtime/sse`

## Troubleshooting

### Prisma Client Errors
If you see errors about missing Prisma models:
```bash
npx prisma generate
```

### File Upload Errors
Ensure the upload directory exists and has write permissions:
```bash
mkdir -p uploads
chmod 755 uploads
```

### Socket.IO Connection Issues
Check CORS settings in `src/services/realtime.service.ts` and ensure your frontend origin is allowed.

## Next Steps

1. Test all endpoints using Swagger UI at `/api-docs`
2. Integrate notification service in your existing modules
3. Set up file storage quotas per tenant
4. Configure email notifications
5. Implement push notifications (web-push library)
