const nodemailer = require('nodemailer');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: ADMIN_EMAIL,
    pass: GMAIL_APP_PASSWORD
  }
});

/**
 * Kirim email permintaan approval akses ke admin.
 * Berisi link approve & reject yang langsung bisa diklik dari email.
 */
async function sendApprovalRequest({ requestId, requesterName, requesterEmail, reason, baseUrl }) {
  const approveUrl = `${baseUrl}/api/admin/license-request/${requestId}?action=approve`;
  const rejectUrl = `${baseUrl}/api/admin/license-request/${requestId}?action=reject`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 500px;">
      <h2>Permintaan Akses Baru — Creative Alibi</h2>
      <p><b>Nama:</b> ${escapeHtml(requesterName)}</p>
      <p><b>Email:</b> ${escapeHtml(requesterEmail)}</p>
      <p><b>Alasan:</b> ${escapeHtml(reason || '-')}</p>
      <div style="margin-top:20px;">
        <a href="${approveUrl}" style="background:#2f7a4f;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;margin-right:10px;">✅ Setujui</a>
        <a href="${rejectUrl}" style="background:#a5432b;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">❌ Tolak</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Creative Alibi" <${ADMIN_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `Permintaan Akses Baru: ${requesterName}`,
    html
  });
}

/**
 * Kirim email berisi kode lisensi ke pemohon setelah di-approve.
 */
async function sendLicenseApproved({ requesterEmail, requesterName, licenseKey, expiresAt }) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 500px;">
      <h2>Akses Disetujui — Creative Alibi</h2>
      <p>Halo ${escapeHtml(requesterName)},</p>
      <p>Permintaan akses kamu sudah disetujui. Berikut kode lisensi kamu:</p>
      <p style="font-size:20px; font-weight:bold; background:#f0f0f0; padding:12px; border-radius:6px; text-align:center;">
        ${escapeHtml(licenseKey)}
      </p>
      <p>Berlaku sampai: <b>${new Date(expiresAt).toLocaleDateString('id-ID')}</b></p>
      <p>Masukkan kode ini di halaman aktivasi Creative Alibi untuk mulai menggunakan add-in.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Creative Alibi" <${ADMIN_EMAIL}>`,
    to: requesterEmail,
    subject: 'Kode Lisensi Creative Alibi Kamu',
    html
  });
}

/**
 * Kirim email pemberitahuan bahwa permintaan ditolak.
 */
async function sendLicenseRejected({ requesterEmail, requesterName }) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 500px;">
      <h2>Permintaan Akses — Creative Alibi</h2>
      <p>Halo ${escapeHtml(requesterName)},</p>
      <p>Mohon maaf, permintaan akses kamu belum dapat kami setujui saat ini.</p>
      <p>Silakan hubungi kami jika ada pertanyaan lebih lanjut.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Creative Alibi" <${ADMIN_EMAIL}>`,
    to: requesterEmail,
    subject: 'Update Permintaan Akses Creative Alibi',
    html
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendApprovalRequest, sendLicenseApproved, sendLicenseRejected };