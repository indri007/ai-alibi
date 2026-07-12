// ============================================================
// lib/healthChecks.js
// Deep health check: cek koneksi live ke Desklib service & GCS
// bucket. Desklib dikasih timeout lebih longgar karena model
// PyTorch butuh waktu lama untuk cold start (scale-to-zero).
// ============================================================

const axios = require('axios');
const { Storage } = require('@google-cloud/storage');
const createLogger = require('../utils/logger');

const logger = createLogger('healthChecks');

const DESKLIB_URL = process.env.DESKLIB_URL || 'http://127.0.0.1:5000';
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'ai-alibi-licenses';
const GCS_TIMEOUT_MS = 3000;
const DESKLIB_TIMEOUT_MS = 15000; // longgar untuk cold start PyTorch

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function checkDesklib() {
  const start = Date.now();
  try {
    const response = await withTimeout(
      axios.get(`${DESKLIB_URL}/health`, {
        timeout: DESKLIB_TIMEOUT_MS,
        validateStatus: () => true,
      }),
      DESKLIB_TIMEOUT_MS
    );
    const elapsed = Date.now() - start;
    return {
      status: response.status < 500 ? 'ok' : 'degraded',
      httpStatus: response.status,
      latencyMs: elapsed,
      note: elapsed > 5000 ? 'cold_start_kemungkinan' : undefined,
    };
  } catch (error) {
    logger.warn(`Desklib unreachable di ${DESKLIB_URL}: ${error.message}`);
    return { status: 'unreachable', error: error.message, latencyMs: Date.now() - start };
  }
}

async function checkGCS() {
  const start = Date.now();
  try {
    const storage = new Storage();
    const [exists] = await withTimeout(
      storage.bucket(GCS_BUCKET_NAME).exists(),
      GCS_TIMEOUT_MS
    );
    if (!exists) {
      logger.warn(`Bucket GCS "${GCS_BUCKET_NAME}" tidak ditemukan.`);
      return { status: 'not_found', bucket: GCS_BUCKET_NAME, latencyMs: Date.now() - start };
    }
    return { status: 'ok', bucket: GCS_BUCKET_NAME, latencyMs: Date.now() - start };
  } catch (error) {
    logger.warn(`GCS bucket check gagal: ${error.message}`);
    return { status: 'error', bucket: GCS_BUCKET_NAME, error: error.message, latencyMs: Date.now() - start };
  }
}

module.exports = { checkDesklib, checkGCS };
