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
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            utils: ['axios', 'framer-motion'],
            charts: ['recharts'],
            qr: ['@yudiel/react-qr-scanner', '@ericblade/quagga2']
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
        },
      },
      chunkSizeWarningLimit: 1000, // in KB
      minify: 'terser',
      sourcemap: true,
      target: 'esnext',
      cssCodeSplit: true,
      reportCompressedSize: true,
      commonjsOptions: {
        include: [/node_modules/],
        extensions: ['.js', '.cjs'],
        strictRequires: true,
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      esbuildOptions: {
        target: 'esnext',
      },
    },
  };
});
