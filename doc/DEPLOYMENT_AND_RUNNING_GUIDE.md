# Kibabii Nest: Deployment and Running Guide

This guide describes how to build, run, and update the Kibabii Nest project using Docker Compose, as well as how to access and test various service components.

---

## 🏗️ 1. Architecture & Container Overview

The project relies on a multi-container Docker structure to manage databases, object storage, and runtime applications.

### Services Defined in `docker-compose.yml` (Production):
* **`db` (Postgres 15)**: Database service accessible internally at `db:5432` and exposed to the host at port `5432`.
* **`minio` (Object Storage)**: S3-compatible asset store. API at port `9002` (internal `9000`) and Management Console at port `9001`.
* **`backend` (NestJS)**: Main API and WebSocket gateway. Bound to port `9000`.
* **`frontend` (Next.js)**: Client web portal. Bound to port `3000`.

### Services Defined in `docker-compose.staging.yml` (Staging):
To avoid port conflicts on a shared server, the staging environment offsets public port numbers:
* **`db-staging`**: Postgres bound to host port `5433`.
* **`minio-staging`**: MinIO API at port `9012` and Console at port `9011`.
* **`backend-staging`**: NestJS backend bound to host port `9010`.
* **`frontend-staging`**: Next.js frontend bound to host port `3010`.

---

## ⚙️ 2. Environment Configuration

The backend container requires an `.env` file located at `backend/.env` containing key credentials.

### Required Environment Variables:
```env
# Database
DATABASE_URL="postgresql://nestuser:nestpassword@db:5432/kibabiinest?schema=public"

# App Port
PORT=9000

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"

# Email Configuration (SMTP)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="username"
SMTP_PASS="password"

# Firebase Cloud Messaging Credentials Path
# Copy your service account JSON file to the project root and reference it
FIREBASE_CREDENTIALS_PATH="kibabii-nest-firebase-adminsdk-fbsvc-c63aa8268e.json"
```

---

## 🚀 3. Running the Containers

### For Production:
1. **Build and start services** in background:
   ```bash
   docker-compose up -d --build
   ```
2. **Stop services**:
   ```bash
   docker-compose down
   ```
3. **Restart specific service** (e.g., backend):
   ```bash
   docker-compose restart backend
   ```

### For Staging:
1. **Build and start staging services** in background:
   ```bash
   docker-compose -f docker-compose.staging.yml up -d --build
   ```
2. **Stop staging services**:
   ```bash
   docker-compose -f docker-compose.staging.yml down
   ```
3. **Restart specific staging service**:
   ```bash
   docker-compose -f docker-compose.staging.yml restart backend-staging
   ```

### Viewing Container Logs:
To inspect startup processes, database migrations, and errors:
```bash
# Production
docker logs kibabii-backend -f --tail 100

# Staging
docker logs kibabii-backend-staging -f --tail 100
```

---

## 🔄 4. Updating Code & Database Migrations

### Standard Handoff Update Loop:
1. SSH into your host server.
2. Navigate to the project root:
   ```bash
   cd /path/to/kibabii-nest
   ```
3. Fetch and pull the latest code:
   ```bash
   git pull origin main
   ```
4. Rebuild the application containers:
   ```bash
   # Production
   docker-compose up -d --build backend
   
   # Staging
   docker-compose -f docker-compose.staging.yml up -d --build backend-staging
   ```

### Database Migrations:
The backend container is configured to automatically deploy migrations upon startup. The `CMD` script inside the `backend/Dockerfile` runs:
```bash
npx prisma migrate deploy
```
This applies all pending migrations in `backend/prisma/migrations/` to the database before the web process launches.

#### Manual Migration Overrides (Alternative):
If you need to manually force migrations or troubleshoot schema drift, execute this command inside the active container:
```bash
# Production
docker exec -it kibabii-backend npx prisma migrate deploy

# Staging
docker exec -it kibabii-backend-staging npx prisma migrate deploy
```

---

## 🧪 5. Testing & Verification

### 1. API Verification
You can test core endpoints using standard REST tools (e.g., Postman or cURL).

* **Forgot Password Initiator**:
  ```bash
  curl -X POST http://localhost:9000/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email": "student@kibabii.ac.ke"}'
  ```
* **Password Reset Submitter**:
  ```bash
  curl -X POST http://localhost:9000/auth/reset-password \
    -H "Content-Type: application/json" \
    -d '{"email": "student@kibabii.ac.ke", "code": "123456", "newPassword": "myNewPassword123"}'
  ```

### 2. WebSocket Real-Time Chat Connection
The websocket namespace is hosted at `ws://localhost:9000`. You can use a WebSocket client tool (e.g. Hoppscotch, Postman, or a Node script) to connect:

1. **Connection**: Establish connection with header `Authorization: Bearer <your-jwt-token>`.
2. **Emit Read Notification**: Send the `read_messages` event to mark conversations as read:
   * Event: `read_messages`
   * Payload: `{"conversationId": "some-uuid"}`
3. **Listen for Sync Broadcast**: Subscribe to `messages_read` to receive real-time checkmark updates when the other user loads the conversation:
   * Event: `messages_read`

### 3. Mobile (Flutter) Testing Setup
To connect your mobile emulator/device to the running server:
1. Locate `mobile/lib/services/api_service.dart`.
2. Configure the server URL base path to reference the Staging or Production host IP:
   ```dart
   // For local machine debugging (Android emulator)
   static const String baseUrl = 'http://10.0.2.2:9000';
   
   // For Staging server remote testing
   static const String baseUrl = 'https://api-staging.kibabii.generexcom.com';
   ```
3. Locate `mobile/lib/services/socket_service.dart` and align the Socket server target URL with the same scheme/ports.
