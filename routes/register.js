// routes/register.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createQRAndSendEmail } = require('../utils/sendEmail');

const router = express.Router();

// ✔️ visitors.json yolu: production'da /data, local'de ./data
const dataDir = process.env.NODE_ENV === 'production'
  ? '/data'
  : path.join(__dirname, '../data');

const visitorsFile = path.join(dataDir, 'visitors.json');

// 1. visitors dizini ve dosyası hazır değilse oluştur
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(visitorsFile)) fs.writeFileSync(visitorsFile, '[]', 'utf-8');

// Güvenli yazma: önce yedeğini al, sonra ekle
function safeWriteVisitors(entry) {
  const backup = path.join(dataDir, 'visitors.bak.json');
  fs.copyFileSync(visitorsFile, backup);
  const current = JSON.parse(fs.readFileSync(visitorsFile, 'utf-8'));
  current.push(entry);
  fs.writeFileSync(visitorsFile, JSON.stringify(current, null, 2), 'utf-8');
}

router.post('/register', async (req, res) => {
  try {
    // 2. Gerekli alanları doğrula
    const { firstName, lastName, company = '', email } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName ve email gereklidir.' });
    }

    // 3. Ziyaretçi objesini oluştur
    const badgeId = `MCKenya${Date.now()}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const visitor = {
      badgeId,
      fullName,
      company,
      email,
      createdAt: new Date().toISOString(),
    };

    // 4. Dosyaya kaydet
    safeWriteVisitors(visitor);

    // 5. QR oluşturup e-posta gönder
    const emailTemplate = `Hello [NAME],

Your badge has been created.
Badge ID: [BADGE_ID]
Company: [COMPANY]

Please find your QR attached.

See you at the event!`;
    await createQRAndSendEmail(visitor, badgeId, emailTemplate);

    // 6. Başarı yanıtı JSON olarak dön
    return res.json({ success: true, badgeId });
  } catch (err) {
    console.error('🔴 Register error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
