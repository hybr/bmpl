# Manual CouchDB Sync Setup Guide

## For Testing Without Backend

If you want to test CouchDB sync without a backend auth server, follow these steps:

### 1. Open Browser Console

Start your dev server and open the app in browser:
```bash
npm run dev
```

Then open browser console (F12).

### 2. Manually Set CouchDB Credentials

```javascript
// In browser console, set credentials manually
const credentials = {
  username: 'testuser',
  password: 'testpassword'
};

// Save to sync config service
window.syncConfigService.setCredentials(credentials);

// Or save to storage
await window.storageService.set('couchdb_credentials', credentials);
```

### 3. Initialize Common Database Sync

```javascript
// Initialize common database
await window.commonPersistence.ensureInitialized();

// Get remote URL
const remoteUrl = window.syncConfigService.getCommonDbUrl();
console.log('Remote URL:', remoteUrl);

// Setup sync with credentials
const credentials = {
  username: 'testuser',
  password: 'testpassword'
};

await window.commonPersistence.setupSync(remoteUrl, credentials);

console.log('Common database sync started!');
```

### 4. Seed the Common Database

```javascript
// Check if seed data exists
const hasSeed = await window.seedDataService.hasSeedData();
console.log('Has seed data:', hasSeed);

// If not, seed it
if (!hasSeed) {
  const results = await window.seedDataService.seedLegalTypes();
  console.log('Seed results:', results);
}
```

### 5. Verify Sync is Working

```javascript
// Check sync status
const info = await window.commonPersistence.getDatabaseInfo();
console.log('Database info:', info);

// Get all legal types (should sync from/to CouchDB)
const legalTypes = await window.commonPersistence.getAllLegalTypes();
console.log(`Found ${legalTypes.length} legal types`);

// Check in CouchDB directly
// Open: http://127.0.0.1:5984/_utils/#database/bmpl_common/_all_docs
```

### 6. Monitor Sync Events

```javascript
// Listen for sync events
window.eventBus.on('common:sync:started', () => {
  console.log('✅ Common DB sync started');
});

window.eventBus.on('common:sync:completed', (info) => {
  console.log('✅ Common DB sync completed:', info);
});

window.eventBus.on('common:sync:error', (error) => {
  console.error('❌ Common DB sync error:', error);
});
```

## Testing the Sync

### Test 1: Create a Legal Type (Local → Remote)

```javascript
// Create a custom legal type
const customLegalType = await window.commonPersistence.createLegalType({
  legal_type: 'Test Company',
  country_iso_code: 'US',
  country_name: 'United States',
  abbreviation: 'Test',
  full_name: 'Test Company Type',
  description: 'Test legal type for sync testing',
  liability: 'limited',
  tax_type: 'corporate',
  tax_rate_info: 'Test tax info',
  min_members: 1,
  registration_required: true,
  annual_filing_required: true,
  audit_required: false,
  is_active: true,
  is_seed_data: false,
  createdBy: 'testuser'
});

console.log('Created legal type:', customLegalType);

// Check in CouchDB (should appear within seconds)
// http://127.0.0.1:5984/_utils/#database/bmpl_common/_all_docs
```

### Test 2: Edit in CouchDB (Remote → Local)

1. Open Fauxton: http://127.0.0.1:5984/_utils/#database/bmpl_common/_all_docs
2. Click on a document (e.g., `organization_legal_type:us:test-company`)
3. Edit a field (e.g., change `description`)
4. Click "Save Document"
5. Check in browser console:

```javascript
// Should see the updated value
const legalType = await window.commonPersistence.getCommonDataById('organization_legal_type:us:test-company');
console.log('Updated legal type:', legalType);
```

### Test 3: Test Permissions

```javascript
// Try to edit a system seed record (should fail in CouchDB validation)
const systemRecord = await window.commonPersistence.getCommonDataById('organization_legal_type:us:llc');
console.log('System record createdBy:', systemRecord.createdBy); // Should be 'system'

// This will succeed locally but fail when syncing to CouchDB
// because validation function prevents non-creators from editing
try {
  await window.commonPersistence.updateLegalType('organization_legal_type:us:llc', {
    description: 'Trying to edit system record'
  });
} catch (error) {
  console.log('Expected error:', error);
}
```

## Troubleshooting

### Sync Not Starting

```javascript
// Check connection
const isConnected = window.syncConfigService.isConnected;
console.log('CouchDB connected:', isConnected);

// Check credentials
const creds = await window.storageService.get('couchdb_credentials');
console.log('Credentials:', creds);

// Test CouchDB directly
const response = await fetch('http://127.0.0.1:5984/');
const info = await response.json();
console.log('CouchDB info:', info);
```

### CORS Errors

If you see CORS errors, ensure you ran the CORS setup commands:

```bash
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/origins -d '"*"'
```

### Authentication Errors

```javascript
// Test authentication
const testAuth = async () => {
  const response = await fetch('http://127.0.0.1:5984/bmpl_common', {
    headers: {
      'Authorization': 'Basic ' + btoa('testuser:testpassword')
    }
  });

  if (response.ok) {
    console.log('✅ Authentication works!');
  } else {
    console.error('❌ Authentication failed:', response.status);
  }
};

await testAuth();
```

### View Sync Conflicts

```javascript
// Check for conflicts
const conflicts = await window.commonPersistence.db.allDocs({
  conflicts: true,
  include_docs: true
});

const docsWithConflicts = conflicts.rows.filter(row =>
  row.doc._conflicts && row.doc._conflicts.length > 0
);

console.log('Documents with conflicts:', docsWithConflicts);
```

## Production Setup

For production, you should:

1. Use SSL/TLS (https://) for CouchDB
2. Configure proper authentication via your backend
3. Set up proper user roles and permissions
4. Use environment variables for CouchDB URL
5. Implement conflict resolution strategies
6. Monitor sync performance and errors

See the main implementation plan for details.
