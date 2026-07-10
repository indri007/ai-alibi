/**
 * HIX AI Bypass Provider - Premium Account
 * Uses hixbypass.com premium API
 */

const axios = require('axios');

const HIX_API = 'https://hixbypass.com/api/hixbypass/v1';
const TIMEOUT_MS = parseInt(process.env.HIX_TIMEOUT_MS || '45000', 10);

async function detect(text) {
  const start = Date.now();
  const email = process.env.HIX_EMAIL || '';
  const password = process.env.HIX_PASSWORD || '';

  if (!email || !password) {
    return { success: false, provider: 'hix',
      error: 'HIX_EMAIL dan HIX_PASSWORD tidak dikonfigurasi.',
      processingTimeMs: Date.now() - start, source: 'cloud' };
  }

  try {
    // Try direct detect with credentials
    const detectRes = await axios.post(HIX_API + '/detect', {
      text: text,
      email: email,
      password: password
    }, { timeout: TIMEOUT_MS });

    const elapsed = Date.now() - start;
    const d = detectRes.data;

    return {
      success: true, provider: 'hix',
      model: d.model || 'hix/bypass-premium',
      probability: d.ai_probability ?? d.ai_score ?? d.probability ?? 0.5,
      label: (d.ai_probability ?? 0.5) > 0.5 ? 'AI' : 'Human',
      isAiGenerated: (d.ai_probability ?? 0.5) > 0.5,
      humanizedText: d.humanized_text || d.text || null,
      textLength: text.length,
      processingTimeMs: elapsed, source: 'cloud',
    };
  } catch (error) {
    const elapsed = Date.now() - start;
    if (error.response) {
      return { success: false, provider: 'hix',
        error: 'HIX: ' + (typeof error.response.data === 'string' ? error.response.data.substring(0,100) : JSON.stringify(error.response.data).substring(0,100)),
        statusCode: error.response.status, processingTimeMs: elapsed, source: 'cloud' };
    }
    return { success: false, provider: 'hix',
      error: error.message || 'Gagal terhubung ke HIX.',
      processingTimeMs: elapsed, source: 'cloud' };
  }
}

module.exports = detect;
