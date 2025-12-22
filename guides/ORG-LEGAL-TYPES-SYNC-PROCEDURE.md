# Organization Legal Types Sync Procedure
## PouchDB → Moleculer API → CouchDB in bmpl_common Database

This document explains how organization legal types are synchronized between the client (PouchDB) and the server (CouchDB) using the Moleculer API backend.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Web/Mobile Application                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PouchDB (Local Cache)                                     │ │
│  │  Database: bmpl_common                                     │ │
│  │  - Stores legal types locally for offline access          │ │
│  │  - Acts as fallback when API is unavailable               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ API Calls                         │
│                              ▼                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ HTTP Requests
                               │ /api/common/legal-types
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Moleculer API Backend (Node.js)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  common.service.js                                         │ │
│  │  - Handles /api/common/legal-types endpoints              │ │
│  │  - Queries CouchDB directly using nano library            │ │
│  │  - Returns data to client                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ Nano (CouchDB Client)             │
│                              ▼                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CouchDB Server                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Database: bmpl_common                                     │ │
│  │  - Central source of truth for legal types                │ │
│  │  - Stores all organization legal type documents           │ │
│  │  - Document ID format: organization_legal_type:us:llc     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Patterns

### Pattern 1: API-First (Primary)
This is the **recommended and default** approach used by the application.

```
Client Request
    ↓
Common Persistence Service
    ↓
API Client (Fetch)
    ↓
Moleculer API (/api/common/legal-types)
    ↓
common.service.js
    ↓
CouchDB (bmpl_common)
    ↓
Response to Client
```

### Pattern 2: Local Fallback (Offline/Error)
When the API is unavailable, the app falls back to local PouchDB.

```
Client Request
    ↓
Common Persistence Service
    ↓
API Client (Fetch) → ERROR
    ↓
Fallback to PouchDB (Local Cache)
    ↓
Response to Client
```

---

## Detailed Procedure

### 1. Client Queries Legal Types

**File:** `src/js/services/common-persistence.js`

When the client needs legal types (e.g., for organization create/edit forms):

```javascript
// Example: Get legal types for a country
const legalTypes = await commonPersistence.getLegalTypesByCountry('US');
```

**What Happens:**
1. `getLegalTypesByCountry()` method is called (line 306)
2. Method attempts to fetch from API first
3. If API fails, falls back to local PouchDB

---

### 2. API Request Flow

**File:** `src/js/services/common-persistence.js` (lines 306-318)

```javascript
async getLegalTypesByCountry(countryIsoCode) {
  try {
    // Try API first
    const response = await apiClient.get('/api/common/legal-types', {
      params: { country: countryIsoCode }
    });
    return response.data || [];
  } catch (error) {
    console.warn('API request failed, falling back to local cache:', error.message);
    // Fallback to local PouchDB
    return this.getLegalTypesByCountryLocal(countryIsoCode);
  }
}
```

**Steps:**
1. **API Client** sends GET request to `/api/common/legal-types?country=US`
2. Request goes through **Moleculer API Gateway**
3. Routed to **common.service.js**

---

### 3. Backend Processing (Moleculer API)

**File:** `api/services/common.service.js` (lines 28-102)

```javascript
getLegalTypes: {
  rest: "GET /legal-types",
  params: {
    country: { type: "string", optional: true },
    search: { type: "string", optional: true },
    limit: { type: "number", optional: true, default: 100, max: 1000 },
    activeOnly: { type: "boolean", optional: true, default: true }
  },
  async handler(ctx) {
    const { country, search, limit, activeOnly } = ctx.params;

    // Get database connection
    const db = this.getDatabase(); // nano connection to bmpl_common

    // Build query selector
    const selector = {
      type: 'organization_legal_type'
    };

    if (country) {
      selector.country_iso_code = country.toUpperCase();
    }

    if (activeOnly) {
      selector.is_active = { $ne: false };
    }

    // Query CouchDB
    const result = await db.find({
      selector,
      limit: 1000
    });

    // Apply search filter if provided
    // Sort and limit results
    // Return to client
  }
}
```

**Steps:**
1. Validate request parameters
2. Build CouchDB query selector
3. Execute query against **bmpl_common** database using **nano** library
4. Filter, sort, and limit results
5. Return JSON response to client

---

### 4. CouchDB Query Execution

**Database:** `bmpl_common`
**Document Type:** `organization_legal_type`

**Document Structure:**
```json
{
  "_id": "organization_legal_type:us:llc",
  "_rev": "1-abc123",
  "type": "organization_legal_type",
  "country_iso_code": "US",
  "country_name": "United States",
  "legal_type": "LLC",
  "full_name": "Limited Liability Company",
  "abbreviation": "LLC",
  "description": "A flexible business structure...",
  "liability": "limited",
  "tax_type": "pass-through",
  "is_active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**CouchDB Query Example:**
```json
{
  "selector": {
    "type": "organization_legal_type",
    "country_iso_code": "US",
    "is_active": { "$ne": false }
  },
  "limit": 1000
}
```

---

### 5. Response Path

**From CouchDB → Moleculer → Client:**

```javascript
// API Response Format
{
  "success": true,
  "data": [
    {
      "_id": "organization_legal_type:us:llc",
      "type": "organization_legal_type",
      "country_iso_code": "US",
      "legal_type": "LLC",
      // ... other fields
    }
    // ... more legal types
  ]
}
```

**Client Receives:**
```javascript
// In common-persistence.js
const response = await apiClient.get('/api/common/legal-types', {
  params: { country: 'US' }
});

return response.data || []; // Returns array of legal type objects
```

---

### 6. Local Fallback (Offline Mode)

**File:** `src/js/services/common-persistence.js` (lines 324-342)

When API fails, the client uses local PouchDB:

```javascript
async getLegalTypesByCountryLocal(countryIsoCode) {
  await this.ensureInitialized();

  try {
    const result = await this.db.find({
      selector: {
        type: COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE,
        country_iso_code: countryIsoCode.toUpperCase(),
        is_active: { $ne: false }
      },
      sort: [{ legal_type: 'asc' }]
    });

    return result.docs;
  } catch (error) {
    console.error('Error getting legal types from local DB:', error);
    return [];
  }
}
```

**Important Notes:**
- Local PouchDB may have **stale data** if not synced recently
- Local database is primarily a **cache** for offline scenarios
- Direct PouchDB sync is **disabled** in favor of API queries (see line 103)

---

## Creating New Legal Types

### Client-Side Creation

**File:** `src/js/services/common-persistence.js` (lines 285-300)

```javascript
// Create a new legal type
const newType = await commonPersistence.createLegalType({
  legal_type: 'S Corporation',
  country_iso_code: 'US',
  country_name: 'United States',
  abbreviation: 'S Corp',
  full_name: 'S Corporation',
  description: 'A corporation that elects to pass corporate income...',
  is_active: true,
  createdBy: 'username'
});
```

**What Happens:**
1. Document is created **locally in PouchDB** first
2. ID is generated: `organization_legal_type:us:s-corporation`
3. Document is stored in local `bmpl_common` database

**Note:** Currently, creation is local-only. To sync to CouchDB, you would need to:
- Either implement a sync mechanism
- Or create an API endpoint for creation and call it instead

---

### Backend Creation (Admin)

**File:** `api/services/common.service.js` (lines 140-184)

```javascript
// API Endpoint: POST /api/common/legal-types
createLegalType: {
  rest: "POST /legal-types",
  params: {
    country_iso_code: { type: "string", length: 2 },
    legal_type: { type: "string", min: 2 },
    // ... other params
  },
  async handler(ctx) {
    const legalTypeData = ctx.params;

    // Generate ID
    const countryCode = legalTypeData.country_iso_code.toLowerCase();
    const legalTypeSlug = legalTypeData.legal_type.toLowerCase().replace(/\s+/g, '-');
    const id = `organization_legal_type:${countryCode}:${legalTypeSlug}`;

    // Create document
    const doc = {
      _id: id,
      type: 'organization_legal_type',
      ...legalTypeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert into CouchDB
    const db = this.getDatabase();
    const result = await db.insert(doc);

    return {
      success: true,
      data: { ...doc, _rev: result.rev }
    };
  }
}
```

---

## Sync Scenarios

### Scenario 1: Fresh Load (No Local Cache)

1. User opens organization create/edit form
2. App calls `getLegalTypesByCountry('US')`
3. API request sent to `/api/common/legal-types?country=US`
4. Backend queries CouchDB
5. Results returned to client
6. **Optionally:** Results stored in local PouchDB for caching

### Scenario 2: Cached Data Available

1. User opens form (already used before)
2. App calls `getLegalTypesByCountry('US')`
3. API request sent to `/api/common/legal-types?country=US`
4. Backend queries CouchDB
5. Fresh results returned to client
6. Local cache updated

### Scenario 3: Offline Mode

1. User opens form (no internet)
2. App calls `getLegalTypesByCountry('US')`
3. API request **fails** (network error)
4. App falls back to `getLegalTypesByCountryLocal('US')`
5. Local PouchDB queried
6. Cached results returned to client
7. **Warning:** Data may be stale

### Scenario 4: Admin Creates New Legal Type

1. Admin uses backend API or CouchDB directly
2. POST `/api/common/legal-types` with new legal type data
3. Document created in CouchDB `bmpl_common` database
4. **Next time** a client queries, new legal type is included
5. Client's local cache is updated with new data

---

## Configuration

### Environment Variables (API Backend)

**File:** `api/.env`

```bash
# CouchDB Connection
COUCHDB_URL=http://admin:password@127.0.0.1:5984

# Database Names
DB_COMMON=bmpl_common
DB_USERS=bmpl_users
DB_ORGANIZATIONS=bmpl_organizations

# API Server
PORT=3000
```

### Client Configuration

**File:** `src/js/config/constants.js` (lines 384-412)

```javascript
export const COUCHDB_CONFIG = {
  // Proxied URL for API calls (avoids CORS in dev)
  URL: '/couchdb',

  // Direct URL (for future direct sync if needed)
  DIRECT_URL: 'http://127.0.0.1:5984',

  // Database names
  COMMON_DB: 'bmpl_common',
  USERS_DB: 'bmpl_users',
  ORGANIZATIONS_DB: 'bmpl_organizations'
};
```

---

## API Endpoints Reference

### GET /api/common/legal-types

**Description:** Get organization legal types with optional filtering

**Query Parameters:**
- `country` (string, optional): Filter by country ISO code (e.g., "US")
- `search` (string, optional): Search query for name/description
- `limit` (number, optional): Max results (default: 100, max: 1000)
- `activeOnly` (boolean, optional): Only active types (default: true)

**Example Request:**
```bash
GET /api/common/legal-types?country=US&activeOnly=true&limit=50
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "organization_legal_type:us:llc",
      "type": "organization_legal_type",
      "country_iso_code": "US",
      "country_name": "United States",
      "legal_type": "LLC",
      "full_name": "Limited Liability Company",
      "abbreviation": "LLC",
      "description": "A flexible business structure...",
      "is_active": true
    }
  ]
}
```

### GET /api/common/legal-types/:id

**Description:** Get a specific legal type by ID

**Example Request:**
```bash
GET /api/common/legal-types/organization_legal_type:us:llc
```

### POST /api/common/legal-types (Admin)

**Description:** Create a new legal type

**Request Body:**
```json
{
  "country_iso_code": "US",
  "country_name": "United States",
  "legal_type": "S Corporation",
  "full_name": "S Corporation",
  "abbreviation": "S Corp",
  "description": "A corporation that elects to pass corporate income...",
  "is_active": true
}
```

---

## Testing the Sync

### Test 1: Query via API

```javascript
// In browser console
const response = await fetch('/api/common/legal-types?country=US');
const data = await response.json();
console.log('Legal types:', data.data);
```

### Test 2: Query via Common Persistence Service

```javascript
// In browser console
const types = await window.commonPersistence.getLegalTypesByCountry('US');
console.log('Found:', types.length, 'legal types');
```

### Test 3: Test Offline Fallback

```javascript
// In browser console
// 1. Disconnect from network (DevTools → Network → Offline)

// 2. Try to get legal types
const types = await window.commonPersistence.getLegalTypesByCountry('US');
console.log('Cached types:', types.length);

// Should see: "API request failed, falling back to local cache"
```

### Test 4: Create via API (Backend)

```bash
curl -X POST http://localhost:3000/api/common/legal-types \
  -H "Content-Type: application/json" \
  -d '{
    "country_iso_code": "US",
    "country_name": "United States",
    "legal_type": "Test Corp",
    "full_name": "Test Corporation",
    "abbreviation": "Test",
    "description": "Test legal type",
    "is_active": true
  }'
```

---

## Monitoring & Debugging

### Check CouchDB Database

```bash
# List all legal types
curl http://admin:password@127.0.0.1:5984/bmpl_common/_find \
  -H "Content-Type: application/json" \
  -d '{
    "selector": {
      "type": "organization_legal_type"
    },
    "limit": 100
  }'
```

### Check Moleculer Logs

```bash
# In api directory
npm start

# Watch for:
# - API requests: GET /api/common/legal-types
# - CouchDB queries
# - Errors
```

### Check Client Console

Open browser DevTools → Console

Look for:
- API request logs
- Fallback warnings: "API request failed, falling back to local cache"
- PouchDB query logs

---

## Best Practices

### 1. Always Use API First
- The API is the **primary data source**
- Local PouchDB is only for **offline/fallback**
- Don't rely on local sync being up-to-date

### 2. Handle Errors Gracefully
```javascript
try {
  const types = await commonPersistence.getLegalTypesByCountry('US');
  // Use types
} catch (error) {
  console.error('Failed to load legal types:', error);
  // Show user-friendly error message
}
```

### 3. Cache Aggressively
- Store API responses in local PouchDB
- Reduces API calls
- Enables offline functionality

### 4. Invalidate Cache
- When new legal types are added
- When legal types are updated
- Consider adding a "last updated" timestamp

---

## Future Enhancements

### 1. Enable Direct Sync (Optional)
Currently disabled at `common-persistence.js:103`. To enable:

```javascript
async setupSync(remoteUrl, credentials = null) {
  await this.ensureInitialized();

  // Create remote connection
  this.remoteDb = new PouchDB(remoteUrl);

  // Start live sync
  this.syncHandler = this.db.sync(this.remoteDb, {
    live: true,
    retry: true
  });

  // Monitor sync events
  this.syncHandler.on('change', (info) => {
    console.log('Sync change:', info);
  });
}
```

### 2. Implement Write-Through Cache
When creating legal types locally, also push to API:

```javascript
async createLegalType(data) {
  // Create locally
  const localDoc = await this.createCommonData('organization_legal_type', data);

  // Also push to API (write-through)
  try {
    await apiClient.post('/api/common/legal-types', data);
  } catch (error) {
    console.warn('Failed to sync to API, will retry later');
    // Queue for later sync
  }

  return localDoc;
}
```

### 3. Add Sync Status Indicator
Show users when data is synced, syncing, or stale:

```javascript
// Track last sync time
localStorage.setItem('legal_types_last_sync', new Date().toISOString());

// Show in UI
const lastSync = localStorage.getItem('legal_types_last_sync');
console.log('Data last synced:', new Date(lastSync).toLocaleString());
```

---

## Summary

**Current Sync Strategy: API-First with Local Fallback**

✅ **Pros:**
- Simple and reliable
- No sync conflicts
- CouchDB is always source of truth
- Works well for read-heavy workloads

⚠️ **Cons:**
- Requires internet connection for fresh data
- Local cache may be stale
- No real-time sync

**Data Flow:**
1. Client queries legal types
2. API request to `/api/common/legal-types`
3. Moleculer API queries CouchDB
4. Results returned to client
5. (Optional) Results cached in local PouchDB
6. If API fails, fallback to local cache

**Key Files:**
- `src/js/services/common-persistence.js` - Client service
- `api/services/common.service.js` - Backend API service
- `src/js/config/constants.js` - Configuration

**Database:**
- Name: `bmpl_common`
- Document Type: `organization_legal_type`
- ID Format: `organization_legal_type:{country}:{slug}`

---

For more details, see:
- `guides/COUCHDB-SYNC-README.md` - CouchDB setup guide
- `guides/sync-setup-guide.md` - Detailed sync testing guide
