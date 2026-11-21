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
}

module.exports = { registerDatabaseHandlers };
