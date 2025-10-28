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
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Firebase core (always needed)
          'firebase-core': [
            'firebase/compat/app',
            'firebase/compat/auth',
            'firebase/compat/firestore'
          ],

          // Firebase optional (lazy loaded)
          'firebase-storage': ['firebase/compat/storage'],

          // Heavy libraries (lazy loaded in code)
          'image-compression': ['browser-image-compression'],

          // Icons
          'icons': ['lucide-react'],
        }
      }
    },
    // Reduce chunk size warning limit now that we're optimizing
    chunkSizeWarningLimit: 800,
    // Copy service worker to dist folder
    copyPublicDir: true,
    // Enable hidden sourcemaps for production debugging
    sourcemap: 'hidden'
  }
});
