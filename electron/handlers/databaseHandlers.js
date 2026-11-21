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
