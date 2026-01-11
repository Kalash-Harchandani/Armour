#!/usr/bin/env node
/**
 * Armour Express API Server
 * Provides REST API endpoints for scanning and analysis
 * Uses MongoDB for data persistence
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport.js";
import { runScanWithTimeout } from "./scripts/scan.js";
import { runAnalysis, AI_ANALYSIS_UNAVAILABLE_ERROR } from "./scripts/analysis.js";
import { connectDB } from "./config/database.js";
import Scan from "./models/Scan.js";
import Analysis from "./models/Analysis.js";
import User from "./models/User.js";
import { authenticate, generateToken } from "./middleware/auth.js";
import { checkScanLimit } from "./middleware/rateLimit.js";

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
const allowedOrigins = [
  "https://wearearmour.in",
  "https://www.wearearmour.in"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow non-browser requests (curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin); // 👈 echo back exact origin
    } else {
      return callback(new Error("CORS not allowed"), false);
    }
  },
  credentials: true
}));

app.use(express.json());


// Session configuration
// WARNING: Default secret is for development only. Always set SESSION_SECRET in production .env file!
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

// ==================== AUTHENTICATION ROUTES ====================

/**
 * GET /api/auth/google
 * Initiate Google OAuth login
 */
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

/**
 * GET /api/auth/google/callback
 * Google OAuth callback - returns JWT token
 */
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user._id);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL;
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Auth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL;
      res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user information
 */
app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const remaining = user.getRemainingScans();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        scanLimits: {
          quick: {
            used: user.scanLimits.quickScansUsed,
            limit: user.scanLimits.quickScansLimit,
            remaining: remaining.quick,
          },
          full: {
            used: user.scanLimits.fullScansUsed,
            limit: user.scanLimits.fullScansLimit,
            remaining: remaining.full,
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get user info",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
app.post("/api/auth/logout", authenticate, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * POST /api/scan
 * Scan a domain (quick or full mode)
 * Requires authentication
 * Body: { domain: string, scanType: "quick" | "full" }
 */
app.post("/api/scan", authenticate, checkScanLimit, async (req, res) => {
  try {
    const { domain, scanType = "quick" } = req.body;

    // Validation
    if (!domain) {
      return res.status(400).json({ 
        error: "Domain is required",
        message: "Please provide a domain in the request body"
      });
    }

    if (scanType !== "quick" && scanType !== "full") {
      return res.status(400).json({ 
        error: "Invalid scan type",
        message: "scanType must be either 'quick' or 'full'"
      });
    }

    // Validate domain format (basic)
    const domainRegex = /^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    
    if (!domainRegex.test(cleanDomain)) {
      return res.status(400).json({ 
        error: "Invalid domain format",
        message: "Please provide a valid domain (e.g., example.com)"
      });
    }

    console.log(`[${new Date().toISOString()}] Starting ${scanType} scan for: ${cleanDomain}`);

    // Run scan with timeout
    const scanResult = await runScanWithTimeout(cleanDomain, scanType);

    // Save scan result to MongoDB
    const scanDoc = new Scan({
      scanId: scanResult.scanId,
      userId: req.userId,
      domain: scanResult.domain,
      mode: scanResult.mode,
      status: scanResult.status,
      data: scanResult,
    });

    await scanDoc.save();

    // Increment user's scan count
    await req.user.incrementScanCount(scanType);

    console.log(`[${new Date().toISOString()}] Scan completed and saved to MongoDB: ${scanResult.scanId}`);

    res.json({
      success: true,
      scanId: scanResult.scanId,
      domain: scanResult.domain,
      mode: scanResult.mode,
      status: scanResult.status,
      data: scanResult
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Scan error:`, error.message);
    res.status(500).json({ 
      error: "Scan failed",
      message: error.message 
    });
  }
});

/**
 * POST /api/analyze
 * Analyze scan data using Gemini AI
 * Requires authentication
 * Body: { domain: string, scanData: object } OR { scanId: string }
 */
app.post("/api/analyze", authenticate, async (req, res) => {
  try {
    const { domain, scanData, scanId } = req.body;

    let reconData = scanData;
    let targetDomain = domain;

    // If scanId is provided, load from MongoDB
    if (scanId && !scanData) {
      const scanDoc = await Scan.findOne({ scanId, userId: req.userId });
      
      if (!scanDoc) {
        return res.status(404).json({ 
          error: "Scan not found",
          message: `Scan with ID ${scanId} not found or you don't have access to it`
        });
      }

      reconData = scanDoc.data;
      targetDomain = scanDoc.domain || domain;
    }

    // Validation
    if (!reconData) {
      return res.status(400).json({ 
        error: "Scan data is required",
        message: "Please provide either scanData or scanId in the request body"
      });
    }

    if (!targetDomain) {
      return res.status(400).json({ 
        error: "Domain is required",
        message: "Please provide a domain in the request body"
      });
    }

    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Configuration error",
        message: "GEMINI_API_KEY environment variable is not set"
      });
    }

    // Get scanId from scanData or scanId parameter
    const targetScanId = scanId || reconData?.scanId;

    // Check if analysis already exists for this scanId
    if (targetScanId) {
      const existingAnalysis = await Analysis.findOne({ 
        scanId: targetScanId, 
        userId: req.userId 
      });

      if (existingAnalysis) {
        console.log(`[${new Date().toISOString()}] Analysis already exists for scanId: ${targetScanId}, returning existing analysis`);
        return res.json({
          success: true,
          scanId: existingAnalysis.scanId,
          domain: existingAnalysis.domain,
          analysis: existingAnalysis.analysis,
          cached: true
        });
      }
    }

    console.log(`[${new Date().toISOString()}] Starting analysis for: ${targetDomain}`);

    // Run analysis
    const analysisResult = await runAnalysis(targetDomain, reconData);

    // Check again if analysis was created by another concurrent request
    const existingAnalysis = await Analysis.findOne({ 
      scanId: analysisResult.scanId, 
      userId: req.userId 
    });

    if (existingAnalysis) {
      console.log(`[${new Date().toISOString()}] Analysis was created concurrently, returning existing: ${analysisResult.scanId}`);
      return res.json({
        success: true,
        scanId: existingAnalysis.scanId,
        domain: existingAnalysis.domain,
        analysis: existingAnalysis.analysis,
        cached: true
      });
    }

    // Save analysis result to MongoDB
    const analysisDoc = new Analysis({
      scanId: analysisResult.scanId,
      userId: req.userId,
      domain: analysisResult.domain,
      analysis: analysisResult.analysis,
      data: analysisResult,
    });

    try {
      await analysisDoc.save();
      console.log(`[${new Date().toISOString()}] Analysis completed and saved to MongoDB: ${analysisResult.scanId}`);
    } catch (saveError) {
      // Handle duplicate key error (race condition)
      if (saveError.code === 11000 && saveError.keyPattern?.scanId) {
        console.log(`[${new Date().toISOString()}] Duplicate analysis detected (race condition), fetching existing: ${analysisResult.scanId}`);
        const existing = await Analysis.findOne({ 
          scanId: analysisResult.scanId, 
          userId: req.userId 
        });
        
        if (existing) {
          return res.json({
            success: true,
            scanId: existing.scanId,
            domain: existing.domain,
            analysis: existing.analysis,
            cached: true
          });
        }
      }
      throw saveError; // Re-throw if it's not a duplicate key error
    }

    res.json({
      success: true,
      scanId: analysisResult.scanId,
      domain: analysisResult.domain,
      analysis: analysisResult.analysis
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Analysis error:`, error.message);
    if (error.originalError) {
      console.error(`[${new Date().toISOString()}] Original error:`, error.originalError);
    }
    
    // For ANY analysis error, return the user-friendly MVP message
    // This catches: missing API key, model failures, network errors, etc.
    return res.status(503).json({ 
      success: false,
      error: "AI_ANALYSIS_UNAVAILABLE",
      message: "We're still in the MVP phase 🚧 Some AI analysis features are limited right now. Please check back soon — we're actively working on it!"
    });
  }
});

/**
 * GET /api/scan/:scanId
 * Get scan results by scanId
 * Requires authentication - users can only access their own scans
 */
app.get("/api/scan/:scanId", authenticate, async (req, res) => {
  try {
    const { scanId } = req.params;
    const scanDoc = await Scan.findOne({ scanId, userId: req.userId });

    if (!scanDoc) {
      return res.status(404).json({ 
        error: "Scan not found",
        message: `Scan with ID ${scanId} not found or you don't have access to it`
      });
    }

    res.json({
      success: true,
      data: scanDoc.data
    });

  } catch (error) {
    res.status(500).json({ 
      error: "Failed to retrieve scan",
      message: error.message 
    });
  }
});

/**
 * GET /api/scans
 * Get all scans for the authenticated user
 * Requires authentication
 */
app.get("/api/scans", authenticate, async (req, res) => {
  try {
    const scans = await Scan.find({ userId: req.userId })
      .sort({ createdAt: -1 }) // Most recent first
      .select("scanId domain mode status createdAt")
      .limit(50); // Limit to 50 most recent scans

    res.json({
      success: true,
      scans: scans.map(scan => ({
        scanId: scan.scanId,
        domain: scan.domain,
        mode: scan.mode,
        status: scan.status,
        createdAt: scan.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve scans",
      message: error.message,
    });
  }
});

/**
 * GET /api/analysis/:scanId
 * Get analysis results by scanId
 * Requires authentication - users can only access their own analyses
 */
app.get("/api/analysis/:scanId", authenticate, async (req, res) => {
  try {
    const { scanId } = req.params;
    const analysisDoc = await Analysis.findOne({ scanId, userId: req.userId });

    if (!analysisDoc) {
      return res.status(404).json({ 
        error: "Analysis not found",
        message: `Analysis for scan ID ${scanId} not found or you don't have access to it`
      });
    }

    res.json({
      success: true,
      data: analysisDoc.data
    });

  } catch (error) {
    res.status(500).json({ 
      error: "Failed to retrieve analysis",
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Armour API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 API endpoints:`);
  console.log(`   GET    /api/auth/google`);
  console.log(`   GET    /api/auth/google/callback`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   POST   /api/auth/logout`);
  console.log(`   POST   /api/scan (requires auth)`);
  console.log(`   POST   /api/analyze (requires auth)`);
  console.log(`   GET    /api/scan/:scanId (requires auth)`);
  console.log(`   GET    /api/analysis/:scanId (requires auth)`);
  console.log(`\n💾 Using MongoDB for data storage`);
  console.log(`🔐 Authentication: Google OAuth + JWT\n`);
});

