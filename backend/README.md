# Armour Backend

Backend scanning and analysis scripts and API server for the Armour reconnaissance platform.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the backend directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

⚠️ **Never commit `.env` files to version control!**

### 3. Start the API Server

**Production mode:**
```bash
npm start
```

**Development mode (with auto-reload):**
```bash
npm run dev
```

Or if you have nodemon installed globally:
```bash
nodemon server.js
```

The server will start on `http://localhost:5000`

**Note:** If you see an error about `index.js`, make sure you're running:
- `npm start` or `npm run dev` (recommended)
- OR `node server.js` directly
- NOT `nodemon i` or `node index.js`

## API Server

The Express API server provides REST endpoints for scanning and analysis.

### Endpoints

- **POST** `/api/scan` - Scan a domain (quick or full mode)
- **POST** `/api/analyze` - Analyze scan data with Gemini AI
- **GET** `/api/scan/:scanId` - Get scan results
- **GET** `/api/analysis/:scanId` - Get analysis results
- **GET** `/api/health` - Health check

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

### Example Usage

**Start a scan:**
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "scanType": "quick"}'
```

**Analyze scan results:**
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"scanId": "scan_1704628800000"}'
```

## CLI Scripts (Legacy)

The original CLI scripts are still available for direct use:

### `scripts/scan.js`
Performs domain reconnaissance scanning (quick or full mode).

**Usage:**
```bash
node scripts/scan.js <domain> [quick|full]
```

**Example:**
```bash
node scripts/scan.js example.com quick
node scripts/scan.js example.com full
```

**Output:** JSON scan data printed to stdout

### `scripts/analysis.js`
Analyzes scan data using Google Gemini AI.

**Usage:**
```bash
node scripts/analysis.js <domain> <recon.json>
```

**Example:**
```bash
node scripts/analysis.js example.com recon.json
```

**Output:** AI analysis saved to `analysis/<scanId>.ai.json`

## Output Directories

- **Scans:** `scans/` - Saved scan results
- **Analysis:** `analysis/` - Saved analysis results

Both directories are automatically created and gitignored.

