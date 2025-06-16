const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();
const visitorsFile = path.join(__dirname, '../data/visitors.json');
const qrDir = path.join(__dirname, '../public/qrcodes');

if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);

function readVisitors() {
  if (!fs.existsSync(visitorsFile)) return [];
  return JSON.parse(fs.readFileSync(visitorsFile));
}

function writeVisitors(data) {
  fs.writeFileSync(visitorsFile, JSON.stringify(data, null, 2));
}

router.post('/', async (req, res) => {
  const { name, lastName, email, company, origin, source } = req.body;
  if (!name || !lastName || !email || !company) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const badgeId = Date.now().toString();
  const fullName = `${name} ${lastName}`;
  const qrUrl = `/badge.html?badge_id=${badgeId}`;
  const qrPath = path.join(qrDir, `${badgeId}.png`);

  await QRCode.toFile(qrPath, `https://yourdomain.com${qrUrl}`);

  const newVisitor = {
    id: badgeId,
    fullName,
    email,
    company,
    origin,
    source,
    createdAt: new Date().toISOString()
  };

  const visitors = readVisitors();
  visitors.push(newVisitor);
  writeVisitors(visitors);

  if (config.sendEmail) {
    await sendEmail({
      to: email,
      subject: config.emailSubject,
      text: config.emailBody.replace('[NAME]', fullName),
      attachments: [{ filename: 'qrcode.png', path: qrPath }]
    });
  }

  res.json({ message: 'Visitor registered', badgeId });
});

module.exports = router;
