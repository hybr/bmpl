# Fix API Connection Issues

## Issues Fixed

### 1. ✅ API Port Mismatch (FIXED)
- **Problem:** App was trying to connect to `http://localhost:3001` but API runs on port `3000`
- **Fix:** Updated `src/js/config/env.js` line 9 to use port 3000
- **Status:** ✅ Complete

### 2. ✅ Environment Configuration (FIXED)
- **Problem:** Missing root `.env` file for Vite
- **Fix:** Created `.env` file with correct API URL
- **Status:** ✅ Complete

### 3. ⚠️ CouchDB Authentication (NEEDS ATTENTION)
- **Problem:** API can't authenticate with CouchDB
- **Error:** `Name or password is incorrect`
- **Fix:** Update CouchDB credentials in `api/.env`

---

## How to Find Your CouchDB Credentials

### Method 1: Check Fauxton (Easiest)

1. Open Fauxton: http://127.0.0.1:5984/_utils
2. If it asks for login, use those same credentials
3. Update `api/.env` with those credentials

### Method 2: Check CouchDB Config Files

**Windows:**
```cmd
type "C:\Program Files\Apache CouchDB\etc\local.ini"
```

**Linux/Mac:**
```bash
cat /usr/local/etc/couchdb/local.ini
# or
cat /opt/couchdb/etc/local.ini
```

Look for the `[admins]` section:
```ini
[admins]
admin = -hashed-password-here-
```

### Method 3: Create New Admin User

If you don't know the password, create a new admin:

```bash
# Create admin user with password
curl -X PUT http://localhost:5984/_node/_local/_config/admins/admin -d '"password"'

# Test it works
curl http://admin:password@localhost:5984/_all_dbs
```

---

## Steps to Fix

### Step 1: Find Your CouchDB Credentials

Use one of the methods above to find or create your CouchDB credentials.

### Step 2: Update API Configuration

Edit `api/.env` and update line 8:

```env
COUCHDB_URL=http://YOUR_USERNAME:YOUR_PASSWORD@127.0.0.1:5984
```

For example:
```env
COUCHDB_URL=http://admin:mypassword@127.0.0.1:5984
```

### Step 3: Restart the API

If the API is running, restart it:

```bash
# Stop the API (Ctrl+C if running)
# Then restart:
cd api
npm start
```

### Step 4: Refresh Your Web App

Refresh your browser (Ctrl+R or F5)

---

## Verification

### Test 1: API Health Check
```bash
curl http://localhost:3000/
# Should return: {"name":"NotFoundError",...} (this is OK - means API is running)
```

### Test 2: CouchDB Connection
```bash
# Replace admin:password with your credentials
curl http://admin:password@127.0.0.1:5984/_all_dbs
# Should return list of databases
```

### Test 3: Legal Types API
```bash
curl http://localhost:3000/api/common/legal-types?country=IN
# Should return: {"success":true,"data":[...]}
```

### Test 4: Check Browser Console

Refresh your app and check console. You should see:
- ✅ No more `ERR_CONNECTION_REFUSED` errors
- ✅ Legal types loaded from API (not fallback)
- ✅ User organizations loaded successfully

---

## Quick Fix Commands

### If you want to use default credentials (admin/password):

```bash
# 1. Set CouchDB admin password
curl -X PUT http://localhost:5984/_node/_local/_config/admins/admin -d '"password"'

# 2. Verify it works
curl http://admin:password@127.0.0.1:5984/_all_dbs

# 3. Restart API
cd api
npm start
```

### If CouchDB doesn't require authentication:

Edit `api/.env` line 8:
```env
COUCHDB_URL=http://127.0.0.1:5984
```

---

## Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Port | ✅ Fixed | Changed from 3001 to 3000 |
| .env Config | ✅ Created | Root .env with VITE variables |
| API Running | ✅ Yes | Responding on port 3000 |
| CouchDB Running | ✅ Yes | Responding on port 5984 |
| CouchDB Auth | ❌ Failed | Credentials don't match |
| API → CouchDB | ❌ Failed | Can't query legal types |

---

## After Fixing

Once you update the CouchDB credentials, you'll be able to:

✅ Load legal types from API (including India types)
✅ Search organizations via API
✅ Get user memberships from API
✅ Full API functionality

---

## Alternative: Use Mock Mode (Temporary)

If you can't fix CouchDB credentials right now, the app will continue to work in **fallback mode**:
- Uses local PouchDB cache
- Already has 21 legal types loaded
- Limited functionality but usable

However, you **should fix** the CouchDB credentials for full functionality.

---

## Need Help?

1. **Can't find credentials?**
   - Create new admin: `curl -X PUT http://localhost:5984/_node/_local/_config/admins/admin -d '"password"'`

2. **CouchDB not running?**
   - Windows: `net start couchdb`
   - Mac: `brew services start couchdb`
   - Linux: `sudo systemctl start couchdb`

3. **API not starting?**
   - Check `api/.env` exists
   - Run `cd api && npm install`
   - Run `cd api && npm start`

4. **Still getting errors?**
   - Check firewall isn't blocking ports 3000, 5984
   - Try accessing http://localhost:5984/_utils in browser
   - Check CouchDB logs for errors
