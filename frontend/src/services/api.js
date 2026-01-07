/**
 * API Service for Backend Communication
 * Centralized API calls to the Armour backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

/**
 * Make API request with error handling and extended timeout for long operations
 */
async function apiRequest(endpoint, options = {}) {
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 600000); // 10 minutes default

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Don't throw if the request was aborted (might be intentional)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The scan is taking longer than expected. Please try again.');
    }
    
    // If error already has a message, use it
    if (error.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
      throw error;
    }
    
    // Check if it's a network/fetch error
    if (error instanceof TypeError || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      throw new Error('Network error: Could not connect to the server. Make sure the backend is running on port 5002.');
    }
    
    // Generic error fallback
    throw new Error(error.message || 'Network error: Could not connect to the server');
  }
}

/**
 * Health check endpoint
 */
export async function checkHealth() {
  return apiRequest('/health');
}

/**
 * Scan a domain
 * @param {string} domain - Domain to scan
 * @param {string} scanType - 'quick' or 'full'
 * @returns {Promise<Object>} Scan result with scanId
 */
export async function scanDomain(domain, scanType = 'quick') {
  // Quick scan: 2 minutes timeout, Full scan: 10 minutes timeout
  const timeout = scanType === 'quick' ? 120000 : 600000;
  
  return apiRequest('/scan', {
    method: 'POST',
    body: JSON.stringify({ domain, scanType }),
    timeout: timeout,
  });
}

/**
 * Analyze scan data using Gemini AI
 * @param {string} scanId - The scan ID from scanDomain response
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeScan(scanId) {
  // Analysis can take 30-60 seconds, give it 2 minutes
  return apiRequest('/analyze', {
    method: 'POST',
    body: JSON.stringify({ scanId }),
    timeout: 120000,
  });
}

/**
 * Get scan results by scanId
 * @param {string} scanId - The scan ID
 * @returns {Promise<Object>} Scan data
 */
export async function getScan(scanId) {
  return apiRequest(`/scan/${scanId}`);
}

/**
 * Get analysis results by scanId
 * @param {string} scanId - The scan ID
 * @returns {Promise<Object>} Analysis data
 */
export async function getAnalysis(scanId) {
  return apiRequest(`/analysis/${scanId}`);
}

