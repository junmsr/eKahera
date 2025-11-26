import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const proxySettings = {};
  // Always proxy API requests during local development so the frontend can use
  // relative `/api` paths and Vite will forward them to the backend.
  if (mode === 'development') {
    proxySettings['/api'] = {
      target: 'http://localhost:5000', // local backend server
      changeOrigin: true,
      secure: false,
    };
  }

  return {
    base: '/',
    plugins: [
      react({
        babel: {
          plugins: ['styled-jsx/babel'],
        },
      }),
      tailwindcss()
    ],
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
