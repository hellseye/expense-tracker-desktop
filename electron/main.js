const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createTables } = require('./database/schema');
const { seedCategories } = require('./database/seed');
const { registerDatabaseHandlers } = require('./handlers/databaseHandlers');

// userData folder name: ~/Library/Application Support/Ledger
app.setName('Ledger');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(() => {
  createTables();
  seedCategories();
  registerDatabaseHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
