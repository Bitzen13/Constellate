import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In dev the client talks to the game server through Vite, same as it does in production.
    proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } },
  },
});
