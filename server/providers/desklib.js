/**
 * Desklib AI Text Detector Provider
 * Proxies detection requests to the local Python sidecar (FastAPI).
 *
 * Falls back gracefully if the Python service is not running.
 */

const axios = require('axios');

const DESKLIB_URL = process.env.DESKLIB_URL || 'http://127.0.0.1:5000';
const TIMEOUT_MS = parseInt(process.env.DESKLIB_TIMEOUT_MS || '30000', 10); // 30s for CPU inference

/**
 * Detect whether text is AI-generated using the local Desklib model.
 * @param {string} text - Text to analyze (min 50 characters)
 * @returns {Promise<object>} Detection result
 */
async function detect(text) {
  const start = Date.now();

  try {
    const response = await axios.post(
      `${DESKLIB_URL}/detect`,
      { text, threshold: 0.5 },
      { timeout: TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
    );

    const data = response.data;
    const elapsed = Date.now() - start;

    return {
      success: true,
      provider: 'desklib',
      model: 'desklib/ai-text-detector-v1.01',
      probability: data.probability,
      label: data.label,
      isAiGenerated: data.is_ai_generated,
      threshold: data.threshold,
      textLength: data.text_length,
      processingTimeMs: elapsed,
      source: 'local',
    };
  } catch (error) {
    const elapsed = Date.now() - start;

    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return {
        success: false,
        provider: 'desklib',
        error: 'Python detection service tidak berjalan. Jalankan: cd server/detector && python app.py',
        processingTimeMs: elapsed,
        source: 'local',
        unreachable: true,
      };
    }

    if (error.response) {
      return {
        success: false,
        provider: 'desklib',
        error: error.response.data?.detail || error.response.data?.error || 'Service error',
        statusCode: error.response.status,
        processingTimeMs: elapsed,
        source: 'local',
      };
    }

    return {
      success: false,
      provider: 'desklib',
      error: error.message || 'Unknown error',
      processingTimeMs: elapsed,
      source: 'local',
    };
  }
}

module.exports = detect;
