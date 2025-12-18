/**
 * Shared PouchDB Initialization
 * Uses PouchDB loaded from CDN (global window.PouchDB)
 * This avoids Vite bundling issues with class extension
 */

// Get PouchDB from global (loaded via CDN in index.html)
let PouchDB = window.PouchDB;

if (!PouchDB) {
  console.error('PouchDB not found! Make sure it is loaded via CDN in index.html');
} else {
  console.log('PouchDB loaded from CDN (global)');
}

/**
 * Wait for PouchDB and pouchdb-find plugin to be ready
 */
async function waitForPouchDB(maxWait = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    if (window.PouchDB) {
      // Check if find plugin is loaded by testing createIndex
      const testDb = new window.PouchDB('_pouchdb_plugin_test_');
      const hasFind = typeof testDb.createIndex === 'function';
      testDb.close();

      if (hasFind) {
        console.log('PouchDB and pouchdb-find plugin ready');
        return window.PouchDB;
      }
    }
    // Wait 50ms before checking again
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Timeout - return PouchDB anyway but warn about missing plugin
  if (window.PouchDB) {
    console.warn('PouchDB loaded but pouchdb-find plugin not detected after timeout');
    return window.PouchDB;
  }

  throw new Error('PouchDB not loaded after timeout. Check CDN scripts in index.html');
}

/**
 * Get PouchDB instance (async for compatibility)
 */
export async function getPouchDB() {
  if (!window.PouchDB) {
    // Wait for PouchDB to load
    return waitForPouchDB();
  }

  // Check if find plugin is ready
  const testDb = new window.PouchDB('_pouchdb_plugin_test_');
  const hasFind = typeof testDb.createIndex === 'function';
  testDb.close();

  if (!hasFind) {
    // Wait for find plugin
    return waitForPouchDB();
  }

  return window.PouchDB;
}

/**
 * Check if PouchDB is initialized
 */
export function isPouchDBInitialized() {
  return !!window.PouchDB;
}

/**
 * Get PouchDB class (synchronous)
 */
export function getPouchDBSync() {
  if (!window.PouchDB) {
    throw new Error('PouchDB not loaded. Check CDN script in index.html');
  }
  return window.PouchDB;
}

export { PouchDB };
export default getPouchDB;
