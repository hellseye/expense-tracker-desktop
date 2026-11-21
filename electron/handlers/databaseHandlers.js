const { ipcMain } = require('electron');
const { getConnection } = require('../database/connection');

function registerDatabaseHandlers() {
  ipcMain.handle('get-categories', () => {
    const db = getConnection();
    return db.prepare(`
      SELECT c.*, COUNT(t.id) AS transaction_count
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id
      GROUP BY c.id
      ORDER BY c.id
    `).all();
  });

  ipcMain.handle('add-category', (_event, category) => {
    const db = getConnection();
    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(category.name);
    if (existing) {
      throw new Error('A category with this name already exists');
    }
    const result = db.prepare(`
      INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)
    `).run(category.name, category.type, category.color, category.icon);
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-category', (_event, category) => {
    const db = getConnection();
    const duplicate = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(category.name, category.id);
    if (duplicate) {
      throw new Error('A category with this name already exists');
    }
    const result = db.prepare(`
      UPDATE categories SET name = ?, type = ?, color = ?, icon = ? WHERE id = ?
    `).run(category.name, category.type, category.color, category.icon, category.id);
    if (result.changes === 0) {
      throw new Error('Category not found');
    }
    return result.changes;
  });

  ipcMain.handle('delete-category', (_event, id) => {
    const db = getConnection();
    const { count } = db.prepare('SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?').get(id);
    if (count > 0) {
      throw new Error(`Cannot delete: ${count} transaction(s) use this category`);
    }
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    if (result.changes === 0) {
      throw new Error('Category not found');
    }
    return result.changes;
  });

  ipcMain.handle('get-accounts', () => {
    const db = getConnection();
    return db.prepare(`
      SELECT a.*, COUNT(t.id) AS transaction_count,
        a.initial_balance + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS balance
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      GROUP BY a.id
      ORDER BY a.id
    `).all();
  });

  ipcMain.handle('add-account', (_event, account) => {
    const db = getConnection();
    const existing = db.prepare('SELECT id FROM accounts WHERE name = ?').get(account.name);
    if (existing) {
      throw new Error('An account with this name already exists');
    }
    const result = db.prepare(`
      INSERT INTO accounts (name, type, initial_balance) VALUES (?, ?, ?)
    `).run(account.name, account.type, account.initialBalance);
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-account', (_event, account) => {
    const db = getConnection();
    const duplicate = db.prepare('SELECT id FROM accounts WHERE name = ? AND id != ?').get(account.name, account.id);
    if (duplicate) {
      throw new Error('An account with this name already exists');
    }
    const result = db.prepare(`
      UPDATE accounts SET name = ?, type = ?, initial_balance = ? WHERE id = ?
    `).run(account.name, account.type, account.initialBalance, account.id);
    if (result.changes === 0) {
      throw new Error('Account not found');
    }
    return result.changes;
  });

  ipcMain.handle('delete-account', (_event, id) => {
    const db = getConnection();
    const { count } = db.prepare('SELECT COUNT(*) AS count FROM transactions WHERE account_id = ?').get(id);
    if (count > 0) {
      throw new Error(`Cannot delete: ${count} transaction(s) use this account`);
    }
    const result = db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    if (result.changes === 0) {
      throw new Error('Account not found');
    }
    return result.changes;
  });

  ipcMain.handle('get-transactions', () => {
    const db = getConnection();
    return db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all();
  });

  ipcMain.handle('add-transaction', (_event, transaction) => {
    const db = getConnection();
    const result = db.prepare(`
      INSERT INTO transactions (title, amount, type, category_id, account_id, payment_method, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transaction.title,
      transaction.amount,
      transaction.type,
      transaction.categoryId,
      transaction.accountId ?? null,
      transaction.paymentMethod,
      transaction.date,
      transaction.notes
    );
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-transaction', (_event, transaction) => {
    const db = getConnection();
    const result = db.prepare(`
      UPDATE transactions
      SET title = ?, amount = ?, type = ?, category_id = ?, account_id = ?, payment_method = ?, date = ?, notes = ?
      WHERE id = ?
    `).run(
      transaction.title,
      transaction.amount,
      transaction.type,
      transaction.categoryId,
      transaction.accountId ?? null,
      transaction.paymentMethod,
      transaction.date,
      transaction.notes,
      transaction.id
    );
    if (result.changes === 0) {
      throw new Error('Transaction not found');
    }
    return result.changes;
  });

  ipcMain.handle('delete-transaction', (_event, id) => {
    const db = getConnection();
    const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    if (result.changes === 0) {
      throw new Error('Transaction not found');
    }
    return result.changes;
  });
}

module.exports = { registerDatabaseHandlers };
