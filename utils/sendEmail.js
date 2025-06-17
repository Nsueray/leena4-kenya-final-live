const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Temel e-posta gönderme fonksiyonu
async function sendEmail({ to, subject, text, attachments = [] }) {
  const preparedAttachments = attachments.map(file => ({
    content: fs.readFileSync(file.path).toString('base64'),
    filename: file.filename,
    type: 'image/png',
    disposition: 'attachment'
  }));

  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject,
    text,
    attachments: preparedAttachments
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email error:', err.response?.body || err.message);
  }
}

// QR üretip e-posta atan fonksiyon
async function createQRAndSendEmail(visitor, badgeId, emailTemplate) {
  try {
    const qrData = `https://leena.app/badge.html?badge_id=${badgeId}`;
    const qrImagePath = path.join(__dirname, `../temp/${badgeId}.png`);

    await QRCode.toFile(qrImagePath, qrData, {
      type: 'png',
      width: 200,
      margin: 1
    });

    const text = emailTemplate
      .replace('[NAME]', visitor.fullName || '')
      .replace('[COMPANY]', visitor.company || '')
      .replace('[BADGE_ID]', badgeId)
      .replace('[QR_LINK]', qrData);

    await sendEmail({
      to: visitor.email,
      subject: 'Your Mega Clima Kenya 2025 QR Code',
      text,
      attachments: [
        { path: qrImagePath, filename: `${badgeId}.png` }
      ]
    });
  } catch (err) {
    console.error('❌ QR Email error:', err.message);
  }
}

// Dışa aktarılan fonksiyonlar
module.exports = {
  sendEmail,
  createQRAndSendEmail
};
