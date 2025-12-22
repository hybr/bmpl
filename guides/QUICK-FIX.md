# Quick Fix for API Connection Errors

## ✅ Issues Already Fixed

1. **API Port** - Changed from 3001 → 3000 ✅
2. **Environment Config** - Created `.env` file ✅

## ⚠️ Action Required: CouchDB Credentials

Your CouchDB requires authentication but the credentials in `api/.env` are incorrect.

---

## Option 1: Find Existing Credentials (Recommended)

### Try Fauxton Login:

1. **Open Fauxton:** http://127.0.0.1:5984/_utils
2. **Try logging in** with username/password
3. **If successful**, use those same credentials in `api/.env`

### Update `api/.env`:

Edit line 8 in `api/.env` with your actual credentials:

```env
COUCHDB_URL=http://YOUR_USERNAME:YOUR_PASSWORD@127.0.0.1:5984
```

### Restart API:

```bash
cd api
npm start
```

---

## Option 2: Access Fauxton Without Password

If Fauxton opens without asking for password:

1. Click on the **⚙ Config** menu in Fauxton
2. Look for `admins` section
3. Click **Add Option**
   - Section: `admins`
   - Name: `admin`
   - Value: `password`
4. Click **Create**

Then update `api/.env`:
```env
COUCHDB_URL=http://admin:password@127.0.0.1:5984
```

---

## Option 3: Use App in Local Mode (Temporary)

The app is already working in **fallback mode** using local PouchDB:

✅ **Currently Working:**
- 21 legal types loaded locally (US, CA, GB, some India)
- Organization create/edit forms
- All UI functionality
- Data persists locally

❌ **Not Working:**
- API sync
- Multi-user/organization features
- Real-time updates

**To continue in this mode:** Just refresh your browser - the app will work with local data.

---

## Option 4: Reset CouchDB (Advanced)

**⚠️ Warning: This will delete all CouchDB data!**

### Windows:

1. Stop CouchDB service
2. Delete data directory: `C:\Program Files\Apache CouchDB\data`
3. Restart CouchDB
4. Open Fauxton: http://127.0.0.1:5984/_utils
5. Setup wizard will create admin credentials

### Linux/Mac:

```bash
# Stop CouchDB
sudo systemctl stop couchdb  # or: brew services stop couchdb

# Delete data
sudo rm -rf /usr/local/var/lib/couchdb/*

# Restart
sudo systemctl start couchdb  # or: brew services start couchdb
```

---

## How to Know Which Option to Use

**Use Option 1** if you remember setting up CouchDB with credentials

**Use Option 2** if you can access Fauxton without login

**Use Option 3** if you just want the app to work now and fix CouchDB later

**Use Option 4** only if you don't have important data in CouchDB

---

## After Fixing

Once credentials are correct:

1. Refresh browser (F5)
2. Check console - should see:
   - ✅ No `ERR_CONNECTION_REFUSED`
   - ✅ `Legal types loaded from API`
3. Test creating an organization

---

## Summary

**What's Working:**
- ✅ Frontend app loads
- ✅ Local database works
- ✅ 21 legal types available
- ✅ Create/edit organizations

**What Needs Fixing:**
- ❌ CouchDB authentication
- ❌ API connection to CouchDB

**Next Step:** Choose an option above and update `api/.env` with correct credentials, then restart the API.
