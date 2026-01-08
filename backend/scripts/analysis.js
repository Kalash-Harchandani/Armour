#!/usr/bin/env node
/**
 * Armour Gemini Analysis Script (STRING OUTPUT)
 * Usage:
 *   node scripts/analysis.js domain.com recon.json
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ================= GEMINI ================= */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model priority list: try gemini-2.5-flash-lite first, then gemini-2.5-flash
const MODEL_PRIORITY = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash"
];

// Special error code for when all models fail
export const AI_ANALYSIS_UNAVAILABLE_ERROR = "AI_ANALYSIS_UNAVAILABLE";

/* ================= EXPORTABLE FUNCTION ================= */
export async function runAnalysis(domain, reconData) {
  // Wrap everything in try-catch to catch ALL possible errors
  try {
    if (!process.env.GEMINI_API_KEY) {
      const error = new Error("GEMINI_API_KEY environment variable is not set");
      error.code = AI_ANALYSIS_UNAVAILABLE_ERROR;
      throw error;
    }

    const scanId = reconData.scanId || `scan_${Date.now()}`;

  const prompt = `
I want you to act as a junior security analyst performing a passive reconnaissance review.
I will provide you with a JSON object containing scan data for a domain.

Your goal is to analyze the data and explain it clearly for a beginner audience using the following strict rules:

No Speculation: Do not guess the meaning of internal naming conventions or abbreviations.
No Security Jargon/Fear: Do not mention hacking, exploits, or compromise.

Strict Output Format:

AI Summary (Short):
- Exactly 3–4 concise bullet points.

Detailed Analysis:
1. Subdomains
2. DNS Records
3. Open Ports
4. HTTP Behavior
5. SSL/Security
6. Technology Stack

Overall Risk Assessment:
Low | Medium | High
2–3 sentence justification.

No follow-ups.

Domain: ${domain}

Recon Data:
${JSON.stringify({
  subdomains: reconData.subdomains,
  dns: reconData.dns,
  ports: reconData.ports,
  http: reconData.http,
  ssl: reconData.ssl,
  tech: reconData.tech
}, null, 2)}
`;

  // Try each model in priority order
  let lastError = null;
  
  for (const modelName of MODEL_PRIORITY) {
    try {
      console.log(`[${new Date().toISOString()}] Attempting analysis with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const analysisText = result.response.text();

      console.log(`[${new Date().toISOString()}] Successfully generated analysis with model: ${modelName}`);
      
      return {
        domain,
        scanId,
        analysis: analysisText
      };
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Model ${modelName} failed:`, err.message);
      lastError = err;
      
      // If it's a rate limit or overload error, try next model
      if (err.status === 503 || err.status === 429) {
        continue;
      }
      
      // For other errors, also try next model
      continue;
    }
  }

    // All models failed - return special error
    console.error(`[${new Date().toISOString()}] All Gemini models failed. Last error:`, lastError?.message);
    const error = new Error("All AI models are currently unavailable");
    error.code = AI_ANALYSIS_UNAVAILABLE_ERROR;
    throw error;
  } catch (err) {
    // Catch ANY error that occurs during analysis
    // This includes: missing API key, network errors, model errors, etc.
    console.error(`[${new Date().toISOString()}] Analysis error caught:`, err.message);
    
    // If error already has the special code, re-throw it
    if (err.code === AI_ANALYSIS_UNAVAILABLE_ERROR) {
      throw err;
    }
    
    // For any other error, wrap it with the special error code
    const error = new Error("AI analysis is currently unavailable");
    error.code = AI_ANALYSIS_UNAVAILABLE_ERROR;
    error.originalError = err.message; // Keep original error for logging
    throw error;
  }
}

/* ================= CLI MODE ================= */
// Only run CLI code if this file is executed directly (not imported)
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('analysis.js') || 
  process.argv[1].includes('scripts/analysis.js')
);

if (isMainModule) {
  /* ================= INPUT ================= */
  const domain = process.argv[2];
  const reconPath = process.argv[3];

  if (!domain || !reconPath) {
    console.error("Usage: node scripts/analysis.js domain.com recon.json");
    process.exit(1);
  }

  const recon = JSON.parse(fs.readFileSync(reconPath, "utf-8"));
  const scanId = recon.scanId || `scan_${Date.now()}`;

  /* ================= OUTPUT DIR ================= */
  const OUTPUT_DIR = "./analysis";
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  async function run() {
    try {
      const result = await runAnalysis(domain, recon);
      
      const outFile = path.join(OUTPUT_DIR, `${scanId}.ai.json`);
      fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
      
      console.log(`AI analysis saved → ${outFile}`);
    } catch (err) {
      if (err.message.includes("overloaded")) {
        console.error("Gemini overloaded. Try again later.");
        process.exit(1);
      }

      console.error("AI analysis failed");
      console.error(err.message);
      process.exit(1);
    }
  }

  run();
}
