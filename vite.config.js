import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    commonjsOptions: {
      // Transform PouchDB CommonJS to ES modules
      include: [/pouchdb/, /node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          pouchdb: ['pouchdb', 'pouchdb-find']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy CouchDB requests to avoid CORS issues in development
      '/couchdb': {
        target: 'http://127.0.0.1:5984',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/couchdb/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('CouchDB proxy error:', err);
          });
        }
      }
    }
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
    // Exclude PouchDB from pre-bundling to prevent class extension issues
    exclude: ['pouchdb-browser', 'pouchdb', 'pouchdb-find']
  },
  ssr: {
    // Also exclude from SSR optimization
    noExternal: ['pouchdb-browser', 'pouchdb', 'pouchdb-find']
  }
});
