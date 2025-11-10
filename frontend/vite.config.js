import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Define the proxy target. Use the env variable if it exists,
  // otherwise default to the local backend server.
  const proxyTarget = env.VITE_API_BASE_URL || 'http://localhost:5000';

  return {
    base: '/eKahera/',
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});

