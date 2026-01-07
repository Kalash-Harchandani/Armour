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

/* ================= GEMINI ================= */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/* ================= PROMPT ================= */
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
  subdomains: recon.subdomains,
  dns: recon.dns,
  ports: recon.ports,
  http: recon.http,
  ssl: recon.ssl,
  tech: recon.tech
}, null, 2)}
`;

/* ================= RUN ================= */
async function run() {
  try {
    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    const finalOutput = {
      domain,
      analysis: analysisText
    };

    const outFile = path.join(
      OUTPUT_DIR,
      `${scanId}.ai.json`
    );

    fs.writeFileSync(outFile, JSON.stringify(finalOutput, null, 2));

    console.log(`AI analysis saved → ${outFile}`);
  } catch (err) {
    if (err.status === 503) {
      console.error("Gemini overloaded. Try again later.");
      process.exit(1);
    }

    console.error("AI analysis failed");
    console.error(err.message);
    process.exit(1);
  }
}

run();
