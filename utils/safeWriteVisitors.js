const fs = require('fs');
const path = require('path');

const VISITOR_FILE = path.join(__dirname, '../data/visitors.json');
const BACKUP_FILE = path.join(__dirname, '../data/visitors.json.bak');

function safeWriteVisitors(newVisitors) {
  try {
    if (!Array.isArray(newVisitors) || newVisitors.length === 0) {
      console.log('⚠️ No visitors to write. Skipping write.');
      return;
    }

    let existing = [];
    if (fs.existsSync(VISITOR_FILE)) {
      const raw = fs.readFileSync(VISITOR_FILE, 'utf8');
      existing = JSON.parse(raw);
    }

    // Merge visitors
    const merged = [...existing, ...newVisitors];

    // Backup before writing
    fs.copyFileSync(VISITOR_FILE, BACKUP_FILE);

    fs.writeFileSync(VISITOR_FILE, JSON.stringify(merged, null, 2), 'utf8');
    console.log(`✅ Added ${newVisitors.length} visitors (total: ${merged.length})`);
  } catch (err) {
    console.error('❌ Error writing visitors.json:', err.message);
  }
}

module.exports = { safeWriteVisitors };
