# PouchDB ↔ CouchDB Sync Setup

Complete guide to sync your PouchDB databases with CouchDB for real-time data synchronization.

## 🚀 Quick Start (Windows)

### Method 1: Automated Setup (Recommended)

```bash
# Run the setup script
setup-couchdb-sync.bat
```

This script will:
- ✅ Check CouchDB is running
- ✅ Enable CORS
- ✅ Create databases (bmpl_common, bmpl_users, bmpl_organizations)
- ✅ Configure security
- ✅ Deploy design documents
- ✅ Create test user

### Method 2: Manual Setup

Follow the steps below if you prefer manual setup or need to troubleshoot.

---

## 📋 Prerequisites

1. **CouchDB Installed and Running**
   ```bash
   # Check if running
   curl http://127.0.0.1:5984/

   # Should return: {"couchdb":"Welcome","version":"3.x.x",...}
   ```

   Install CouchDB:
   - Windows: https://couchdb.apache.org/ or `choco install couchdb`
   - Mac: `brew install couchdb && brew services start couchdb`
   - Linux: `sudo apt-get install couchdb`

2. **Admin Account Configured**
   - Default: username=`admin`, password=`password`
   - Access Fauxton: http://127.0.0.1:5984/_utils

---

## 🔧 Manual Setup Steps

### Step 1: Enable CORS

Required for browser-based apps to access CouchDB:

```bash
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/httpd/enable_cors -d '"true"'

curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/origins -d '"*"'

curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/credentials -d '"true"'

curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'

curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer"'
```

### Step 2: Create Databases

```bash
# Create common database
curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_common

# Create user database
curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_users

# Create organizations database
curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_organizations
```

### Step 3: Configure Security

```bash
# Set security for bmpl_common
curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_common/_security \
  -H "Content-Type: application/json" \
  -d @couchdb_design_documents/common_security.json
```

### Step 4: Deploy Design Documents

```bash
# Deploy common database design doc
curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_common/_design/common \
  -H "Content-Type: application/json" \
  -d @couchdb_design_documents/common_design_doc.json
```

### Step 5: Create Test User

```bash
curl -X PUT http://admin:password@127.0.0.1:5984/_users/org.couchdb.user:testuser \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "org.couchdb.user:testuser",
    "name": "testuser",
    "type": "user",
    "roles": ["authenticated_user"],
    "password": "testpassword"
  }'
```

---

## 💻 App Configuration

### Start Development Server

```bash
npm run dev
```

The app opens at http://localhost:5173

### Configure Sync in Browser Console

Open browser console (F12) and run:

```javascript
// 1. Set CouchDB credentials
window.syncConfigService.setCredentials({
  username: 'testuser',
  password: 'testpassword'
});

// 2. Initialize common database sync
const remoteUrl = window.syncConfigService.getCommonDbUrl();
await window.commonPersistence.setupSync(remoteUrl, window.syncConfigService.credentials);

console.log('✅ Sync started!');
```

### Verify Sync is Working

```javascript
// Check database info
const info = await window.commonPersistence.getDatabaseInfo();
console.log('Database info:', info);

// Get all legal types
const legalTypes = await window.commonPersistence.getAllLegalTypes();
console.log(`Found ${legalTypes.length} legal types`);
```

---

## 🧪 Testing Sync

### Test 1: Create Data Locally (Local → Remote)

```javascript
// Create a custom legal type
const newType = await window.commonPersistence.createLegalType({
  legal_type: 'Test Company',
  country_iso_code: 'US',
  country_name: 'United States',
  abbreviation: 'Test',
  full_name: 'Test Company Type',
  description: 'Test legal type',
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

console.log('Created:', newType);

// Check in CouchDB Fauxton (should appear within seconds):
// http://127.0.0.1:5984/_utils/#database/bmpl_common/_all_docs
```

### Test 2: Edit Data Remotely (Remote → Local)

1. Open Fauxton: http://127.0.0.1:5984/_utils/#database/bmpl_common/_all_docs
2. Click on a document
3. Edit a field (e.g., change `description`)
4. Click "Save Document"
5. Check in browser console:

```javascript
// Should see the updated value
const updated = await window.commonPersistence.getCommonDataById('organization_legal_type:us:test-company');
console.log('Updated document:', updated);
```

### Test 3: Monitor Sync Events

```javascript
// Listen for sync events
window.eventBus.on('common:sync:started', () => {
  console.log('🔄 Sync started');
});

window.eventBus.on('common:sync:completed', (info) => {
  console.log('✅ Sync completed:', info);
});

window.eventBus.on('common:sync:error', (error) => {
  console.error('❌ Sync error:', error);
});
```

---

## 🔍 Verification Checklist

- [ ] CouchDB is running at http://127.0.0.1:5984
- [ ] CORS is enabled
- [ ] Database `bmpl_common` exists
- [ ] Security document is configured
- [ ] Design document is deployed
- [ ] Test user exists with `authenticated_user` role
- [ ] Vite dev server proxy is working (check vite.config.js)
- [ ] Sync credentials are set in app
- [ ] Sync is active (check console for sync events)
- [ ] Data syncs bidirectionally

---

## 🔒 Security & Permissions

### Permission Model

**Read Access:**
- ✅ All authenticated users can read all documents

**Write Access:**
- ✅ Users can create new documents (with their username as `createdBy`)
- ✅ Users can edit/delete only their own documents
- ❌ Users cannot edit documents created by others
- ❌ Users cannot edit system seed data (createdBy='system')
- ✅ Admins can do anything

### Test Permissions

```javascript
// Try to edit someone else's document (should fail on sync)
const systemDoc = await window.commonPersistence.getCommonDataById('organization_legal_type:us:llc');
console.log('Created by:', systemDoc.createdBy); // 'system'

// This will fail during sync to CouchDB
try {
  await window.commonPersistence.updateLegalType('organization_legal_type:us:llc', {
    description: 'Trying to edit system record'
  });
} catch (error) {
  console.log('Expected error:', error);
}
```

---

## 🐛 Troubleshooting

### Sync Not Starting

```javascript
// Check connection
console.log('Connected:', window.syncConfigService.isConnected);

// Check credentials
const creds = await window.storageService.get('couchdb_credentials');
console.log('Credentials:', creds);

// Test CouchDB directly
const response = await fetch('http://127.0.0.1:5984/');
const info = await response.json();
console.log('CouchDB info:', info);
```

### CORS Errors

Ensure CORS is properly configured:

```bash
# Check CORS settings
curl http://admin:password@127.0.0.1:5984/_node/_local/_config/cors
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

  console.log('Auth test:', response.ok ? '✅ Success' : '❌ Failed');
};

await testAuth();
```

### View Sync Conflicts

```javascript
// Check for conflicts
const result = await window.commonPersistence.db.allDocs({
  conflicts: true,
  include_docs: true
});

const conflicts = result.rows.filter(row =>
  row.doc._conflicts && row.doc._conflicts.length > 0
);

console.log('Conflicts:', conflicts);
```

### Clear and Re-sync

```javascript
// Stop sync
window.commonPersistence.cancelSync();

// Clear local database
await window.commonPersistence.db.destroy();

// Re-initialize
await window.commonPersistence.ensureInitialized();

// Re-sync
await window.commonPersistence.setupSync(remoteUrl, credentials);
```

---

## 📊 Monitoring Sync

### Check Sync Status

```javascript
// Get database info
const info = await window.commonPersistence.getDatabaseInfo();
console.log('Docs:', info.doc_count);
console.log('Update seq:', info.update_seq);

// Get stats
const stats = await window.seedDataService.getSeedDataStats();
console.log('Legal types:', stats);
```

### View CouchDB Logs

```bash
# Windows (if installed via installer)
type "C:\Program Files\Apache CouchDB\var\log\couchdb.log"

# Mac/Linux
tail -f /usr/local/var/log/couchdb/couchdb.log
```

---

## 🌐 Production Setup

For production deployment:

1. **Use HTTPS/SSL**
   ```javascript
   COUCHDB_CONFIG.DIRECT_URL = 'https://your-couchdb.example.com';
   ```

2. **Configure Authentication via Backend**
   - Implement `/couchdb-session` endpoint
   - Exchange JWT for CouchDB credentials
   - Return time-limited credentials

3. **Set Proper User Roles**
   - Create organization-specific roles
   - Scope permissions per organization
   - Implement role-based access control

4. **Use Environment Variables**
   ```bash
   VITE_COUCHDB_URL=https://your-couchdb.example.com
   VITE_COUCHDB_USE_SSL=true
   ```

5. **Monitor Performance**
   - Track sync latency
   - Monitor conflict rates
   - Set up alerts for sync errors

6. **Implement Conflict Resolution**
   - Define conflict resolution strategy
   - Handle conflicts in app logic
   - Log conflicts for review

---

## 📚 Additional Resources

- **CouchDB Docs**: https://docs.couchdb.org/
- **PouchDB Docs**: https://pouchdb.com/guides/
- **Fauxton UI**: http://127.0.0.1:5984/_utils
- **Sync Guide**: sync-setup-guide.md (detailed testing guide)

---

## ✅ Summary

You now have:
- ✅ CouchDB running and configured
- ✅ Common database with security and validation
- ✅ Bidirectional sync between PouchDB and CouchDB
- ✅ 40 legal types across 4 countries (US, Canada, UK, India)
- ✅ Real-time data synchronization
- ✅ Permission-based access control

Your organization create/edit forms will now dynamically load legal types from the synchronized database! 🎉
