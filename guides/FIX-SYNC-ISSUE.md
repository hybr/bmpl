# Fix: PouchDB Not Syncing to CouchDB

## 🔍 Problem Diagnosis

The data is in PouchDB locally but not syncing to CouchDB. This usually happens because:

1. ❌ Sync was never started
2. ❌ CouchDB credentials not set
3. ❌ CouchDB not accessible at init time
4. ❌ `syncConfigService.isConnected` is false

## ✅ Quick Fix (Browser Console)

### Step 1: Load Diagnostic Script

Copy and paste this entire script into browser console:

```javascript
// Load diagnostic script from file
const script = document.createElement('script');
script.src = '/diagnose-sync.js';
document.head.appendChild(script);
```

Wait 1 second, then run:

```javascript
await diagnoseCouchDBSync();
```

This will show you exactly what's wrong.

### Step 2: Manual Sync Setup

If sync isn't running, manually start it:

```javascript
// 1. Set credentials (IMPORTANT!)
window.syncConfigService.setCredentials({
  username: 'testuser',
  password: 'testpassword'
});

// 2. Ensure CouchDB database exists
try {
  await window.syncConfigService.ensureCommonDatabase();
  console.log('✅ CouchDB database ensured');
} catch (error) {
  console.error('❌ Error ensuring database:', error);
  console.log('Run the setup script first: setup-couchdb-sync.bat');
}

// 3. Start sync
const remoteUrl = window.syncConfigService.getCommonDbUrl();
console.log('Remote URL:', remoteUrl);

await window.commonPersistence.setupSync(remoteUrl, window.syncConfigService.credentials);
console.log('✅ Sync started!');

// 4. Monitor sync
window.eventBus.on('common:sync:completed', (info) => {
  console.log('✅ Sync event:', info);
});

window.eventBus.on('common:sync:error', (error) => {
  console.error('❌ Sync error:', error);
});
```

### Step 3: Force Immediate Sync

If you need to force sync right now:

```javascript
// Force a one-time sync
const result = await window.commonPersistence.forceSync(
  window.syncConfigService.getCommonDbUrl(),
  window.syncConfigService.credentials
);

console.log('Force sync result:', result);
```

### Step 4: Verify Sync Worked

```javascript
// Check CouchDB has the data
const authHeader = 'Basic ' + btoa('testuser:testpassword');
const response = await fetch('http://127.0.0.1:5984/bmpl_common/_all_docs?include_docs=true', {
  headers: { 'Authorization': authHeader }
});

const data = await response.json();
const legalTypes = data.rows.filter(row => row.id.startsWith('organization_legal_type'));

console.log(`✅ CouchDB has ${legalTypes.length} legal types`);
console.log('Sample:', legalTypes[0]?.doc);
```

## 🔧 Permanent Fix

### Option 1: Update App Initialization (Recommended)

The issue is that sync only starts if `isConnected` is true at app init. We need to make sync more resilient.

Edit `src/js/app.js` and update `initializeCommonDatabase`:

```javascript
async initializeCommonDatabase() {
  try {
    console.log('Initializing common database...');

    // Initialize common database
    await commonPersistence.ensureInitialized();
    console.log('Common database initialized');

    // Check if seed data exists
    const hasSeedData = await seedDataService.hasSeedData();

    if (!hasSeedData) {
      console.log('Seeding common database with legal types...');
      const results = await seedDataService.seedLegalTypes();
      console.log('Seed data results:', results);

      if (results.created > 0) {
        console.log(`Successfully seeded ${results.created} legal types`);
      }
      if (results.errors.length > 0) {
        console.warn('Some seed data failed to create:', results.errors);
      }
    } else {
      console.log('Common database already has seed data');
    }

    // ⚠️ CHANGED: Always attempt sync if credentials exist, regardless of isConnected
    if (syncConfigService.credentials || navigator.onLine) {
      try {
        const commonDbUrl = syncConfigService.getCommonDbUrl();

        // If no credentials yet, log a warning but still try
        if (!syncConfigService.credentials) {
          console.warn('No CouchDB credentials set - sync will not work until credentials are provided');
          console.log('Set credentials with: syncConfigService.setCredentials({username: "user", password: "pass"})');
        } else {
          await commonPersistence.setupSync(commonDbUrl, syncConfigService.credentials);
          console.log('✅ Common database sync started');
        }
      } catch (error) {
        console.warn('Could not start common database sync:', error.message);
        console.log('App will continue in offline mode');
      }
    } else {
      console.log('Common database running in offline mode');
    }

    // Get stats in debug mode
    if (ENV.DEBUG) {
      const stats = await seedDataService.getSeedDataStats();
      console.log('Common database stats:', stats);
    }

  } catch (error) {
    console.error('Error initializing common database:', error);
    // Non-critical error - app can continue with fallback values
  }
}
```

### Option 2: Create a Manual Sync Button

Add a button to your UI to manually trigger sync:

```javascript
// In your settings page or admin panel
async function startCommonDatabaseSync() {
  try {
    // Ensure credentials are set
    if (!window.syncConfigService.credentials) {
      alert('Please set CouchDB credentials first');
      return;
    }

    // Start sync
    const remoteUrl = window.syncConfigService.getCommonDbUrl();
    await window.commonPersistence.setupSync(remoteUrl, window.syncConfigService.credentials);

    alert('✅ Sync started successfully!');
  } catch (error) {
    console.error('Sync error:', error);
    alert('❌ Sync failed: ' + error.message);
  }
}
```

## 🧪 Test the Fix

After applying the fix:

1. **Reload the app**
   ```bash
   # Refresh browser (Ctrl+F5)
   ```

2. **Check console logs**
   Look for:
   - `✅ Common database sync started`
   - Sync event logs

3. **Verify in CouchDB**
   - Open: http://127.0.0.1:5984/_utils/#database/bmpl_common/_all_docs
   - Should see 40+ documents

4. **Test bidirectional sync**
   ```javascript
   // Create locally
   const test = await window.commonPersistence.createLegalType({
     legal_type: 'Sync Test',
     country_iso_code: 'IN',
     country_name: 'India',
     abbreviation: 'Test',
     full_name: 'Sync Test Company',
     description: 'Testing sync after fix',
     liability: 'limited',
     tax_type: 'corporate',
     tax_rate_info: 'Test',
     min_members: 1,
     registration_required: true,
     annual_filing_required: true,
     audit_required: false,
     is_active: true,
     is_seed_data: false,
     createdBy: 'testuser'
   });

   // Wait 2 seconds
   await new Promise(r => setTimeout(r, 2000));

   // Check in CouchDB - should be there!
   ```

## 🚨 Common Issues & Solutions

### Issue 1: "401 Unauthorized"

**Cause**: Wrong credentials or credentials not set

**Fix**:
```javascript
window.syncConfigService.setCredentials({
  username: 'testuser',
  password: 'testpassword'
});
```

### Issue 2: "404 Not Found" (Database)

**Cause**: CouchDB database doesn't exist

**Fix**:
```bash
# Run setup script
setup-couchdb-sync.bat

# Or manually
curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_common
```

### Issue 3: "CORS Error"

**Cause**: CORS not enabled on CouchDB

**Fix**:
```bash
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/origins -d '"*"'
```

### Issue 4: Sync Handler Null

**Cause**: Sync never started

**Fix**: Run the manual sync setup from Step 2 above

### Issue 5: "Cannot connect to CouchDB"

**Cause**: CouchDB not running

**Fix**:
```bash
# Check if running
curl http://127.0.0.1:5984/

# If not, start CouchDB service
# Windows: Start "Apache CouchDB" service
# Mac: brew services start couchdb
# Linux: sudo systemctl start couchdb
```

## 📊 Monitoring Sync

Keep an eye on sync with these console commands:

```javascript
// Check sync status every 5 seconds
setInterval(async () => {
  const local = await window.commonPersistence.getDatabaseInfo();
  console.log(`Local docs: ${local.doc_count}, seq: ${local.update_seq}`);
}, 5000);

// Log all sync events
['started', 'completed', 'error'].forEach(event => {
  window.eventBus.on(`common:sync:${event}`, (data) => {
    console.log(`🔄 Sync ${event}:`, data);
  });
});
```

## ✅ Checklist

Before you say sync is working:

- [ ] CouchDB is running
- [ ] Database `bmpl_common` exists in CouchDB
- [ ] Credentials are set in app
- [ ] Sync handler exists (`window.commonPersistence.syncHandler`)
- [ ] No errors in console
- [ ] Data appears in CouchDB Fauxton
- [ ] Changes in CouchDB appear in app
- [ ] Changes in app appear in CouchDB

## 🆘 Still Not Working?

Run the full diagnostic:

```javascript
await diagnoseCouchDBSync();
```

This will give you a detailed report of what's wrong and how to fix it.
