
![ScreenRecording2026-01-08at4 26 56PM-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/e8a73f0c-ef6a-421f-bad7-6261af559c80)

# Armour 🛡️

**Advanced Domain Intelligence & Reconnaissance Platform**

Armour is a modern, beginner-friendly domain intelligence and reconnaissance platform built for developers and security learners. It provides clear visibility into how a domain is exposed on the internet with structured dashboards and AI-powered analysis.

## Features

- 🔍 **Quick & Full Scans** - Choose between fast 90-second quick scans or comprehensive 300-500 second full scans
- 📊 **Structured Dashboard** - View reconnaissance data in an organized, easy-to-understand format
- 🤖 **AI-Powered Analysis** - Get insights about potential security risks and misconfigurations using Gemini AI with automatic fallback
- 🔐 **Secure Authentication** - Google OAuth login with JWT token-based sessions
- ⚡ **Rate Limited** - Free tier: 3 quick scans + 2 full scans per user
- 📄 **PDF Reports** - Download professional PDF reports of your scan results
- 📜 **Scan History** - View and access all your past scans in one place
- 🎯 **Beginner-Friendly** - Clear explanations and educational content for security learners
- 📱 **Modern UI** - Beautiful, responsive interface with consistent dark theme
- 🛡️ **Error Handling** - Graceful error handling with user-friendly messages

## Available Scripts

From the root directory:

- `npm run dev` - Run both backend and frontend in development mode
- `npm run start` - Run both backend and frontend in production mode
- `npm run install:all` - Install dependencies for root, backend, and frontend

## Project Structure

```
Armour/
├── backend/              # Backend scanning and analysis scripts
│   ├── scripts/          # Core scanning scripts
│   ├── models/           # MongoDB models (User, Scan, Analysis)
│   ├── middleware/       # Auth and rate limiting middleware
│   ├── config/           # Database and Passport configuration
│   └── package.json
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React Context (Auth)
│   │   ├── services/    # API service layer
│   │   ├── utils/       # Utilities (PDF generator)
│   │   └── ...
│   └── package.json
├── PROCEDURE.md          # Detailed development procedure
└── README.md             # This file
```

## Quick Start

### Option 1: Run Both Together (Recommended)

1. Install all dependencies (root, backend, and frontend):
   ```bash
   npm run install:all
   ```

2. Set up Google OAuth and MongoDB (see [Authentication Setup](#authentication-setup) below)

3. Create backend `.env` file (see [Environment Variables](#environment-variables) below)

4. Run both frontend and backend:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API on `http://localhost:5002`
   - Frontend app on `http://localhost:3000`

### Option 2: Run Separately

#### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Google OAuth and MongoDB, then create `.env` file (see [Authentication Setup](#authentication-setup) below)

4. Start backend server:
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Backend Setup

### Authentication Setup

1. **Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API (APIs & Services > Library)
   - Create OAuth 2.0 credentials:
     - Choose "Web application"
     - Add authorized redirect URI: `http://localhost:5002/api/auth/google/callback`
     - Copy **Client ID** and **Client Secret**

2. **Set Up MongoDB:**
   
   **Option A: Local MongoDB**
   - macOS: `brew install mongodb-community && brew services start mongodb-community`
   - Linux: `sudo apt-get install mongodb && sudo systemctl start mongodb`
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   
   **Option B: MongoDB Atlas (Cloud)**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string

3. **Get Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

### Environment Variables

Create a `backend/.env` file with the following:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5002/api/auth/google/callback

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-very-secure-random-jwt-secret-key-change-this

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-very-secure-random-session-secret-key-change-this

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=your_mongo_db_uri
# OR for Atlas: mongodb+your_mongo_db_uri

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port
PORT=5002
```

⚠️ **Never commit `.env` files to version control!**

### Backend API Endpoints

**Authentication:**
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - OAuth callback (returns JWT)
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

**Scanning (requires authentication):**
- `POST /api/scan` - Scan a domain (quick or full mode)
- `POST /api/analyze` - Analyze scan data with Gemini AI (manual trigger)
- `GET /api/scan/:scanId` - Get scan results
- `GET /api/analysis/:scanId` - Get analysis results
- `GET /api/scans/history` - Get user's scan history
- `GET /api/health` - Health check (public)

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- Passport.js (Google OAuth authentication)
- JWT (JSON Web Tokens)
- Google Gemini AI (with fallback models)
- jsPDF (for PDF generation)
- DNS, HTTP, SSL scanning libraries

### Frontend
- React
- React Router
- React Context (for authentication state)
- Bootstrap (for styling)
- jsPDF (for PDF generation)
- Font Awesome (for icons)

## Features in Detail

### Scan Types

- **Quick Scan:** Fast reconnaissance (~90 seconds)
  - Basic subdomain discovery
  - DNS record enumeration
  - Port scanning (common ports)
  - HTTP/HTTPS checks
  - SSL certificate validation

- **Full Scan:** Comprehensive reconnaissance (300-500 seconds)
  - Extended subdomain discovery
  - Complete DNS enumeration
  - Full port range scanning
  - Detailed HTTP analysis
  - Technology stack detection
  - Comprehensive SSL analysis

### AI Analysis

- Uses Google Gemini AI for intelligent analysis
- Automatic model fallback (gemini-2.5-flash-lite → gemini-2.5-flash)
- Beginner-friendly explanations
- Risk assessment and recommendations
- Manual trigger (user-initiated)

### PDF Reports

- Professional PDF generation from scan results
- Includes all scan data: Subdomains, Ports, Technology, DNS Records, Security
- ARMOUR branding
- Automatic pagination
- Downloadable from Dashboard

### Scan History

- View all past scans in one place
- Filter by scan type
- Quick access to previous results
- Navigate to individual scan dashboards

### Error Handling

- Graceful error handling throughout
- User-friendly error messages
- No technical details exposed
- Automatic fallbacks where possible

## User Flow

1. **Visit Home Page** (public, no auth required)
2. **Enter Domain** and select scan type
3. **Authenticate** (if not already logged in)
4. **Scan Runs** (with progress indicators)
5. **View Results** in Dashboard
6. **Generate AI Analysis** (manual trigger)
7. **Download PDF** report (optional)
8. **View Past Scans** anytime

## Security

- ✅ Google OAuth 2.0 authentication
- ✅ JWT token-based sessions
- ✅ User data isolation in MongoDB
- ✅ Rate limiting per user
- ✅ Environment variable secrets
- ✅ CORS protection
- ✅ No hardcoded credentials
- ✅ Secure error messages

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Security:** Never commit `.env` files or API keys
2. **Code Style:** Follow existing code patterns
3. **Testing:** Test your changes locally before submitting
4. **Documentation:** Update relevant documentation if needed

### Before Pushing to GitHub

- ✅ Ensure `.env` files are in `.gitignore`
- ✅ No hardcoded API keys or secrets
- ✅ No `node_modules/` directories
- ✅ No build artifacts or temporary files
- ✅ Run `git status` to verify no sensitive files are staged

## Support

For detailed development procedures and implementation details, see [PROCEDURE.md](./PROCEDURE.md).

---

**Built with ❤️ for the security community**
