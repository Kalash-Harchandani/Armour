# Armour 🛡️

**Advanced Domain Intelligence & Reconnaissance Platform**

Armour is a modern, beginner-friendly domain intelligence and reconnaissance platform built for developers and security learners. It provides clear visibility into how a domain is exposed on the internet with structured dashboards and AI-powered analysis.

## Features

- 🔍 **Quick & Full Scans** - Choose between fast 90-second quick scans or comprehensive 300-500 second full scans
- 📊 **Structured Dashboard** - View reconnaissance data in an organized, easy-to-understand format
- 🤖 **AI-Powered Analysis** - Get insights about potential security risks and misconfigurations using Gemini AI
- 🎯 **Beginner-Friendly** - Clear explanations and educational content for security learners
- 📱 **Modern UI** - Beautiful, responsive interface with dark theme

## Available Scripts

From the root directory:

- `npm run dev` - Run both backend and frontend in development mode
- `npm run start` - Run both backend and frontend in production mode
- `npm run install:all` - Install dependencies for root, backend, and frontend

## Project Structure

```
Armour/
├── backend/          # Backend scanning and analysis scripts
│   ├── scripts/      # Core scanning scripts
│   └── package.json
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── mock/        # Mock data for development
│   │   └── ...
│   └── package.json
└── docs/            # Documentation
```

## Quick Start

### Option 1: Run Both Together (Recommended)

1. Install all dependencies (root, backend, and frontend):
   ```bash
   npm run install:all
   ```

2. Create backend `.env` file:
   ```bash
   cd backend
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   cd ..
   ```

3. Run both frontend and backend:
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

3. Create `.env` file:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

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

## Documentation

- [Security Checklist](./docs/SECURITY_CHECKLIST.md) - Security best practices and GitHub push guidelines

## Tech Stack

### Backend
- Node.js
- Google Gemini AI
- DNS, HTTP, SSL scanning libraries

### Frontend
- React
- React Router
- Bootstrap (for styling)

## License

ISC

## Contributing

Contributions are welcome! Please ensure you follow the security guidelines in `docs/SECURITY_CHECKLIST.md` before pushing to GitHub.

