#!/usr/bin/env node
/**
 * Armour Recon Script (Quick + Full)
 * Usage: node scripts/scan.js example.com quick|full
 * Passive only. Safe & legal.
 */

import dns from "dns/promises";
import axios from "axios";
import net from "net";
import { load } from "cheerio";
import sslChecker from "ssl-checker";
import pLimit from "p-limit";

/* ================= CONFIG ================= */
export const CONFIG = {
  quick: {
    TIMEOUT: 3000,
    CRT_TIMEOUT: 5000,
    CONCURRENCY: 3,
    MAX_SUBDOMAINS: 5,
    MAX_SCAN_TIME: 60_000,
    HEAVY_MAIN_ONLY: true
  },
  full: {
    TIMEOUT: 6000,
    CRT_TIMEOUT: 15000,
    CONCURRENCY: 5,
    MAX_SUBDOMAINS: 200,
    MAX_SCAN_TIME: 300_000,
    HEAVY_MAIN_ONLY: false
  }
};

const PORTS = [80, 443, 8080];

/* ================= UTILS ================= */
const dedupe = arr => [...new Set(arr.filter(Boolean))];

/* ================= SUBDOMAINS ================= */
async function getSubdomains(domain, config) {
  try {
    const r = await axios.get(
      `https://crt.sh/?q=%25.${domain}&output=json`,
      { timeout: config.CRT_TIMEOUT }
    );

    const subs = new Set();
    r.data.forEach(e => {
      (e.name_value || "")
        .split("\n")
        .map(s => s.replace("*.", "").toLowerCase())
        .filter(s => s.endsWith(domain))
        .forEach(s => subs.add(s));
    });

    return dedupe([domain, ...subs]).slice(0, config.MAX_SUBDOMAINS);
  } catch {
    return [domain];
  }
}

/* ================= DNS ================= */
async function getDNS(host) {
  return {
    A: await dns.resolve(host, "A").catch(() => []),
    AAAA: await dns.resolve(host, "AAAA").catch(() => []),
    MX: (await dns.resolveMx(host).catch(() => [])).map(m => m.exchange),
    NS: await dns.resolveNs(host).catch(() => []),
    TXT: (await dns.resolveTxt(host).catch(() => [])).map(t => t.join(" "))
  };
}

/* ================= PORT CHECK ================= */
function checkPort(host, port, timeout) {
  return new Promise(res => {
    const s = new net.Socket();
    s.setTimeout(timeout);

    s.on("connect", () => { s.destroy(); res({ port, open: true }); });
    s.on("timeout", () => { s.destroy(); res({ port, open: false }); });
    s.on("error", () => { s.destroy(); res({ port, open: false }); });

    s.connect(port, host);
  });
}

/* ================= TECH DETECTION ================= */
function detectTech(headers = {}, html = "") {
  const tech = new Set();
  const h = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()])
  );
  const body = html.toLowerCase();

  if (h.server?.includes("nginx")) tech.add("Nginx");
  if (h.server?.includes("apache")) tech.add("Apache");
  if (h.server?.includes("cloudflare")) tech.add("Cloudflare");
  if (h["x-powered-by"]?.includes("php")) tech.add("PHP");
  if (body.includes("wp-content")) tech.add("WordPress");
  if (body.includes("react")) tech.add("React");

  return [...tech];
}

/* ================= HTTP ================= */
async function getHTTP(host, timeout) {
  for (const url of [`https://${host}`, `http://${host}`]) {
    try {
      const r = await axios.get(url, {
        timeout: timeout,
        maxRedirects: 5,
        validateStatus: () => true
      });

      const html = typeof r.data === "string" ? r.data : "";
      const $ = load(html);

      return {
        status: r.status,
        title: $("title").first().text().trim() || null,
        server: r.headers?.server || null,
        redirected: r.request?.res?.responseUrl !== url,
        technologies: detectTech(r.headers, html)
      };
    } catch {}
  }
  return null;
}

/* ================= SSL ================= */
async function getSSL(host) {
  try {
    const s = await sslChecker(host);
    return { valid: s.valid, expiresAt: s.validTo };
  } catch {
    return { valid: false };
  }
}

/* ================= CORE RUN ================= */
export async function runScan(domain, scanMode = "quick") {
  const config = CONFIG[scanMode] || CONFIG.quick;
  const { TIMEOUT, CRT_TIMEOUT, CONCURRENCY, HEAVY_MAIN_ONLY } = config;

  const subs = await getSubdomains(domain, config);
  const limit = pLimit(CONCURRENCY);

  const hosts = await Promise.all(
    subs.map(host =>
      limit(async () => {
        const isMain = host === domain;
        const heavy = HEAVY_MAIN_ONLY ? isMain : true;

        const [dnsInfo, http, ssl, ports] = await Promise.all([
          getDNS(host),
          heavy ? getHTTP(host, TIMEOUT) : null,
          heavy ? getSSL(host) : null,
          Promise.all(PORTS.map(p => checkPort(host, p, TIMEOUT)))
        ]);

        return {
          hostname: host,
          dns: dnsInfo,
          http,
          ssl,
          openPorts: ports.filter(p => p.open).map(p => p.port),
          technologies: http?.technologies || []
        };
      })
    )
  );

  const main = hosts.find(h => h.hostname === domain) || hosts[0];

  return {
    scanId: `scan_${Date.now()}`,
    domain,
    mode: scanMode,
    status: "completed",
    subdomains: hosts.map(h => h.hostname),
    dns: main?.dns || {},
    ports: {
      80: main?.openPorts?.includes(80) || false,
      443: main?.openPorts?.includes(443) || false,
      8080: main?.openPorts?.includes(8080) || false
    },
    http: main?.http ? { [main.hostname]: main.http } : {},
    ssl: main?.ssl ? { [main.hostname]: main.ssl } : {},
    tech: dedupe(main?.technologies || [])
  };
}

export async function runScanWithTimeout(domain, scanMode = "quick") {
  const config = CONFIG[scanMode] || CONFIG.quick;
  const { MAX_SCAN_TIME } = config;

  return Promise.race([
    runScan(domain, scanMode),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Scan timed out")), MAX_SCAN_TIME)
    )
  ]).catch(error => {
    if (error.message === "Scan timed out") {
      return {
        scanId: `scan_${Date.now()}`,
        domain,
        mode: scanMode,
        status: "partial",
        message: "Scan timed out"
      };
    }
    throw error;
  });
}

/* ================= CLI MODE ================= */
// Only run CLI code if this file is executed directly (not imported)
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('scan.js') || 
  process.argv[1].includes('scripts/scan.js')
);

if (isMainModule) {
  const domain = process.argv[2];
  const mode = process.argv[3] || "quick";

  if (!domain) {
    console.error("Usage: node scripts/scan.js domain.com quick|full");
    process.exit(1);
  }

  const config = CONFIG[mode] || CONFIG.quick;
  const { MAX_SCAN_TIME } = config;

  // Run CLI scan
Promise.race([
    runScan(domain, mode),
  new Promise((_, r) => setTimeout(() => r(new Error("timeout")), MAX_SCAN_TIME))
])
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(() =>
    console.log(JSON.stringify({
      scanId: `scan_${Date.now()}`,
      domain,
      mode,
      status: "partial",
      message: "Scan timed out"
    }, null, 2))
  );
}



