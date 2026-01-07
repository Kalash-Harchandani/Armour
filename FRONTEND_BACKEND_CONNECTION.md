# Frontend-Backend Connection Guide

## Overview

The frontend and backend are now connected! The React app calls the Express API to perform real scans and analysis.

## How It Works

### 1. **API Service Layer** (`frontend/src/services/api.js`)
   - Centralized API communication
   - Handles all HTTP requests to backend
   - Provides error handling
   - Base URL: `http://localhost:5002/api` (configurable via environment variable)

### 2. **User Flow**

```
User enters domain → Home Component
    ↓
User selects scan type (Quick/Full) → Home Component
    ↓
Navigate to Loading → Loading Component
    ↓
Call POST /api/scan → Backend API
    ↓
Wait for scan to complete → Loading Component (shows progress)
    ↓
Call POST /api/analyze → Backend API
    ↓
Navigate to Dashboard → Dashboard Component
    ↓
Display scan results + AI analysis → Dashboard Component
```

### 3. **Component Updates**

#### **Home Component**
- ✅ Passes domain and scanType to Loading component
- ✅ Shows error messages if previous scan failed

#### **Loading Component**
- ✅ Calls `scanDomain()` API when component mounts
- ✅ Shows real-time loading messages
- ✅ Calls `analyzeScan()` after scan completes
- ✅ Navigates to Dashboard with scan data and analysis
- ✅ Handles errors gracefully

#### **Dashboard Component**
- ✅ Receives scan data and analysis from Loading component
- ✅ Falls back to API calls if data not in state
- ✅ Falls back to localStorage if API unavailable
- ✅ Falls back to mock data as last resort

## API Endpoints Used

1. **POST `/api/scan`**
   - Called by: Loading component
   - Request: `{ domain: string, scanType: "quick" | "full" }`
   - Response: `{ scanId, domain, mode, status, data: {...} }`

2. **POST `/api/analyze`**
   - Called by: Loading component
   - Request: `{ scanId: string }`
   - Response: `{ scanId, domain, analysis: string }`

3. **GET `/api/scan/:scanId`** (fallback)
   - Called by: Dashboard component
   - Response: `{ success: true, data: {...} }`

4. **GET `/api/analysis/:scanId`** (fallback)
   - Called by: Dashboard component
   - Response: `{ success: true, data: {...} }`

## Configuration

### Backend Port
The backend runs on port **5002** by default (as seen in `server.js`).

### Frontend API URL
The frontend looks for the API at:
- Default: `http://localhost:5002/api`
- Can be configured via environment variable: `REACT_APP_API_URL`

To change the API URL, create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5002/api
```

## Error Handling

### Network Errors
- If backend is not running, user sees error message
- Loading component navigates back to Home with error

### Scan Errors
- If scan fails, error is displayed
- User can retry from Home page

### Analysis Errors
- If analysis fails, scan data is still shown
- User can see scan results without analysis

## Testing the Connection

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Test Flow:**
   - Go to `http://localhost:3000`
   - Enter a domain (e.g., `example.com`)
   - Select "Quick Scan" or "Full Scan"
   - Watch the loading screen
   - See results in Dashboard

## Data Flow

### Scan Data Storage
- **In State:** Passed from Loading → Dashboard via React Router state
- **In localStorage:** Saved as `scanData` and `currentScanId`
- **In Backend:** Saved to `backend/scans/{scanId}.json`

### Analysis Storage
- **In State:** Passed from Loading → Dashboard via React Router state
- **In localStorage:** Saved as `geminiAnalysis_{domain}`
- **In Backend:** Saved to `backend/analysis/{scanId}.ai.json`

## Fallback Strategy

The Dashboard uses a smart fallback system:

1. **First:** Try to use data from React Router state (fastest)
2. **Second:** Try to fetch from API using scanId
3. **Third:** Try to load from localStorage
4. **Last:** Use mock data (for development/testing)

This ensures the app works even if:
- User refreshes the page
- API is temporarily unavailable
- Data is lost from state

## Troubleshooting

### "Network error: Could not connect to the server"
- **Solution:** Make sure backend is running on port 5002
- Check: `http://localhost:5002/api/health`

### "Scan failed" error
- **Solution:** Check backend logs for details
- Verify domain is valid
- Check network connectivity

### Analysis not showing
- **Solution:** Check if GEMINI_API_KEY is set in backend `.env`
- Check backend logs for Gemini API errors

## Next Steps (Optional)

1. **Add retry logic** for failed API calls
2. **Add polling** for long-running scans
3. **Add WebSocket** for real-time updates
4. **Add caching** for frequently scanned domains
5. **Add authentication** for production use

