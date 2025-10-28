import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      port: 3000,
      host: 'localhost'
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': [
            'firebase/compat/app',
            'firebase/compat/auth',
            'firebase/compat/firestore',
            'firebase/compat/storage'
          ],
          'ai': ['@google/genai'],
          'pdf': ['jspdf'],
          'icons': ['lucide-react'],
        }
      }
    },
    // Increase chunk size warning limit to 1000kb for main chunk
    chunkSizeWarningLimit: 1000,
    // Copy service worker to dist folder
    copyPublicDir: true
  }
});
