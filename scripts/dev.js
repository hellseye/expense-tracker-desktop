const { createServer } = require('vite');
const { spawn } = require('child_process');
const electronPath = require('electron');

async function startDev() {
  const server = await createServer();
  await server.listen();
  console.log('Vite is ready, starting Electron...');

  const app = spawn(electronPath, ['.'], { stdio: 'inherit' });
  app.on('exit', () => process.exit());
}

startDev();
