# PouchDB Test Guide

## Testing in Browser Console

After the fixes, test PouchDB with these commands:

### 1. Basic PouchDB Test

```javascript
// Test PouchDB import
const PouchDB = (await import('pouchdb')).default;
console.log('PouchDB loaded:', typeof PouchDB);

// Create a test database
const testDb = new PouchDB('test_database');
console.log('Database created');

// Add a document
const result = await testDb.put({
  _id: 'test_doc_1',
  type: 'test',
  message: 'Hello from PouchDB!',
  timestamp: new Date().toISOString()
});
console.log('Document created:', result);

// Retrieve the document
const doc = await testDb.get('test_doc_1');
console.log('Document retrieved:', doc);

// Query all documents
const allDocs = await testDb.allDocs({ include_docs: true });
console.log('All documents:', allDocs);

// Clean up
await testDb.destroy();
console.log('Test database destroyed');
```

### 2. Test with PouchDB Find Plugin

```javascript
const PouchDB = (await import('pouchdb')).default;
const PouchDBFind = (await import('pouchdb-find')).default;

PouchDB.plugin(PouchDBFind);

const db = new PouchDB('find_test');

// Create an index
await db.createIndex({
  index: { fields: ['type', 'priority'] }
});

// Add some test data
await db.bulkDocs([
  { _id: 'task1', type: 'task', priority: 'high', title: 'Fix bugs' },
  { _id: 'task2', type: 'task', priority: 'low', title: 'Write docs' },
  { _id: 'task3', type: 'task', priority: 'high', title: 'Review code' }
]);

// Query with find
const results = await db.find({
  selector: {
    type: 'task',
    priority: 'high'
  },
  sort: ['priority']
});

console.log('High priority tasks:', results.docs);

// Clean up
await db.destroy();
```

### 3. Test BPM Framework with PouchDB

```javascript
// Initialize BPM
await window.BPM.init({ orgId: 'test_org' });

// The BPM framework should now work with PouchDB
console.log('BPM initialized successfully');

// Create a test process
const order = await window.BPM.createOrder({
  orderId: 'ORD-TEST-001',
  buyerId: 'buyer_123',
  sellerId: 'seller_456',
  productId: 'prod_789',
  productName: 'Test Product',
  quantity: 1,
  amount: 99.99
});

console.log('Order created:', order);

// Check if it's persisted
const processState = window.BPM.processState;
const allProcesses = processState.getAllProcesses();
console.log('All processes:', allProcesses);

// Run the full test suite
await window.BPM.test();
```

## Expected Results

### ✅ Success Indicators

1. **No Console Errors**
   - No "Class extends value [object Object]" errors
   - No "global is not defined" errors
   - No module loading errors

2. **PouchDB Working**
   - Can create databases
   - Can add/retrieve documents
   - Find plugin works correctly

3. **BPM Framework Working**
   - Initializes without errors
   - Can create process instances
   - Processes are stored in PouchDB
   - Test suite passes

### ❌ Troubleshooting

If you still see errors:

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear PouchDB databases**: Run in console
   ```javascript
   indexedDB.databases().then(dbs => {
     dbs.forEach(db => indexedDB.deleteDatabase(db.name));
   });
   ```
3. **Restart dev server**: Kill and restart `npm run dev`
4. **Check correct port**: Make sure you're on http://localhost:5174/ (not 5173)

## Changes Made

### 1. process-persistence.js
- Changed to dynamic PouchDB imports
- Added `ensureInitialized()` method
- PouchDB loads on-demand instead of at module load time
- Handles default vs named exports properly

### 2. manifest.json
- Simplified to use single SVG icon
- Removed references to non-existent PNG files
- Removed screenshots section

### 3. index.html
- Updated favicon to use SVG icon

### 4. public/icons/icon.svg
- Created simple placeholder SVG icon

## Verification Checklist

- [ ] PouchDB imports without errors
- [ ] Can create PouchDB database
- [ ] Find plugin loads correctly
- [ ] BPM framework initializes
- [ ] Can create process instances
- [ ] Processes persist to IndexedDB
- [ ] No icon 404 errors
- [ ] No manifest.json errors
