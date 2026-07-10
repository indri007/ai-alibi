/**
 * Creative Alibi In-App Support Chat
 * DeepSeek (via OpenRouter) - powered support assistant
 */

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

const SYSTEM_PROMPT = `Kamu adalah asisten support untuk Creative Alibi, sebuah Word Add-in yang membuat sertifikat keaslian untuk membuktikan tulisan dibuat manusia asli dengan merekam metadata perilaku (keystroke forensics), analisis linguistik, dan integrasi AI detector eksternal (GPTZero, ZeroGPT, IBM watsonx.ai).

TUGAS UTAMA: bantu user pasang add-in di Word, jelaskan fitur, troubleshooting, jelaskan skor sertifikat.

GAYA JAWAB: Bahasa Indonesia santai, singkat, step-by-step. Jangan klaim sertifikat 100% akurat.`;

async function chat(message, history = []) {
  if (!OPENROUTER_KEY) throw new Error('OpenRouter API key tidak dikonfigurasi.');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://creativealibi.app',
      'X-Title': 'Creative Alibi Support',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return { reply: data.choices[0].message.content, usage: data.usage };
}

module.exports = { chat };
