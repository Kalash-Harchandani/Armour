#!/usr/bin/env node
/**
 * Armour Express API Server
 * Provides REST API endpoints for scanning and analysis
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runScanWithTimeout } from "./scripts/scan.js";
import { runAnalysis } from "./scripts/analysis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure output directories exist
const SCAN_OUTPUT_DIR = path.join(__dirname, "scans");
const ANALYSIS_OUTPUT_DIR = path.join(__dirname, "analysis");

[SCAN_OUTPUT_DIR, ANALYSIS_OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Armour API is running",
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/scan
 * Scan a domain (quick or full mode)
 * Body: { domain: string, scanType: "quick" | "full" }
 */
app.post("/api/scan", async (req, res) => {
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

    // Save scan result to file
    const scanFile = path.join(SCAN_OUTPUT_DIR, `${scanResult.scanId}.json`);
    fs.writeFileSync(scanFile, JSON.stringify(scanResult, null, 2));

    console.log(`[${new Date().toISOString()}] Scan completed: ${scanResult.scanId}`);

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
 * Body: { domain: string, scanData: object } OR { scanId: string }
 */
app.post("/api/analyze", async (req, res) => {
  try {
    const { domain, scanData, scanId } = req.body;

    let reconData = scanData;
    let targetDomain = domain;

    // If scanId is provided, load from file
    if (scanId && !scanData) {
      const scanFile = path.join(SCAN_OUTPUT_DIR, `${scanId}.json`);
      
      if (!fs.existsSync(scanFile)) {
        return res.status(404).json({ 
          error: "Scan not found",
          message: `Scan with ID ${scanId} not found`
        });
      }

      reconData = JSON.parse(fs.readFileSync(scanFile, "utf-8"));
      targetDomain = reconData.domain || domain;
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

    console.log(`[${new Date().toISOString()}] Starting analysis for: ${targetDomain}`);

    // Run analysis
    const analysisResult = await runAnalysis(targetDomain, reconData);

    // Save analysis result to file
    const analysisFile = path.join(ANALYSIS_OUTPUT_DIR, `${analysisResult.scanId}.ai.json`);
    fs.writeFileSync(analysisFile, JSON.stringify(analysisResult, null, 2));

    console.log(`[${new Date().toISOString()}] Analysis completed: ${analysisResult.scanId}`);

    res.json({
      success: true,
      scanId: analysisResult.scanId,
      domain: analysisResult.domain,
      analysis: analysisResult.analysis
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Analysis error:`, error.message);
    res.status(500).json({ 
      error: "Analysis failed",
      message: error.message 
    });
  }
});

/**
 * GET /api/scan/:scanId
 * Get scan results by scanId
 */
app.get("/api/scan/:scanId", (req, res) => {
  try {
    const { scanId } = req.params;
    const scanFile = path.join(SCAN_OUTPUT_DIR, `${scanId}.json`);

    if (!fs.existsSync(scanFile)) {
      return res.status(404).json({ 
        error: "Scan not found",
        message: `Scan with ID ${scanId} not found`
      });
    }

    const scanData = JSON.parse(fs.readFileSync(scanFile, "utf-8"));
    res.json({
      success: true,
      data: scanData
    });

  } catch (error) {
    res.status(500).json({ 
      error: "Failed to retrieve scan",
      message: error.message 
    });
  }
});

/**
 * GET /api/analysis/:scanId
 * Get analysis results by scanId
 */
app.get("/api/analysis/:scanId", (req, res) => {
  try {
    const { scanId } = req.params;
    const analysisFile = path.join(ANALYSIS_OUTPUT_DIR, `${scanId}.ai.json`);

    if (!fs.existsSync(analysisFile)) {
      return res.status(404).json({ 
        error: "Analysis not found",
        message: `Analysis for scan ID ${scanId} not found`
      });
    }

    const analysisData = JSON.parse(fs.readFileSync(analysisFile, "utf-8"));
    res.json({
      success: true,
      data: analysisData
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
  console.log(`   POST   /api/scan`);
  console.log(`   POST   /api/analyze`);
  console.log(`   GET    /api/scan/:scanId`);
  console.log(`   GET    /api/analysis/:scanId\n`);
});

