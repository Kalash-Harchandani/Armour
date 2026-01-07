# Armour Backend

Backend scanning and analysis scripts for the Armour reconnaissance platform.

## Scripts

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

## Environment Variables

Create a `.env` file in the backend directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

⚠️ **Never commit `.env` files to version control!**

## Dependencies

Install with:
```bash
npm install
```

## Output Directory

Analysis results are saved to `analysis/` directory (automatically created if it doesn't exist).

