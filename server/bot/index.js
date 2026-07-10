/**
 * Creative Alibi Support Bot
 * Telegram bot @Creativealibi_bot - DeepSeek via OpenRouter
 * Native fetch - no external dependencies needed
 */

const dotenv = require('dotenv');
dotenv.config();

// Config
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';
const ALLOWED_USERS = (process.env.ALLOWED_USERS || '').split(',').filter(Boolean);
let OFFSET = 0;
let ACTIVE = true;

if (!BOT_TOKEN) { console.error('TELEGRAM_BOT_TOKEN tidak diatur'); process.exit(1); }
if (!OPENROUTER_KEY) { console.error('OPENROUTER_API_KEY tidak diatur'); process.exit(1); }

const SYSTEM_PROMPT = `Kamu adalah asisten support untuk Creative Alibi, sebuah Word Add-in yang membuat sertifikat keaslian (authenticity certificate) untuk membuktikan tulisan dibuat manusia asli dengan merekam metadata perilaku (keystroke forensics), analisis linguistik, dan integrasi AI detector eksternal (GPTZero, ZeroGPT, IBM watsonx.ai).

TUGAS UTAMA:
- Bantu user memasang dan mengaktifkan add-in di Microsoft Word
- Jelaskan cara kerja fitur: recording keystroke, linguistic analysis, dan generate sertifikat
- Troubleshoot masalah umum (add-in tidak muncul, server tidak connect, API key error, port 3001 tidak jalan, dll)
- Jelaskan hasil/skor yang muncul di sertifikat dengan bahasa mudah dipahami

GAYA JAWAB:
- Bahasa Indonesia santai tapi jelas, step-by-step kalau troubleshooting
- Kalau tidak yakin, jujur bilang tidak tahu dan sarankan cek dokumentasi

BATASAN:
- Jangan berikan API key atau kredensial ke user
- Jangan klaim sertifikat 100% akurat - ini bukti pendukung, bukan bukti hukum mutlak`;

async function tg(method, body = {}) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) console.error(`Telegram ${method}: ${data.description}`);
  return data;
}

function isAllowed(chatId) {
  return !ALLOWED_USERS.length || ALLOWED_USERS.includes(String(chatId));
}

async function askLLM(messages) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://creativealibi.app',
      'X-Title': 'Creative Alibi Bot',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function handleCommand(cmd, args, chatId) {
  if (cmd === '/start') {
    return tg('sendMessage', {
      chat_id: chatId,
      text: 'Halo! Aku asisten support Creative Alibi.\n\nAda yang bisa dibantu? Misalnya:\n- Cara install add-in di Word\n- Cara generate sertifikat\n- Troubleshooting error\n\nTinggal tanya aja!',
    });
  }
  if (cmd === '/help') {
    return tg('sendMessage', {
      chat_id: chatId,
      text: 'Bantuan Creative Alibi\n\nPerintah:\n/start - Mulai\n/help - Bantuan ini\n/detect [teks] - Deteksi AI langsung\n\nAtau tanya langsung apa aja!',
    });
  }
}

async function poll() {
  while (ACTIVE) {
    try {
      const data = await tg('getUpdates', { offset: OFFSET, timeout: 30 });
      if (!data.ok) continue;
      for (const update of data.result || []) {
        OFFSET = update.update_id + 1;
        const msg = update.message;
        if (!msg || !msg.text) continue;
        if (!isAllowed(msg.chat.id)) continue;

        const cmdMatch = msg.text.match(/^\/(\w+)\s*(.*)/);
        if (cmdMatch) {
          await handleCommand(cmdMatch[1], cmdMatch[2], msg.chat.id);
          continue;
        }

        await tg('sendChatAction', { chat_id: msg.chat.id, action: 'typing' });
        try {
          const reply = await askLLM([{ role: 'user', content: msg.text }]);
          await tg('sendMessage', {
            chat_id: msg.chat.id,
            text: reply,
          });
        } catch (err) {
          console.error('LLM error:', err.message);
          await tg('sendMessage', { chat_id: msg.chat.id, text: 'Maaf, lagi error teknis. Coba ulang nanti.' });
        }
      }
    } catch (err) {
      console.error('Poll error:', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

console.log('Creative Alibi Support Bot started!');
console.log(`Model: ${OPENROUTER_MODEL}`);
console.log(`Allowed users: ${ALLOWED_USERS.length ? ALLOWED_USERS.join(', ') : 'semua'}`);
poll();
