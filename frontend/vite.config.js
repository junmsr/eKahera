import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const proxySettings = {};
  // If VITE_API_BASE_URL is NOT set, we are in local development and need to proxy.
  if (!env.VITE_API_BASE_URL) {
    proxySettings['/api'] = {
      target: 'http://localhost:5000', // Your local backend server
      changeOrigin: true,
    };
  }

  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    server: {
      proxy: proxySettings,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});
