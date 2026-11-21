const { getConnection } = require('./connection');

function createTables() {
  const db = getConnection();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      color      TEXT NOT NULL DEFAULT '#8B5CF6',
      icon       TEXT NOT NULL DEFAULT 'tag',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id             INTEGER PRIMARY KEY,
      title          TEXT NOT NULL,
      amount         REAL NOT NULL CHECK (amount > 0),
      type           TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
      category_id    INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      payment_method TEXT NOT NULL DEFAULT 'CASH',
      date           TEXT NOT NULL,
      notes          TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  `);
}

module.exports = { createTables };
