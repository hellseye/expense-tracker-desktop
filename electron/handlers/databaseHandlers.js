const { ipcMain } = require('electron');
const { getConnection } = require('../database/connection');

function registerDatabaseHandlers() {
  ipcMain.handle('get-categories', () => {
    const db = getConnection();
    return db.prepare('SELECT * FROM categories ORDER BY id').all();
  });

  ipcMain.handle('get-transactions', () => {
    const db = getConnection();
    return db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all();
  });

  ipcMain.handle('add-transaction', (_event, transaction) => {
    const db = getConnection();
    const result = db.prepare(`
      INSERT INTO transactions (title, amount, type, category_id, payment_method, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      transaction.title,
      transaction.amount,
      transaction.type,
      transaction.categoryId,
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
      SET title = ?, amount = ?, type = ?, category_id = ?, payment_method = ?, date = ?, notes = ?
      WHERE id = ?
    `).run(
      transaction.title,
      transaction.amount,
      transaction.type,
      transaction.categoryId,
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
