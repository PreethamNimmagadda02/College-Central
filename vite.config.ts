import path from 'path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Plugin to inject build timestamp into service worker
const injectBuildTime = (): Plugin => {
  return {
    name: 'inject-build-time',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        const buildTime = Date.now().toString();
        content = content.replace('__BUILD_TIME__', buildTime);
        fs.writeFileSync(swPath, content);
        console.log(`✓ Service worker updated with build time: ${buildTime}`);
      }
    }
  };
};

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      port: 3000,
      host: 'localhost'
    }
  },
  plugins: [react(), injectBuildTime()],
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
