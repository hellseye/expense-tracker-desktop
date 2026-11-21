const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

let db = null;

function getConnection() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'expense-tracker.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

module.exports = { getConnection };
