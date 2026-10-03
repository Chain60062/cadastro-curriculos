import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:3333';

  return {
    plugins: [react(), tailwindcss()],
    // O frontend chama sempre "/api/..." e o Vite repassa para o backend (sem CORS).
    server: { port: 5173, proxy: { '/api': apiTarget } },
    preview: { port: 4173, proxy: { '/api': apiTarget } },
  };
});
