# Armour API Documentation

## Base URL
```
http://localhost:5000/api
```

## Endpoints

### 1. Health Check
**GET** `/api/health`

Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Armour API is running",
  "timestamp": "2024-01-07T10:00:00.000Z"
}
```

---

### 2. Scan Domain
**POST** `/api/scan`

Perform a domain reconnaissance scan (quick or full mode).

**Request Body:**
```json
{
  "domain": "example.com",
  "scanType": "quick"  // or "full"
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "scan_1704628800000",
  "domain": "example.com",
  "mode": "quick",
  "status": "completed",
  "data": {
    "scanId": "scan_1704628800000",
    "domain": "example.com",
    "mode": "quick",
    "status": "completed",
    "subdomains": ["example.com", "www.example.com"],
    "dns": { ... },
    "ports": { "80": true, "443": true, "8080": false },
    "http": { ... },
    "ssl": { ... },
    "tech": ["Nginx", "React"]
  }
}
```

**Error Responses:**
- `400` - Invalid domain or scan type
- `500` - Scan failed

---

### 3. Analyze Scan Data
**POST** `/api/analyze`

Analyze scan data using Gemini AI. You can provide either:
- Full scan data in the request body, OR
- Just the scanId to load from saved scan

**Option 1: With scanData**
```json
{
  "domain": "example.com",
  "scanData": {
    "scanId": "scan_1704628800000",
    "domain": "example.com",
    "subdomains": [...],
    "dns": {...},
    "ports": {...},
    "http": {...},
    "ssl": {...},
    "tech": [...]
  }
}
```

**Option 2: With scanId**
```json
{
  "scanId": "scan_1704628800000"
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "scan_1704628800000",
  "domain": "example.com",
  "analysis": "AI Summary (Short):\n- ...\n\nDetailed Analysis:\n..."
}
```

**Error Responses:**
- `400` - Missing scan data or domain
- `404` - Scan not found (when using scanId)
- `500` - Analysis failed or API key not configured

---

### 4. Get Scan Results
**GET** `/api/scan/:scanId`

Retrieve saved scan results by scanId.

**Response:**
```json
{
  "success": true,
  "data": {
    "scanId": "scan_1704628800000",
    "domain": "example.com",
    ...
  }
}
```

**Error Responses:**
- `404` - Scan not found

---

### 5. Get Analysis Results
**GET** `/api/analysis/:scanId`

Retrieve saved analysis results by scanId.

**Response:**
```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "scanId": "scan_1704628800000",
    "analysis": "..."
  }
}
```

**Error Responses:**
- `404` - Analysis not found

---

## Example Workflow

### Complete Pipeline (Scan + Analyze)

1. **Start a scan:**
```bash
POST /api/scan
{
  "domain": "leetcode.com",
  "scanType": "quick"
}
```

2. **Get the scanId from response** (e.g., `scan_1704628800000`)

3. **Analyze the scan:**
```bash
POST /api/analyze
{
  "scanId": "scan_1704628800000"
}
```

4. **Or retrieve results later:**
```bash
GET /api/scan/scan_1704628800000
GET /api/analysis/scan_1704628800000
```

---

## Postman Testing

### Collection Setup

1. **Base URL:** `http://localhost:5000/api`

2. **Environment Variables:**
   - `base_url`: `http://localhost:5000/api`

### Test Cases

#### Test 1: Health Check
- **Method:** GET
- **URL:** `{{base_url}}/health`
- **Expected:** 200 OK with status "ok"

#### Test 2: Quick Scan
- **Method:** POST
- **URL:** `{{base_url}}/scan`
- **Body (JSON):**
  ```json
  {
    "domain": "example.com",
    "scanType": "quick"
  }
  ```
- **Expected:** 200 OK with scanId and scan data

#### Test 3: Full Scan
- **Method:** POST
- **URL:** `{{base_url}}/scan`
- **Body (JSON):**
  ```json
  {
    "domain": "example.com",
    "scanType": "full"
  }
  ```
- **Expected:** 200 OK (takes longer)

#### Test 4: Analyze with scanId
- **Method:** POST
- **URL:** `{{base_url}}/analyze`
- **Body (JSON):**
  ```json
  {
    "scanId": "scan_1704628800000"
  }
  ```
- **Expected:** 200 OK with analysis text

#### Test 5: Analyze with full data
- **Method:** POST
- **URL:** `{{base_url}}/analyze`
- **Body (JSON):** Full scan data object
- **Expected:** 200 OK with analysis text

#### Test 6: Get Scan
- **Method:** GET
- **URL:** `{{base_url}}/scan/scan_1704628800000`
- **Expected:** 200 OK with scan data

#### Test 7: Get Analysis
- **Method:** GET
- **URL:** `{{base_url}}/analysis/scan_1704628800000`
- **Expected:** 200 OK with analysis data

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

- **Scan Types:**
  - `quick`: ~90 seconds, limited subdomains
  - `full`: 300-500 seconds, comprehensive scan

- **File Storage:**
  - Scans saved to: `backend/scans/{scanId}.json`
  - Analysis saved to: `backend/analysis/{scanId}.ai.json`

- **Environment Variables:**
  - `PORT`: Server port (default: 5000)
  - `GEMINI_API_KEY`: Required for analysis endpoint

