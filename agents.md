# Armour — System Architecture & Agent Guide

> Domain intelligence platform: scan → store → analyze → present. Express API, React SPA, MongoDB persistence, Gemini AI analysis.

---

## Pipeline

```
User → [Google OAuth] → POST /api/scan
                            ↓
                     runScanWithTimeout()
                     (DNS / ports / SSL / HTTP / subdomains)
                            ↓
                     Scan → MongoDB
                            ↓
                     POST /api/analyze (user-triggered)
                            ↓
                     runAnalysis() → Gemini API
                     (flash-lite → flash fallback)
                            ↓
                     Analysis → MongoDB
                            ↓
                     Dashboard.jsx renders results
                     + PDF export (jsPDF)
```

---

## Core Principles

| Principle | Implementation |
|---|---|
| **Scan-first, analyze-second** | Scanning and AI analysis are decoupled. Analysis is user-triggered via `/api/analyze`, never automatic. Keeps scans fast and AI costs predictable. |
| **Modular scripts** | `scripts/scan.js` and `scripts/analysis.js` are standalone — no Express dependencies. Server imports them; they can run independently. |
| **Stateless API** | JWT auth, no server-side session state for auth. Sessions exist only for Passport OAuth handshake flow. |
| **User isolation** | Every DB query filters by `userId`. No cross-user data leakage by design. |
| **Graceful degradation** | AI analysis fails → user-friendly MVP message. Model fallback chain: `gemini-2.5-flash-lite` → `gemini-2.5-flash`. |

---

## Key Design Decisions

### 1. Decoupled scan + analysis

```
PRO:  Scan results available instantly. AI analysis is optional and on-demand.
      Reduces Gemini API costs. Scan works even if AI is down.
CON:  Two-step UX. User must explicitly trigger analysis.
ALT:  Auto-analyze on scan complete — rejected due to cost and latency.
```

### 2. JWT over session-based auth

```
PRO:  Stateless. Works across deployments. Simple middleware (`authenticate`).
CON:  No server-side revocation without a blocklist.
ALT:  Redis-backed sessions — rejected; overkill for current scale.
```

### 3. MongoDB + Mongoose (no ORM abstraction layer)

```
PRO:  Schema validation via Mongoose. Flexible document model fits scan data well.
      Direct model imports in server.js — no repository pattern overhead.
CON:  Tight coupling between route handlers and Mongoose models.
ALT:  Repository pattern — rejected; premature abstraction for 3 models.
```

### 4. Monorepo with concurrently

```
PRO:  Single `npm run dev` starts everything. Shared .gitignore, unified deploys.
CON:  No workspace-level dependency hoisting.
ALT:  Turborepo / Nx — rejected; overhead not justified for 2 packages.
```

### 5. Per-user rate limiting in DB

```
PRO:  Limits persist across restarts. Per-user, not per-IP.
      Free tier: 3 quick + 2 full scans.
CON:  DB read on every scan request (via middleware).
ALT:  Redis rate limiter — would add infra dependency.
```

### 6. Gemini model fallback chain

```
PRO:  Resilience against model deprecation or quota limits.
      flash-lite first (cheaper), flash as fallback.
CON:  Two API calls on flash-lite failure. Latency cost on fallback.
ALT:  Single model — rejected; too fragile for production.
```

---

## Failure Modes & Fixes

| Failure | Symptom | Root Cause | Fix |
|---|---|---|---|
| Scan timeout | 504 / no response | Target domain unresponsive or full scan exceeds timeout | `runScanWithTimeout()` enforces ceiling. Increase timeout or switch to quick scan. |
| AI analysis 503 | `AI_ANALYSIS_UNAVAILABLE` | Gemini API key missing, quota exceeded, or both models fail | Check `GEMINI_API_KEY` env var. Verify quota in Google Cloud Console. Fallback message is intentional. |
| OAuth redirect loop | Infinite `/auth/google` → callback → `/auth/google` | `GOOGLE_CALLBACK_URL` mismatch or `FRONTEND_URL` wrong in `.env` | Verify redirect URI in Google Cloud Console matches `GOOGLE_CALLBACK_URL` exactly. |
| CORS blocked | Browser console `CORS not allowed` | Frontend origin not in `allowedOrigins` array in `server.js` | Add the origin to `allowedOrigins`. For local dev, add `http://localhost:3000`. |
| MongoDB connection failure | Server crashes on startup | `MONGODB_URI` wrong or Atlas IP whitelist missing | Verify connection string. Whitelist `0.0.0.0/0` in Atlas for dev (restrict in prod). |
| JWT expired | 401 on all authenticated routes | Token older than expiry window | Frontend should catch 401, clear token, redirect to login. |
| Race condition on analysis save | Duplicate key error | Two concurrent `/api/analyze` calls for same scan | Handled: duplicate key catch returns existing analysis. |
| Rate limit reached | 403 on scan | User exhausted free tier (3 quick / 2 full) | Inform user. No reset mechanism currently — would need admin endpoint or TTL-based reset. |

---

## AI Codegen Instructions

### Rules for generating code in this repo

1. **Backend** — ES Modules (`import`/`export`). No CommonJS. Node.js 18+.
2. **Frontend** — React functional components with hooks. JSX file extension (`.jsx`). No class components.
3. **Styling** — CSS in `App.css` and `index.css`. Bootstrap classes in JSX. No Tailwind. No CSS-in-JS.
4. **State** — React Context for auth (`context/AuthContext`). Local state via `useState`/`useEffect`. No Redux.
5. **API calls** — All through `services/api.js`. Uses Axios. Always attach JWT via interceptor.
6. **Models** — Mongoose schemas in `backend/models/`. PascalCase filenames. Always include `userId` field for user isolation.
7. **Middleware** — `backend/middleware/`. `authenticate` for JWT validation. `checkScanLimit` for rate limiting. Chain as Express middleware.
8. **New routes** — Add directly to `server.js`. Follow existing pattern: JSDoc comment → `app.method()` → try/catch → consistent JSON response shape `{ success, data|error, message }`.
9. **New components** — `frontend/src/components/`. One component per file. Include `Footer` component. Use existing dark theme.
10. **Environment variables** — Backend only. Never expose in frontend bundle. Access via `process.env`.
11. **Error handling** — Never expose stack traces or internal details in API responses. Use generic user-facing messages.
12. **Secrets** — Never hardcode. Always `.env`. `.gitignore` must include `.env`.

### File map

```
backend/
├── server.js              # All routes, middleware wiring, Express app
├── scripts/scan.js        # Domain scanning logic (DNS, ports, SSL, HTTP)
├── scripts/analysis.js    # Gemini AI analysis with model fallback
├── models/User.js         # User schema (OAuth profile, scan limits)
├── models/Scan.js         # Scan result schema (domain, mode, data)
├── models/Analysis.js     # AI analysis schema (scanId ref, analysis text)
├── middleware/auth.js      # JWT authenticate + generateToken
├── middleware/rateLimit.js # Per-user scan limit enforcement
├── config/passport.js     # Google OAuth strategy
└── config/database.js     # MongoDB connection

frontend/src/
├── App.js                 # Router, layout, route definitions
├── components/
│   ├── Home.jsx           # Landing page, domain input, scan trigger
│   ├── Dashboard.jsx      # Scan results display, AI analysis trigger
│   ├── Login.jsx          # Google OAuth login page
│   ├── AuthCallback.jsx   # OAuth redirect handler, token storage
│   ├── Navbar.jsx         # Navigation bar with auth state
│   ├── PastScans.jsx      # Scan history list
│   ├── Loading.jsx        # Loading/progress indicator
│   ├── ProtectedRoute.jsx # Auth guard wrapper
│   └── Footer.jsx         # Persistent footer
├── context/               # AuthContext provider
├── services/api.js        # Axios instance, interceptors, API methods
└── utils/                 # PDF generation utilities
```

---

## Agents

### Retrieval Agent

**Role:** Fetch and structure reconnaissance data for a target domain.

```
Input:  { domain: string, scanType: "quick" | "full" }
Output: Structured scan object (subdomains, DNS, ports, SSL, HTTP headers, tech stack)
```

- Executes `scripts/scan.js` → `runScanWithTimeout()`
- Quick scan: ~90s, common ports, basic subdomains
- Full scan: 300-500s, full port range, extended discovery
- Timeout-enforced. Partial results returned on timeout.
- No AI involvement. Pure data collection.

### Response Agent

**Role:** Transform raw scan data into actionable security insights.

```
Input:  { domain: string, scanData: object }
Output: Structured analysis (risk assessment, misconfigs, recommendations)
```

- Executes `scripts/analysis.js` → `runAnalysis()`
- Gemini model chain: `flash-lite` → `flash`
- Prompt engineered for beginner-friendly security explanations
- Cached per `scanId` — repeat calls return stored analysis
- Graceful failure: returns MVP message on any AI error

### Agent Interaction

```
Retrieval Agent (scan.js)
        ↓ scan data persisted to MongoDB
        ↓ user triggers analysis
Response Agent (analysis.js)
        ↓ analysis persisted to MongoDB
        ↓
Dashboard.jsx renders both
```

No chaining. No orchestrator. User is the glue between agents. This is intentional — keeps the system debuggable and cost-controlled.

---

## Non-Goals

- Real-time scanning (WebSocket push) — not needed for current scan durations
- Multi-tenant / team features — single-user model is sufficient
- Plugin system for scan modules — premature; 2 scripts cover all recon needs
- Auto-scaling analysis — Gemini API rate limits are the bottleneck, not compute
