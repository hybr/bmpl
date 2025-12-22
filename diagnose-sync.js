/**
 * Sync Diagnostic Script
 * Run this in browser console to diagnose sync issues
 */

async function diagnoseCouchDBSync() {
  console.log('='.repeat(60));
  console.log('CouchDB Sync Diagnostics');
  console.log('='.repeat(60));
  console.log('');

  // 1. Check if services are available
  console.log('1. Checking service availability...');
  const services = {
    syncConfigService: typeof window.syncConfigService !== 'undefined',
    commonPersistence: typeof window.commonPersistence !== 'undefined',
    seedDataService: typeof window.seedDataService !== 'undefined'
  };
  console.log('Services available:', services);

  if (!services.syncConfigService || !services.commonPersistence) {
    console.error('❌ Required services not available. Are you in DEBUG mode?');
    return;
  }
  console.log('✅ All services available\n');

  // 2. Check CouchDB connectivity
  console.log('2. Checking CouchDB connectivity...');
  try {
    const response = await fetch('http://127.0.0.1:5984/');
    if (response.ok) {
      const info = await response.json();
      console.log('✅ CouchDB is running:', info.version);
      console.log('   CouchDB URL: http://127.0.0.1:5984/');
    } else {
      console.error('❌ CouchDB returned error:', response.status);
    }
  } catch (error) {
    console.error('❌ Cannot connect to CouchDB:', error.message);
    console.log('   Make sure CouchDB is running on http://127.0.0.1:5984/');
  }
  console.log('');

  // 3. Check if bmpl_common database exists
  console.log('3. Checking if bmpl_common database exists...');
  try {
    const response = await fetch('http://127.0.0.1:5984/bmpl_common');
    if (response.ok) {
      const dbInfo = await response.json();
      console.log('✅ Database exists');
      console.log('   Documents:', dbInfo.doc_count);
      console.log('   Update seq:', dbInfo.update_seq);
    } else if (response.status === 404) {
      console.error('❌ Database does not exist!');
      console.log('   Run: curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_common');
    } else if (response.status === 401) {
      console.error('❌ Authentication required');
    }
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
  console.log('');

  // 4. Check credentials
  console.log('4. Checking credentials...');
  const credentials = window.syncConfigService.credentials;
  if (credentials) {
    console.log('✅ Credentials set');
    console.log('   Username:', credentials.username);
  } else {
    console.error('❌ No credentials set!');
    console.log('   Set with: window.syncConfigService.setCredentials({username: "testuser", password: "testpassword"})');
  }
  console.log('');

  // 5. Check local PouchDB
  console.log('5. Checking local PouchDB...');
  try {
    await window.commonPersistence.ensureInitialized();
    const localInfo = await window.commonPersistence.getDatabaseInfo();
    console.log('✅ Local database initialized');
    console.log('   Documents:', localInfo.doc_count);
    console.log('   Update seq:', localInfo.update_seq);
  } catch (error) {
    console.error('❌ Error with local database:', error.message);
  }
  console.log('');

  // 6. Check sync status
  console.log('6. Checking sync status...');
  const syncHandler = window.commonPersistence.syncHandler;
  if (syncHandler) {
    console.log('✅ Sync handler exists');
    console.log('   Sync is:', syncHandler._state || 'unknown state');
  } else {
    console.error('❌ No sync handler - sync not started!');
    console.log('   Start sync with:');
    console.log('   const remoteUrl = window.syncConfigService.getCommonDbUrl();');
    console.log('   await window.commonPersistence.setupSync(remoteUrl, window.syncConfigService.credentials);');
  }
  console.log('');

  // 7. Test authentication
  console.log('7. Testing CouchDB authentication...');
  if (credentials) {
    try {
      const authHeader = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
      const response = await fetch('http://127.0.0.1:5984/bmpl_common', {
        headers: { 'Authorization': authHeader }
      });

      if (response.ok) {
        console.log('✅ Authentication successful');
      } else {
        console.error('❌ Authentication failed:', response.status);
        if (response.status === 401) {
          console.log('   Check username/password are correct');
        }
      }
    } catch (error) {
      console.error('❌ Auth test error:', error.message);
    }
  } else {
    console.log('⚠️  Skipped (no credentials set)');
  }
  console.log('');

  // 8. Compare document counts
  console.log('8. Comparing local vs remote document counts...');
  try {
    const localDocs = await window.commonPersistence.getAllLegalTypes();
    console.log('   Local PouchDB: ' + localDocs.length + ' legal types');

    if (credentials) {
      const authHeader = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
      const response = await fetch('http://127.0.0.1:5984/bmpl_common/_all_docs', {
        headers: { 'Authorization': authHeader }
      });

      if (response.ok) {
        const remoteDocs = await response.json();
        const remoteCount = remoteDocs.rows.filter(row => !row.id.startsWith('_design/')).length;
        console.log('   Remote CouchDB: ' + remoteCount + ' documents');

        if (localDocs.length > remoteCount) {
          console.error('❌ Local has more documents - not syncing to remote!');
        } else if (localDocs.length < remoteCount) {
          console.log('⚠️  Remote has more documents - may still be syncing down');
        } else {
          console.log('✅ Document counts match');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error comparing counts:', error.message);
  }
  console.log('');

  // 9. Check for sync errors
  console.log('9. Checking for recent errors...');
  // Set up error listener
  window.eventBus.on('common:sync:error', (error) => {
    console.error('🔴 SYNC ERROR:', error);
  });
  console.log('   Error listener attached (will show future errors)');
  console.log('');

  // 10. Summary and recommendations
  console.log('='.repeat(60));
  console.log('SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(60));

  const issues = [];

  if (!services.syncConfigService) issues.push('Services not available');
  if (!credentials) issues.push('Credentials not set');
  if (!syncHandler) issues.push('Sync not started');

  if (issues.length === 0) {
    console.log('✅ No major issues detected');
    console.log('');
    console.log('To force a sync, run:');
    console.log('  await window.commonPersistence.forceSync(');
    console.log('    window.syncConfigService.getCommonDbUrl(),');
    console.log('    window.syncConfigService.credentials');
    console.log('  );');
  } else {
    console.log('❌ Issues found:');
    issues.forEach(issue => console.log('   - ' + issue));
    console.log('');
    console.log('Fix these issues first, then run sync setup.');
  }

  console.log('='.repeat(60));
}

// Auto-run if loaded
if (typeof window !== 'undefined') {
  console.log('Diagnostic script loaded. Run: diagnoseCouchDBSync()');
}

// Export for use
if (typeof window !== 'undefined') {
  window.diagnoseCouchDBSync = diagnoseCouchDBSync;
}
