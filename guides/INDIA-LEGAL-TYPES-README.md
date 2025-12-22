# Populating India Legal Types in CouchDB

This guide explains how to populate the `bmpl_common` database with 13 comprehensive Indian organization legal types.

---

## India Legal Types Included

1. **Pvt. Ltd.** - Private Limited Company
2. **Ltd.** - Public Limited Company
3. **LLP** - Limited Liability Partnership
4. **OPC** - One Person Company
5. **Partnership** - Partnership Firm
6. **Sole Proprietorship** - Sole Proprietorship
7. **Section 8 Company** - Section 8 Company (Nonprofit)
8. **HUF** - Hindu Undivided Family
9. **Trust** - Private Trust
10. **Society** - Registered Society
11. **Producer Company** - Producer Company
12. **Cooperative Society** - Cooperative Society
13. **Other** - Other business structures

---

## Method 1: Using cURL Script (Recommended - Easy)

### Windows:

1. **Edit the credentials** in `seed-india-legal-types-curl.bat`:
   ```batch
   SET COUCH_URL=http://YOUR_USERNAME:YOUR_PASSWORD@127.0.0.1:5984
   ```

2. **Run the script:**
   ```cmd
   seed-india-legal-types-curl.bat
   ```

### Linux/Mac:

1. **Find your CouchDB credentials** (usually in Fauxton or CouchDB config)

2. **Run individual cURL commands** (replace `admin:password` with your credentials):
   ```bash
   # Create database
   curl -X PUT "http://admin:password@127.0.0.1:5984/bmpl_common"

   # Create Pvt. Ltd.
   curl -X PUT "http://admin:password@127.0.0.1:5984/bmpl_common/organization_legal_type:in:pvt-ltd" \
     -H "Content-Type: application/json" \
     -d @india-legal-types-single/pvt-ltd.json

   # ... (repeat for each legal type)
   ```

---

## Method 2: Using Fauxton UI (Easiest - Manual)

1. **Open Fauxton:** http://127.0.0.1:5984/_utils

2. **Login** with your CouchDB credentials

3. **Create database** (if doesn't exist):
   - Click "Create Database"
   - Name: `bmpl_common`
   - Click "Create"

4. **Import bulk data:**
   - Go to `bmpl_common` database
   - Click "⚙" (settings) → "Upload"
   - Select `india-legal-types.json`
   - Click "Upload"

   OR **Create manually:**
   - Click "+ New Document"
   - Copy/paste JSON from `india-legal-types.json` (one at a time)
   - Click "Create Document"

---

## Method 3: Using Node.js Script

**Prerequisites:**
- Node.js installed
- CouchDB running
- Correct credentials in `api/.env`

### Steps:

1. **Update credentials** in `api/.env`:
   ```env
   COUCHDB_URL=http://YOUR_USERNAME:YOUR_PASSWORD@127.0.0.1:5984
   ```

2. **Run script:**
   ```bash
   # Windows
   seed-india-legal-types.bat

   # Linux/Mac
   bash seed-india-legal-types.sh

   # Or directly
   node scripts/seed-india-legal-types.js
   ```

3. **Options:**
   ```bash
   # Overwrite existing records
   node scripts/seed-india-legal-types.js --force

   # Use API endpoint instead of direct CouchDB
   node scripts/seed-india-legal-types.js --api
   ```

---

## Method 4: Using Bulk Import API

If you have the Moleculer API running:

```bash
# Windows PowerShell
$body = Get-Content india-legal-types.json | ConvertFrom-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/common/legal-types/bulk" -Method POST -Body ($body | ConvertTo-Json) -ContentType "application/json"

# Linux/Mac
curl -X POST http://localhost:3000/api/common/legal-types/bulk \
  -H "Content-Type: application/json" \
  -d @india-legal-types.json
```

---

## Method 5: Using PouchDB (Client-Side)

In your browser console (when app is running):

```javascript
// Load from seed data service
await window.seedDataService.seedLegalTypes();

// Check stats
const stats = await window.seedDataService.getSeedDataStats();
console.log('Stats:', stats);

// Verify India legal types
const indiaTypes = await window.commonPersistence.getLegalTypesByCountry('IN');
console.log('India legal types:', indiaTypes.length);
```

---

## Verification

After populating, verify the data:

### Option 1: Fauxton UI
1. Open http://127.0.0.1:5984/_utils
2. Go to `bmpl_common` database
3. Filter by type: `organization_legal_type`
4. Filter by country: `IN`
5. Should see 13 documents

### Option 2: cURL
```bash
curl "http://admin:password@127.0.0.1:5984/bmpl_common/_find" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": {
      "type": "organization_legal_type",
      "country_iso_code": "IN"
    }
  }'
```

### Option 3: API (if running)
```bash
curl "http://localhost:3000/api/common/legal-types?country=IN"
```

### Option 4: Browser Console
```javascript
const types = await window.commonPersistence.getLegalTypesByCountry('IN');
console.log(`Found ${types.length} India legal types`);
types.forEach(t => console.log(`- ${t.legal_type} (${t.full_name})`));
```

---

## Troubleshooting

### Issue: "unauthorized" error

**Solution:** Check your CouchDB credentials

1. **Find admin credentials:**
   - Open http://127.0.0.1:5984/_utils
   - Look for saved credentials in browser
   - Or check CouchDB config: `local.ini` or `default.ini`

2. **Create admin user** (if not exists):
   ```bash
   curl -X PUT http://127.0.0.1:5984/_node/_local/_config/admins/admin \
     -d '"password"'
   ```

3. **Update all scripts** with correct credentials

### Issue: Database doesn't exist

**Solution:** Create database first

```bash
curl -X PUT "http://admin:password@127.0.0.1:5984/bmpl_common"
```

Or via Fauxton:
1. Go to http://127.0.0.1:5984/_utils
2. Click "Create Database"
3. Enter `bmpl_common`

### Issue: Script can't find modules

**Solution:** Install dependencies

```bash
cd api
npm install
```

### Issue: Port 5984 not accessible

**Solution:** Start CouchDB

```bash
# Windows
net start couchdb

# Mac
brew services start couchdb

# Linux
sudo systemctl start couchdb
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `india-legal-types.json` | Bulk import JSON (all 13 legal types) |
| `seed-india-legal-types-curl.bat` | Windows cURL script |
| `seed-india-legal-types.bat` | Windows Node.js wrapper script |
| `seed-india-legal-types.sh` | Linux/Mac wrapper script |
| `scripts/seed-india-legal-types.js` | Node.js seeding script |
| `src/js/data/legal-types-seed.js` | Seed data source (all countries) |

---

## Next Steps

After populating:

1. **Test in application:**
   - Open organization create/edit form
   - Select "India" as country
   - Should see all 13 legal types in dropdown

2. **Verify via API:**
   ```bash
   curl "http://localhost:3000/api/common/legal-types?country=IN"
   ```

3. **Check sync** (if using PouchDB sync):
   ```javascript
   const stats = await window.seedDataService.getSeedDataStats();
   console.log('Total legal types:', stats.total);
   console.log('India:', stats.byCountry.IN);
   ```

---

## Support

If you encounter issues:

1. Check CouchDB is running: `curl http://127.0.0.1:5984/`
2. Verify credentials work: `curl http://admin:password@127.0.0.1:5984/_all_dbs`
3. Check database exists: `curl http://admin:password@127.0.0.1:5984/bmpl_common`
4. Review error messages in console/terminal
5. Check CouchDB logs

---

## Summary

**Easiest Method:** Use Fauxton UI to manually import `india-legal-types.json`

**Fastest Method:** Run `seed-india-legal-types-curl.bat` (Windows) with correct credentials

**Most Flexible:** Use Node.js script with `--force` and `--api` options

Choose the method that best fits your setup and preferences!
