# Armour Development Procedure

This document explains the step-by-step procedure of how we built and integrated the Armour platform.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Frontend-Backend Connection](#frontend-backend-connection)
3. [MongoDB Integration](#mongodb-integration)
4. [Authentication Integration](#authentication-integration)
5. [Additional Features](#additional-features)
6. [Key Implementation Details](#key-implementation-details)

---

## Project Overview

Armour is a domain intelligence and reconnaissance platform with:
- **Frontend:** React application with modern UI
- **Backend:** Express.js API server with scanning and AI analysis
- **Database:** MongoDB for persistent storage
- **AI:** Google Gemini (with fallback models) for security analysis
- **Features:** PDF reports, scan history, rate limiting, error handling

---

## Frontend-Backend Connection

### Step 1: Created API Service Layer

**File:** `frontend/src/services/api.js`

- Centralized API communication
- Base URL: `http://localhost:5002/api`
- Functions:
  - `scanDomain(domain, scanType)` - Start a scan
  - `analyzeScan(scanId)` - Generate AI analysis
  - `getScan(scanId)` - Retrieve scan results
  - `getAnalysis(scanId)` - Retrieve analysis results
  - `getCurrentUser()` - Get authenticated user info
  - `getUserScans()` - Get user's scan history
  - `logout()` - Logout user

### Step 2: Updated Components

#### Home Component (`frontend/src/components/Home.jsx`)
- Added Quick Scan and Full Scan options
- Prevents duplicate scans for same domain
- Shows remaining scan limits for authenticated users
- Public page - authentication only required when initiating scan
- Navigates to Loading component with domain and scanType

#### Loading Component (`frontend/src/components/Loading.jsx`)
- Calls `scanDomain()` API on mount
- Shows real-time progress messages
- Analysis generation removed (now manual only)
- Navigates to Dashboard with scan results
- Handles errors gracefully

#### Dashboard Component (`frontend/src/components/Dashboard.jsx`)
- Receives scan data from Loading
- Falls back to API calls if data not in state
- Displays scan results and AI analysis
- Manual "Generate AI Analysis" button
- PDF download functionality for scan reports
- Two tabs: Overview and Gemini Analysis

### Step 3: User Flow

```
User enters domain → Home Component (public)
    ↓
User selects scan type → Home Component
    ↓
Check authentication → Redirect to login if needed
    ↓
Navigate to Loading → Loading Component
    ↓
Call POST /api/scan → Backend API
    ↓
Wait for scan → Loading Component (shows progress)
    ↓
Navigate to Dashboard → Dashboard Component
    ↓
Display scan results → Dashboard Component
    ↓
User clicks "Generate AI Analysis" → Manual trigger
    ↓
Call POST /api/analyze → Backend API
    ↓
Display AI analysis → Dashboard Component
```

---

## MongoDB Integration

### Step 1: Installed Dependencies

**Action:** Added `mongoose` to `backend/package.json`

```bash
cd backend
npm install
```

### Step 2: Created Database Connection

**File:** `backend/config/database.js`

- Handles MongoDB connection using Mongoose
- Reads `MONGODB_URI` from environment variables
- Default: `mongodb://localhost:27017/armour`
- Connects on server start

### Step 3: Created Mongoose Models

#### Scan Model (`backend/models/Scan.js`)
- Schema for storing scan results
- Fields:
  - `scanId` (String, unique, indexed)
  - `domain` (String, indexed)
  - `mode` (String: "quick" | "full")
  - `status` (String)
  - `data` (Mixed - full scan result)
  - `userId` (ObjectId, references User, indexed)
  - `createdAt`, `updatedAt` (automatic timestamps)

#### Analysis Model (`backend/models/Analysis.js`)
- Schema for storing AI analysis results
- Fields:
  - `scanId` (String, unique, indexed)
  - `domain` (String, indexed)
  - `analysis` (String - analysis text)
  - `data` (Mixed - full analysis result)
  - `userId` (ObjectId, references User, indexed)
  - `createdAt`, `updatedAt` (automatic timestamps)

### Step 4: Updated Server.js

**File:** `backend/server.js`

#### Changes Made:

1. **Removed file system operations:**
   - Removed `fs` and `path` imports for scan/analysis storage
   - Removed directory creation code

2. **Added MongoDB imports:**
   ```javascript
   import { connectDB } from "./config/database.js";
   import Scan from "./models/Scan.js";
   import Analysis from "./models/Analysis.js";
   ```

3. **Updated API Endpoints:**

   **POST /api/scan:**
   - Saves to MongoDB `Scan` collection
   - Includes `userId` for user isolation
   ```javascript
   const scanDoc = new Scan({
     scanId: scanResult.scanId,
     userId: req.userId,
     domain: scanResult.domain,
     mode: scanResult.mode,
     status: scanResult.status,
     data: scanResult,
   });
   await scanDoc.save();
   ```

   **POST /api/analyze:**
   - Checks for existing analysis to prevent duplicates
   - Loads from MongoDB, saves to `Analysis` collection
   - Includes `userId` for user isolation
   ```javascript
   const existingAnalysis = await Analysis.findOne({ scanId, userId: req.userId });
   if (existingAnalysis) {
     return res.json({ ...existingAnalysis });
   }
   // ... run analysis ...
   const analysisDoc = new Analysis({
     scanId: analysisResult.scanId,
     userId: req.userId,
     domain: analysisResult.domain,
     analysis: analysisResult.analysis,
     data: analysisResult,
   });
   await analysisDoc.save();
   ```

   **GET /api/scan/:scanId:**
   - Query MongoDB with user filter
   ```javascript
   const scanDoc = await Scan.findOne({ scanId, userId: req.userId });
   res.json({ success: true, data: scanDoc.data });
   ```

   **GET /api/analysis/:scanId:**
   - Query MongoDB with user filter
   ```javascript
   const analysisDoc = await Analysis.findOne({ scanId, userId: req.userId });
   res.json({ success: true, data: analysisDoc.data });
   ```

   **GET /api/scans/history:**
   - New endpoint for user's scan history
   ```javascript
   const scans = await Scan.find({ userId: req.userId })
     .sort({ createdAt: -1 })
     .select("scanId domain mode status createdAt")
     .lean();
   res.json({ success: true, scans });
   ```

### Step 5: Environment Configuration

**File:** `backend/.env`

Added MongoDB connection string:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5002
MONGODB_URI=mongodb://localhost:27017/armour
```

For MongoDB Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/armour
```

### Step 6: MongoDB Setup

**Option A: Local MongoDB**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas (Cloud)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Add to `.env` as `MONGODB_URI`

---

## Authentication Integration

### Step 1: Installed Authentication Dependencies

**Action:** Added authentication packages to `backend/package.json`

```bash
cd backend
npm install
```

Dependencies added:
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth 2.0 strategy
- `jsonwebtoken` - JWT token generation/verification
- `express-session` - Session management

### Step 2: Created User Model

**File:** `backend/models/User.js`

- Schema for storing authenticated users
- Fields:
  - `googleId` (String, unique, indexed)
  - `email` (String, unique, indexed)
  - `name` (String)
  - `picture` (String)
  - `scanLimits` (Object):
    - `quickScansUsed` (Number, default: 0)
    - `fullScansUsed` (Number, default: 0)
    - `quickScansLimit` (Number, default: 3)
    - `fullScansLimit` (Number, default: 2)
  - Methods:
    - `canScan(scanType)` - Check if user can perform scan
    - `getRemainingScans()` - Get remaining scan counts
    - `incrementScanCount(scanType)` - Increment scan usage

### Step 3: Updated Scan and Analysis Models

**Files:** `backend/models/Scan.js`, `backend/models/Analysis.js`

- Added `userId` field (ObjectId, references User)
- Added indexes for `userId` queries
- Users can only access their own scans/analyses

### Step 4: Created Authentication Middleware

**File:** `backend/middleware/auth.js`

- `authenticate` - Verifies JWT tokens from Authorization header
- `generateToken(userId)` - Creates JWT tokens (7-day expiry)
- Handles token expiration and invalid tokens

**File:** `backend/middleware/rateLimit.js`

- `checkScanLimit` - Enforces scan limits per user
- Returns 403 error when limit exceeded
- Shows remaining scans in error response

### Step 5: Configured Passport.js

**File:** `backend/config/passport.js`

- Google OAuth 2.0 strategy setup
- Auto-creates users on first login
- Serializes/deserializes user sessions

### Step 6: Updated Server.js with Auth Routes

**File:** `backend/server.js`

#### Authentication Routes Added:

1. **GET /api/auth/google**
   - Initiates Google OAuth flow
   - Redirects to Google consent screen

2. **GET /api/auth/google/callback**
   - Handles OAuth callback
   - Creates/updates user in MongoDB
   - Generates JWT token
   - Redirects to frontend with token

3. **GET /api/auth/me**
   - Returns current user information
   - Includes scan limits and remaining scans
   - Requires authentication

4. **POST /api/auth/logout**
   - Logout endpoint (client-side token removal)
   - Requires authentication

#### Protected Endpoints:

All scan/analysis endpoints now require authentication:
- `POST /api/scan` - Requires auth + rate limit check
- `POST /api/analyze` - Requires auth
- `GET /api/scan/:scanId` - Requires auth + user filter
- `GET /api/analysis/:scanId` - Requires auth + user filter
- `GET /api/scans/history` - Requires auth + user filter

### Step 7: Created Frontend Authentication

**File:** `frontend/src/context/AuthContext.jsx`

- Auth context provider for managing authentication state
- Auto-verifies tokens on mount
- Provides `login()`, `logout()`, `updateUser()` methods

**Files Created:**
- `frontend/src/components/Login.jsx` - Google OAuth login page (theme-aligned)
- `frontend/src/components/AuthCallback.jsx` - Handles OAuth callback (theme-aligned)
- `frontend/src/components/ProtectedRoute.jsx` - Wraps protected routes
- `frontend/src/components/PastScans.jsx` - User's scan history page

**Files Updated:**
- `frontend/src/App.js` - Added AuthProvider and auth routes
- `frontend/src/components/Navbar.jsx` - Shows user info, logout, profile image fallback
- `frontend/src/components/Home.jsx` - Public page, checks scan limits, shows remaining scans
- `frontend/src/services/api.js` - Includes JWT tokens in requests

### Step 8: Environment Configuration

**File:** `backend/.env`

Added authentication variables:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5002/api/auth/google/callback

# JWT Secret (use a strong random string)
JWT_SECRET=your-very-secure-random-jwt-secret-key-change-this

# Session Secret (use a strong random string)
SESSION_SECRET=your-very-secure-random-session-secret-key-change-this

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:3000
```

### Step 9: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:5002/api/auth/google/callback`
   - Copy Client ID and Client Secret

### Authentication Flow

```
User visits Home (public) → Frontend
    ↓
User clicks scan → Check authentication
    ↓
Not authenticated → Redirect to /login → Frontend
    ↓
User clicks "Sign in with Google" → Frontend
    ↓
Redirects to /api/auth/google → Backend
    ↓
Redirects to Google OAuth → Google
    ↓
User authorizes → Google
    ↓
Redirects to /api/auth/google/callback → Backend
    ↓
Creates/updates user in MongoDB → Backend
    ↓
Generates JWT token → Backend
    ↓
Redirects to /auth/callback?token=... → Frontend
    ↓
Stores token and fetches user data → Frontend
    ↓
Redirects back to scan flow → Frontend
```

### Rate Limiting

- **3 Quick Scans** per user (90 seconds each)
- **2 Full Scans** per user (300-500 seconds each)
- Limits enforced at API level
- Clear error messages when limit reached
- Scan counts tracked per user in MongoDB

---

## Additional Features

### 1. PDF Report Generation

**File:** `frontend/src/utils/pdfGenerator.js`

- Uses `jspdf` library for PDF generation
- Generates professional PDF reports from scan data
- Includes all scan sections: Subdomains, Ports, Technology, DNS Records, Security
- ARMOUR branding and formatting
- Automatic pagination for long reports
- Filename: `armour_scan_{domain}_{date}.pdf`

**Integration:**
- Added "Download PDF Report" button in Dashboard Overview tab
- Only available for scan results (not analysis)

### 2. Past Scans Feature

**File:** `frontend/src/components/PastScans.jsx`

- Displays user's scan history
- Fetches scans from `/api/scans/history` endpoint
- Shows domain, scan type, status, and date
- Click to navigate to individual scan dashboard
- Theme-aligned with rest of application

**Backend Endpoint:**
- `GET /api/scans/history` - Returns all scans for authenticated user

### 3. Gemini Model Fallback System

**File:** `backend/scripts/analysis.js`

- **Priority 1:** `gemini-2.5-flash-lite` (fastest)
- **Priority 2:** `gemini-2.5-flash` (fallback)
- If both models fail, returns special error code
- Comprehensive error handling for all failure scenarios

**Error Handling:**
- Catches missing API keys, network errors, model failures
- All errors return user-friendly MVP message
- No technical error details exposed to users

### 4. Universal Error Handling

**Backend:** `backend/server.js`
- All analysis errors return consistent user-friendly message
- Special error code: `AI_ANALYSIS_UNAVAILABLE`
- HTTP 503 status for service unavailable

**Frontend:** `frontend/src/components/Dashboard.jsx`
- Bootstrap alert for error display
- User-friendly message: "We're still in the MVP phase 🚧..."
- Dismissible alert with close button

### 5. Profile Image Fallback

**File:** `frontend/src/components/Navbar.jsx`

- Detects broken Google profile images
- Shows user initials in circular badge as fallback
- Extracts first and last name initials
- Theme-aligned (cyan border and text)
- Auto-resets when user changes

### 6. UI Consistency

**Theme Implementation:**
- All pages use `home-page` class for consistent background
- Grid pattern and radial gradients across all pages
- Consistent typography and color scheme
- Fade-in animations throughout
- Cyan accent color (#00ffff) for highlights

**Pages Aligned:**
- Home (benchmark)
- Login
- AuthCallback
- Loading
- Dashboard
- Past Scans

### 7. Public Home Page with Auth-on-Scan

**Implementation:**
- Home page is publicly accessible
- Authentication only required when user initiates scan
- Redirects to login if not authenticated when clicking scan
- Returns to scan flow after authentication

---

## Key Implementation Details

### Database Structure

**Collections:**

1. **users**
   - Stores authenticated user data
   - Indexed by: `googleId`, `email`
   - Tracks scan limits and usage

2. **scans**
   - Stores domain scan results
   - Indexed by: `scanId`, `userId`, `domain`, `createdAt`
   - Linked to user via `userId`

3. **analyses**
   - Stores AI analysis results
   - Indexed by: `scanId`, `userId`, `domain`, `createdAt`
   - Linked to user via `userId`

### Migration from File System

- **Old System:** Files saved to `backend/scans/` and `backend/analysis/`
- **New System:** All data stored in MongoDB collections
- **Backward Compatibility:** Old file-based storage no longer used
- **Benefits:**
  - Scalable (works with MongoDB Atlas)
  - Queryable (powerful query capabilities)
  - Indexed (fast lookups)
  - Persistent (data survives server restarts)
  - User-isolated (data security)

### Error Handling

- Network errors handled in API service layer
- Timeout handling for long-running scans
- Graceful fallbacks in frontend components
- MongoDB connection errors logged and handled
- Universal AI analysis error handling
- User-friendly error messages (no technical details)

### Security

- **Authentication:** Google OAuth 2.0 with JWT tokens
- **Authorization:** Users can only access their own scans/analyses
- **Rate Limiting:** Prevents API abuse (3 quick, 2 full scans per user)
- **Token Security:** JWT tokens expire after 7 days
- **Environment Variables:** All secrets stored in `.env` files
- **Data Isolation:** MongoDB queries filtered by `userId`
- **CORS:** Configured for frontend-backend communication
- **No Hardcoded Credentials:** All secrets use environment variables
- **Error Messages:** No sensitive information exposed to users

### UI/UX Features

- **Consistent Theme:** Dark background with cyan accents
- **Responsive Design:** Works on all screen sizes
- **Loading States:** Clear progress indicators
- **Error States:** User-friendly error messages
- **Empty States:** Helpful messages when no data
- **Animations:** Smooth fade-in effects
- **Accessibility:** Proper ARIA labels and semantic HTML

---

## Testing

### Test Backend API:
```bash
# Health check
curl http://localhost:5002/api/health

# Create a scan (requires auth token)
curl -X POST http://localhost:5002/api/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"domain": "example.com", "scanType": "quick"}'

# Get scan (use scanId from above)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5002/api/scan/scan_1234567890

# Analyze scan
curl -X POST http://localhost:5002/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"scanId": "scan_1234567890"}'

# Get scan history
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5002/api/scans/history
```

### Test Frontend:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Open http://localhost:3000
4. Test public home page
5. Test authentication flow
6. Test scan initiation
7. Test PDF download
8. Test Past Scans page

---

## Summary

This procedure document outlines:
1. How frontend and backend were connected via API service layer
2. How MongoDB was integrated to replace file-based storage
3. How Google OAuth authentication was implemented with JWT tokens
4. How rate limiting was added to prevent API abuse
5. How additional features were implemented (PDF, Past Scans, error handling)
6. The step-by-step changes made to each component
7. Configuration and setup requirements

All changes maintain backward compatibility with the existing scanning and analysis scripts while adding:
- Persistent storage in MongoDB
- User authentication and authorization
- Rate limiting per user
- Data isolation between users
- Modern API interface with security best practices
- PDF report generation
- Scan history tracking
- Robust error handling
- Consistent UI/UX
