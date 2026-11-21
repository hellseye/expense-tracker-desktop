const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  // relative paths so the built app also works when loaded from disk
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
});
