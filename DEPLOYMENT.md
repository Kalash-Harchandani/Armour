# Armour Deployment Guide

This document provides step-by-step instructions for deploying the Armour backend to production using Docker.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 2: Backend Production Readiness](#phase-2-backend-production-readiness)
3. [Phase 3: Docker Setup](#phase-3-docker-setup)
4. [Environment Variables](#environment-variables)
5. [Local Docker Testing](#local-docker-testing)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ installed locally (for development)
- Docker Desktop installed and running
- MongoDB database (local or cloud instance)
- Google OAuth credentials (Client ID and Secret)
- Google Gemini API key (for AI analysis)

---

## Phase 2: Backend Production Readiness

### 2.1 Port Configuration

The backend server is configured to listen on `process.env.PORT` with a fallback to port 5002.

**File:** `backend/server.js`

```javascript
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

✅ **Status:** Already implemented

### 2.2 CORS Configuration

CORS is configured to use `process.env.FRONTEND_URL` without fallback (mandatory for production).

**File:** `backend/server.js`

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

✅ **Status:** Implemented - requires `FRONTEND_URL` environment variable

### 2.3 Health Check Endpoint

A health check endpoint is available at `/api/health` to verify the backend is running.

**File:** `backend/server.js`

```javascript
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});
```

✅ **Status:** Implemented

**Test:** `GET http://localhost:5002/api/health` should return `OK`

---

## Phase 3: Docker Setup

### 3.1 Dockerfile

**File:** `backend/Dockerfile`

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5002

CMD ["npm", "start"]
```

**Key Points:**
- Uses `node:20-slim` for better compatibility with modern Node.js packages
- Installs only production dependencies
- Exposes port 5002
- Runs `npm start` on container start

✅ **Status:** Created

### 3.2 .dockerignore

**File:** `backend/.dockerignore`

```
node_modules
.env
npm-debug.log
```

**Purpose:** Excludes unnecessary files from Docker build context to reduce image size and prevent sensitive data from being copied.

✅ **Status:** Created

### 3.3 Conditional OAuth Initialization

The passport configuration has been updated to only initialize Google OAuth if credentials are provided, allowing the health check to work without full OAuth setup.

**File:** `backend/config/passport.js`

- OAuth strategy only initializes if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are present
- Health check endpoint works without OAuth credentials
- Warning message logged if OAuth credentials are missing

✅ **Status:** Implemented

---

## Environment Variables

The following environment variables are required for the backend to function properly:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` or `https://yourdomain.com` |
| `PORT` | Backend server port | `5002` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/armour` or `mongodb+srv://...` |
| `SESSION_SECRET` | Secret for session encryption | Random secure string |

### Optional Variables (for full functionality)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:5002/api/auth/google/callback` |
| `BACKEND_URL` | Backend base URL | `http://localhost:5002` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `JWT_SECRET` | JWT token secret | Random secure string |
| `NODE_ENV` | Environment mode | `production` or `development` |

---

## Local Docker Testing

### Step 1: Build the Docker Image

From the `backend/` directory:

```bash
cd backend
docker build -t armour-backend .
```

**Expected Output:**
- Image builds successfully
- Dependencies install
- No errors

### Step 2: Run the Container

**Minimal test (health check only):**

```bash
docker run -p 5002:5002 \
  -e FRONTEND_URL=http://localhost:3000 \
  -e PORT=5002 \
  -e MONGODB_URI=mongodb://localhost:27017/armour \
  -e SESSION_SECRET=your_session_secret_here \
  armour-backend
```

**Full functionality test:**

```bash
docker run -p 5002:5002 \
  -e FRONTEND_URL=http://localhost:3000 \
  -e PORT=5002 \
  -e MONGODB_URI=mongodb://localhost:27017/armour \
  -e SESSION_SECRET=your_session_secret_here \
  -e GOOGLE_CLIENT_ID=your_google_client_id \
  -e GOOGLE_CLIENT_SECRET=your_google_client_secret \
  -e GEMINI_API_KEY=your_gemini_api_key \
  -e JWT_SECRET=your_jwt_secret \
  armour-backend
```

### Step 3: Test Health Endpoint

Open in browser or use curl:

```bash
curl http://localhost:5002/api/health
```

**Expected Response:** `OK`

✅ **If you see OK → Docker is correct**
❌ **If not → Check troubleshooting section**

### Step 4: Stop the Container

Press `Ctrl+C` in the terminal or find the container ID and stop it:

```bash
docker ps
docker stop <container_id>
```

---

## Production Deployment

### Option 1: Docker Compose (Recommended for Local/Simple Deployments)

Create `backend/docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5002:5002"
    environment:
      - FRONTEND_URL=${FRONTEND_URL}
      - PORT=${PORT:-5002}
      - MONGODB_URI=${MONGODB_URI}
      - SESSION_SECRET=${SESSION_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

### Option 2: Cloud Platform Deployment

#### Heroku

1. Create `Procfile` in `backend/`:
   ```
   web: node server.js
   ```

2. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set FRONTEND_URL=https://your-frontend.herokuapp.com
   heroku config:set MONGODB_URI=your_mongodb_uri
   # ... set other env vars
   git push heroku main
   ```

#### AWS ECS / Google Cloud Run / Azure Container Instances

1. Build and push image to container registry
2. Create service/container instance
3. Set environment variables
4. Deploy

### Option 3: VPS Deployment (DigitalOcean, Linode, etc.)

1. SSH into your server
2. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```
3. Clone repository
4. Create `.env` file with all required variables
5. Build and run:
   ```bash
   cd backend
   docker build -t armour-backend .
   docker run -d -p 5002:5002 --env-file .env --name armour-backend armour-backend
   ```

---

## Troubleshooting

### Issue 1: "command not found: docker"

**Solution:** Install Docker Desktop
- macOS: Download from https://www.docker.com/products/docker-desktop/
- Linux: `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
- Windows: Download Docker Desktop from official website

### Issue 2: "OAuth2Strategy requires a clientID option"

**Solution:** This error occurs when Google OAuth credentials are missing. The backend will still run, but OAuth routes won't work.

- For health check testing: This is expected and OK
- For full functionality: Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables

### Issue 3: "ReferenceError: File is not defined"

**Solution:** This was fixed by updating the Dockerfile to use `node:20-slim` instead of `node:18-alpine`. Ensure your Dockerfile uses:

```dockerfile
FROM node:20-slim
```

### Issue 4: CORS Errors

**Solution:** Ensure `FRONTEND_URL` environment variable is set correctly and matches your frontend URL exactly (including protocol and port).

### Issue 5: MongoDB Connection Errors

**Solution:** 
- Verify `MONGODB_URI` is correct
- For local MongoDB in Docker: Use `mongodb://host.docker.internal:27017/armour` instead of `mongodb://localhost:27017/armour`
- For cloud MongoDB: Ensure connection string includes authentication credentials

### Issue 6: Health Check Returns 404

**Solution:**
- Verify the server is running: Check container logs with `docker logs <container_id>`
- Verify port mapping: Ensure `-p 5002:5002` is correct
- Check if port is already in use: `lsof -i :5002`

### Issue 7: Container Exits Immediately

**Solution:**
- Check logs: `docker logs <container_id>`
- Common causes:
  - Missing required environment variables
  - MongoDB connection failure
  - Port already in use
  - Application crash on startup

---

## Verification Checklist

Before deploying to production, verify:

- [ ] Docker image builds successfully
- [ ] Health check endpoint returns `OK`
- [ ] All required environment variables are set
- [ ] MongoDB connection works
- [ ] CORS is configured correctly
- [ ] OAuth authentication works (if using)
- [ ] API endpoints respond correctly
- [ ] Error handling works as expected
- [ ] Logs are accessible and readable

---

## Additional Notes

### Security Best Practices

1. **Never commit `.env` files** - Use environment variables or secrets management
2. **Use strong secrets** - Generate random strings for `SESSION_SECRET` and `JWT_SECRET`
3. **Enable HTTPS in production** - Use reverse proxy (nginx, Traefik) with SSL certificates
4. **Limit container resources** - Set memory and CPU limits in production
5. **Keep dependencies updated** - Regularly update npm packages for security patches

### Performance Optimization

1. **Use production mode:** Set `NODE_ENV=production`
2. **Enable gzip compression** - Add compression middleware
3. **Use connection pooling** - Configure MongoDB connection pool
4. **Monitor resource usage** - Use Docker stats or monitoring tools

### Monitoring

Consider adding:
- Health check monitoring (ping `/api/health` regularly)
- Application logging (Winston, Pino)
- Error tracking (Sentry, Rollbar)
- Performance monitoring (New Relic, Datadog)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs: `docker logs <container_id>`
3. Verify environment variables are set correctly
4. Test health endpoint first before testing other endpoints

---

**Last Updated:** 2024
**Version:** 1.0.0
