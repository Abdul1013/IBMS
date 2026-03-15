import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  // Dev server
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5500', changeOrigin: true },
      '/socket.io': { target: 'http://127.0.0.1:5500', ws: true },
    },
  },

  // Production build
  build: {
    target: 'es2020',
    sourcemap: false, // no source maps in prod (protect code, reduce size)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor packages into cacheable chunks — unchanged deps = cache hit on re-deploy
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          'vendor-charts': ['recharts'],
          'vendor-editor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-image',
            '@tiptap/extension-underline',
          ],
          'vendor-socket': ['socket.io-client'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },

  // Preview server — test the prod build locally before shipping
  preview: {
    port: 4173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5500', changeOrigin: true },
      '/socket.io': { target: 'http://127.0.0.1:5500', ws: true },
    },
  },
});
