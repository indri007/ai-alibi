/**
 * Desklib AI Text Detector Provider (Fixed)
 * Proxies detection requests to the Python FastAPI sidecar.
 *
 * Environment variables:
 *   DESKLIB_URL       - Python FastAPI URL (default: http://127.0.0.1:5000)
 *                        Set this to the desklib-detector Cloud Run URL when
 *                        the Python service runs in a separate container.
 *   DESKLIB_TIMEOUT_MS - Timeout in ms (default: 60000)
 *
 * Architecture:
 *   creative-alibi (Node.js) ──HTTP──> desklib-detector (Python/FastAPI)
 *     ^-- DESKLIB_URL points here
 */

const axios = require('axios');

const DESKLIB_URL = process.env.DESKLIB_URL || 'http://127.0.0.1:5000';
const TIMEOUT_MS = parseInt(process.env.DESKLIB_TIMEOUT_MS || '60000', 10);

/**
 * Detect whether text is AI-generated using the local Desklib model.
 *
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
      source: DESKLIB_URL.includes('127.0.0.1') ? 'local' : 'cloud',
    };
  } catch (error) {
    const elapsed = Date.now() - start;

    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return {
        success: false,
        provider: 'desklib',
        error: `Python detection service tidak dapat dijangkau di ${DESKLIB_URL}. ` +
               `Jalankan: cd server/detector && python app.py` +
               (DESKLIB_URL !== 'http://127.0.0.1:5000'
                 ? `\nAtau periksa DESKLIB_URL environment variable: ${DESKLIB_URL}`
                 : ''),
        processingTimeMs: elapsed,
        source: 'local',
        unreachable: true,
      };
    }

    if (error.response) {
      const detail =
        error.response.data?.detail ||
        error.response.data?.error ||
        'Service error';
      return {
        success: false,
        provider: 'desklib',
        error: `Desklib service (${error.response.status}): ${detail}`,
        statusCode: error.response.status,
        processingTimeMs: elapsed,
        source: 'cloud',
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        provider: 'desklib',
        error: `Request timeout after ${TIMEOUT_MS}ms. Model mungkin masih cold start.`,
        processingTimeMs: elapsed,
        source: 'cloud',
        timeout: true,
      };
    }

    return {
      success: false,
      provider: 'desklib',
      error: error.message || 'Unknown error',
      processingTimeMs: elapsed,
      source: 'cloud',
    };
  }
}

module.exports = detect;
