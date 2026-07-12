const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const BUCKET_NAME = 'ai-alibi-licenses';
const FILE_NAME = 'licenses.json';

async function readLicenses() {
  try {
    const file = storage.bucket(BUCKET_NAME).file(FILE_NAME);
    const [contents] = await file.download();
    return JSON.parse(contents.toString());
  } catch (e) {
    return [];
  }
}

async function writeLicenses(licenses) {
  const file = storage.bucket(BUCKET_NAME).file(FILE_NAME);
  await file.save(JSON.stringify(licenses, null, 2), { contentType: 'application/json' });
}

function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 12; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key.match(/.{1,4}/g).join('-');
}

async function createLicense(daysValid = 365, note = '') {
  const licenses = await readLicenses();
  const newKey = generateKey();
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
  const entry = {
    key: newKey,
    used: false,
    activatedBy: null,
    activatedAt: null,
    note,
    createdAt: new Date().toISOString(),
    expiresAt
  };
  licenses.push(entry);
  await writeLicenses(licenses);
  return entry;
}

async function activateLicense(key, deviceId) {
  const licenses = await readLicenses();
  const entry = licenses.find(l => l.key === key);
  if (!entry) return { success: false, error: 'Kode lisensi tidak ditemukan.' };
  if (entry.used) return { success: false, error: 'Kode lisensi sudah pernah digunakan.' };
  if (new Date(entry.expiresAt) < new Date()) return { success: false, error: 'Kode lisensi sudah kedaluwarsa.' };

  entry.used = true;
  entry.activatedBy = deviceId || 'unknown';
  entry.activatedAt = new Date().toISOString();
  await writeLicenses(licenses);
  return { success: true, expiresAt: entry.expiresAt };
}

async function listLicenses() {
  return readLicenses();
}

module.exports = { createLicense, activateLicense, listLicenses };