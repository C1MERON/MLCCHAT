import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    host: '0.0.0.0', // This will bind to all network interfaces
    port: 8080,      // The desired port
  },
});
