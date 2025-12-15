import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          pouchdb: ['pouchdb', 'pouchdb-find']
        }
      }
    }
  },
  server: {
    port: 5173
  },
  define: {
    // Fix for PouchDB and other Node.js packages that expect Node globals
    'global': 'globalThis',
    'process.env': {},
    'process.browser': true
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    },
    include: ['pouchdb', 'pouchdb-find']
  }
});
