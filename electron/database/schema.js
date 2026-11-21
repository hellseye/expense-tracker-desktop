const { getConnection } = require('./connection');

function createTables() {
  const db = getConnection();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      type       TEXT NOT NULL DEFAULT 'expense',
      color      TEXT NOT NULL DEFAULT '#8B5CF6',
      icon       TEXT NOT NULL DEFAULT 'tag',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id              INTEGER PRIMARY KEY,
      name            TEXT NOT NULL UNIQUE,
      type            TEXT NOT NULL DEFAULT 'cash',
      initial_balance REAL NOT NULL DEFAULT 0 CHECK (initial_balance >= 0),
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id             INTEGER PRIMARY KEY,
      title          TEXT NOT NULL,
      amount         REAL NOT NULL CHECK (amount > 0),
      type           TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
      category_id    INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      account_id     INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
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

  // Databases created before category types existed get the new column here.
  const categoryColumns = db.prepare('PRAGMA table_info(categories)').all();
  if (!categoryColumns.some((column) => column.name === 'type')) {
    db.exec("ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'");
  }

  // Databases created before accounts existed get the optional link column here.
  const transactionColumns = db.prepare('PRAGMA table_info(transactions)').all();
  if (!transactionColumns.some((column) => column.name === 'account_id')) {
    db.exec('ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT');
  }

  // Index goes after the migration: on older databases the column only exists now.
  db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)');
}

module.exports = { createTables };
