/**
 * Sync Helper Utilities
 * Helper functions to manually control and diagnose sync
 */

import { commonPersistence } from '../services/common-persistence.js';
import { syncConfigService } from '../services/sync-config.js';

/**
 * Manually start sync for common database
 * @param {Object} credentials - Optional credentials {username, password}
 */
export async function startCommonDatabaseSync(credentials = null) {
  try {
    console.log('🔄 Starting common database sync...');

    // Set credentials if provided
    if (credentials) {
      syncConfigService.setCredentials(credentials);
      console.log('✅ Credentials set');
    }

    // Check if credentials exist
    if (!syncConfigService.credentials) {
      console.error('❌ No credentials set!');
      console.log('💡 Call with credentials: startCommonDatabaseSync({username: "user", password: "pass"})');
      return false;
    }

    // Ensure common database is initialized
    await commonPersistence.ensureInitialized();
    console.log('✅ Common database initialized');

    // Get remote URL
    const remoteUrl = syncConfigService.getCommonDbUrl();
    console.log('🌐 Remote URL:', remoteUrl);

    // Setup sync
    await commonPersistence.setupSync(remoteUrl, syncConfigService.credentials);
    console.log('✅ Sync started successfully!');

    // Monitor sync events
    console.log('👀 Sync events will appear below...');

    return true;
  } catch (error) {
    console.error('❌ Failed to start sync:', error);
    return false;
  }
}

/**
 * Force an immediate sync (one-time)
 */
export async function forceSyncNow() {
  try {
    console.log('⚡ Forcing immediate sync...');

    if (!syncConfigService.credentials) {
      console.error('❌ No credentials set!');
      return false;
    }

    const remoteUrl = syncConfigService.getCommonDbUrl();
    const result = await commonPersistence.forceSync(remoteUrl, syncConfigService.credentials);

    console.log('✅ Force sync completed:', result);
    return true;
  } catch (error) {
    console.error('❌ Force sync failed:', error);
    return false;
  }
}

/**
 * Check sync status and report
 */
export async function checkSyncStatus() {
  console.log('='.repeat(50));
  console.log('📊 Common Database Sync Status');
  console.log('='.repeat(50));

  try {
    // Check credentials
    const hasCreds = !!syncConfigService.credentials;
    console.log('Credentials:', hasCreds ? '✅ Set' : '❌ Not set');
    if (hasCreds) {
      console.log('  Username:', syncConfigService.credentials.username);
    }

    // Check sync handler
    const syncHandler = commonPersistence.syncHandler;
    console.log('Sync handler:', syncHandler ? '✅ Active' : '❌ Not started');

    // Check local database
    await commonPersistence.ensureInitialized();
    const localInfo = await commonPersistence.getDatabaseInfo();
    console.log('Local PouchDB:');
    console.log('  Documents:', localInfo.doc_count);
    console.log('  Update seq:', localInfo.update_seq);

    // Check remote database (if credentials available)
    if (hasCreds) {
      try {
        const authHeader = 'Basic ' + btoa(
          syncConfigService.credentials.username + ':' +
          syncConfigService.credentials.password
        );

        const response = await fetch('http://127.0.0.1:5984/bmpl_common', {
          headers: { 'Authorization': authHeader }
        });

        if (response.ok) {
          const remoteInfo = await response.json();
          console.log('Remote CouchDB:');
          console.log('  Documents:', remoteInfo.doc_count);
          console.log('  Update seq:', remoteInfo.update_seq);

          // Compare
          if (localInfo.doc_count === remoteInfo.doc_count) {
            console.log('✅ Local and remote are in sync');
          } else if (localInfo.doc_count > remoteInfo.doc_count) {
            console.log('⚠️  Local has more docs - may need to sync up');
          } else {
            console.log('⚠️  Remote has more docs - may need to sync down');
          }
        } else {
          console.log('❌ Could not access remote database:', response.status);
        }
      } catch (error) {
        console.log('❌ Error checking remote:', error.message);
      }
    }

    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
}

/**
 * Stop sync
 */
export function stopSync() {
  commonPersistence.cancelSync();
  console.log('⏹️  Sync stopped');
}

/**
 * Restart sync
 */
export async function restartSync() {
  console.log('🔄 Restarting sync...');
  stopSync();
  await new Promise(resolve => setTimeout(resolve, 1000));
  return await startCommonDatabaseSync();
}

// Export all functions
export const syncHelper = {
  startCommonDatabaseSync,
  forceSyncNow,
  checkSyncStatus,
  stopSync,
  restartSync
};

// Make available globally in debug mode
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  window.syncHelper = syncHelper;
  console.log('💡 Sync helper loaded. Available methods:');
  console.log('  - window.syncHelper.startCommonDatabaseSync({username, password})');
  console.log('  - window.syncHelper.forceSyncNow()');
  console.log('  - window.syncHelper.checkSyncStatus()');
  console.log('  - window.syncHelper.stopSync()');
  console.log('  - window.syncHelper.restartSync()');
}

export default syncHelper;
