// Jalankan: node server/scripts/generate-license.js [jumlah_hari] ["catatan"]
// Contoh:   node server/scripts/generate-license.js 365 "pembeli A"
const { createLicense } = require('../lib/licenses');
async function main() {
  const daysValid = parseInt(process.argv[2] || '365', 10);
  const note = process.argv[3] || '';
  const entry = await createLicense(daysValid, note);
  console.log('✅ Kode lisensi baru:', entry.key);
  console.log('   Berlaku sampai:', entry.expiresAt);
  if (note) console.log('   Catatan:', note);
}
main().catch(err => {
  console.error('❌ Gagal generate lisensi:', err.message);
  process.exit(1);
});
