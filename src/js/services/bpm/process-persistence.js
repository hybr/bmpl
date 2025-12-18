/**
 * Process Persistence Service
 * Handles saving and loading process instances to/from PouchDB
 */

import { eventBus } from '../../utils/events.js';
import { EVENTS, DOC_TYPES, PROCESS_SYNC_STATUS } from '../../config/constants.js';
import { getPouchDB } from '../pouchdb-init.js';

// PouchDB reference (set after initialization)
let PouchDB = null;

class ProcessPersistence {
  constructor() {
    this.databases = new Map(); // orgId -> PouchDB instance
    this.syncHandlers = new Map(); // orgId -> sync handler
    this.initPromise = null;
  }

  /**
   * Ensure PouchDB is initialized
   */
  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = getPouchDB().then(pdb => {
        PouchDB = pdb;
      });
    }
    await this.initPromise;
  }

  /**
   * Initialize database for an organization
   */
  async initDatabase(orgId) {
    await this.ensureInitialized();

    if (this.databases.has(orgId)) {
      return this.databases.get(orgId);
    }

    try {
      // Create local PouchDB instance
      const dbName = `v4l_org_${orgId}`;
      const db = new PouchDB(dbName);

      // Create indexes for queries
      await this.createIndexes(db);

      this.databases.set(orgId, db);

      console.log(`Process database initialized for org: ${orgId}`);

      return db;
    } catch (error) {
      console.error(`Failed to initialize database for org ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Create database indexes
   */
  async createIndexes(db) {
    try {
      // Index for querying processes by type
      await db.createIndex({
        index: {
          fields: ['type', 'processType']
        }
      });

      // Index for querying by status
      await db.createIndex({
        index: {
          fields: ['type', 'status']
        }
      });

      // Index for querying by current state
      await db.createIndex({
        index: {
          fields: ['type', 'currentState']
        }
      });

      // Index for querying by definition ID
      await db.createIndex({
        index: {
          fields: ['type', 'definitionId']
        }
      });

      // Index for querying by sync status
      await db.createIndex({
        index: {
          fields: ['type', 'syncStatus']
        }
      });

      // Index for sorting by creation date
      await db.createIndex({
        index: {
          fields: ['type', 'createdAt']
        }
      });

      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
      // Don't throw - indexes may already exist
    }
  }

  /**
   * Get database for organization
   */
  getDatabase(orgId) {
    const db = this.databases.get(orgId);
    if (!db) {
      throw new Error(`Database not initialized for org: ${orgId}`);
    }
    return db;
  }

  /**
   * Save a process instance
   */
  async saveProcess(orgId, processInstance) {
    try {
      const db = this.getDatabase(orgId);

      // Ensure document type is set
      processInstance.type = DOC_TYPES.PROCESS_INSTANCE;

      // Update sync status and timestamp
      processInstance.syncStatus = PROCESS_SYNC_STATUS.SYNCED;
      processInstance.lastSyncAt = new Date().toISOString();

      // Save to database
      const result = await db.put(processInstance);

      // Update _rev if document was updated
      if (result.ok) {
        processInstance._rev = result.rev;
      }

      console.log(`Process saved: ${processInstance._id}`);

      return processInstance;
    } catch (error) {
      console.error('Error saving process:', error);

      // Mark as pending sync on error
      processInstance.syncStatus = PROCESS_SYNC_STATUS.ERROR;

      throw error;
    }
  }

  /**
   * Load a process instance by ID
   */
  async loadProcess(orgId, processId) {
    try {
      const db = this.getDatabase(orgId);
      const processInstance = await db.get(processId);

      return processInstance;
    } catch (error) {
      if (error.name === 'not_found') {
        return null;
      }

      console.error('Error loading process:', error);
      throw error;
    }
  }

  /**
   * Load all processes for an organization
   */
  async loadAllProcesses(orgId) {
    try {
      const db = this.getDatabase(orgId);

      const result = await db.find({
        selector: {
          type: DOC_TYPES.PROCESS_INSTANCE
        },
        sort: [{ createdAt: 'desc' }]
      });

      return result.docs;
    } catch (error) {
      console.error('Error loading all processes:', error);
      return [];
    }
  }

  /**
   * Load processes by type
   */
  async loadProcessesByType(orgId, processType) {
    try {
      const db = this.getDatabase(orgId);

      const result = await db.find({
        selector: {
          type: DOC_TYPES.PROCESS_INSTANCE,
          processType: processType
        },
        sort: [{ createdAt: 'desc' }]
      });

      return result.docs;
    } catch (error) {
      console.error('Error loading processes by type:', error);
      return [];
    }
  }

  /**
   * Load processes by status
   */
  async loadProcessesByStatus(orgId, status) {
    try {
      const db = this.getDatabase(orgId);

      const result = await db.find({
        selector: {
          type: DOC_TYPES.PROCESS_INSTANCE,
          status: status
        },
        sort: [{ createdAt: 'desc' }]
      });

      return result.docs;
    } catch (error) {
      console.error('Error loading processes by status:', error);
      return [];
    }
  }

  /**
   * Load processes by current state
   */
  async loadProcessesByState(orgId, currentState) {
    try {
      const db = this.getDatabase(orgId);

      const result = await db.find({
        selector: {
          type: DOC_TYPES.PROCESS_INSTANCE,
          currentState: currentState
        },
        sort: [{ createdAt: 'desc' }]
      });

      return result.docs;
    } catch (error) {
      console.error('Error loading processes by state:', error);
      return [];
    }
  }

  /**
   * Load processes by definition ID
   */
  async loadProcessesByDefinition(orgId, definitionId) {
    try {
      const db = this.getDatabase(orgId);

      const result = await db.find({
        selector: {
          type: DOC_TYPES.PROCESS_INSTANCE,
          definitionId: definitionId
        },
        sort: [{ createdAt: 'desc' }]
      });

      return result.docs;
    } catch (error) {
      console.error('Error loading processes by definition:', error);
      return [];
    }
  }

  /**
   * Delete a process instance
   */
  async deleteProcess(orgId, processId) {
    try {
      const db = this.getDatabase(orgId);
      const doc = await db.get(processId);

      await db.remove(doc);

      console.log(`Process deleted: ${processId}`);

      return true;
    } catch (error) {
      console.error('Error deleting process:', error);
      return false;
    }
  }

  /**
   * Bulk save processes
   */
  async bulkSaveProcesses(orgId, processes) {
    try {
      const db = this.getDatabase(orgId);

      // Ensure all documents have correct type and sync status
      const docs = processes.map(p => ({
        ...p,
        type: DOC_TYPES.PROCESS_INSTANCE,
        syncStatus: PROCESS_SYNC_STATUS.SYNCED,
        lastSyncAt: new Date().toISOString()
      }));

      const result = await db.bulkDocs(docs);

      // Update _rev for successful saves
      result.forEach((r, index) => {
        if (r.ok) {
          processes[index]._rev = r.rev;
        }
      });

      console.log(`Bulk saved ${processes.length} processes`);

      return processes;
    } catch (error) {
      console.error('Error bulk saving processes:', error);
      throw error;
    }
  }

  /**
   * Get processes that need sync
   */
  async getProcessesNeedingSync(orgId) {
    try {
      const db = this.getDatabase(orgId);

      const result = await db.find({
        selector: {
          type: DOC_TYPES.PROCESS_INSTANCE,
          syncStatus: {
            $in: [PROCESS_SYNC_STATUS.PENDING, PROCESS_SYNC_STATUS.ERROR]
          }
        }
      });

      return result.docs;
    } catch (error) {
      console.error('Error getting processes needing sync:', error);
      return [];
    }
  }

  /**
   * Setup remote sync with CouchDB
   */
  async setupSync(orgId, remoteUrl, credentials = null) {
    try {
      const db = this.getDatabase(orgId);

      // Cancel existing sync if any
      if (this.syncHandlers.has(orgId)) {
        this.syncHandlers.get(orgId).cancel();
      }

      // Configure remote database URL
      let remote = remoteUrl;
      if (credentials && credentials.username && credentials.password) {
        const url = new URL(remoteUrl);
        url.username = credentials.username;
        url.password = credentials.password;
        remote = url.toString();
      }

      // Start bidirectional sync
      const sync = db.sync(remote, {
        live: true,
        retry: true,
        filter: (doc) => {
          // Only sync process instances
          return doc.type === DOC_TYPES.PROCESS_INSTANCE;
        }
      });

      // Listen to sync events
      sync.on('change', (info) => {
        console.log('Sync change:', info);
        eventBus.emit(EVENTS.PROCESS_SYNC_COMPLETED, {
          orgId,
          direction: info.direction,
          docsWritten: info.change.docs_written
        });
      });

      sync.on('paused', (err) => {
        if (err) {
          console.error('Sync paused with error:', err);
          eventBus.emit(EVENTS.PROCESS_SYNC_ERROR, { orgId, error: err.message });
        } else {
          console.log('Sync paused (up to date)');
        }
      });

      sync.on('active', () => {
        console.log('Sync active');
        eventBus.emit(EVENTS.PROCESS_SYNC_STARTED, { orgId });
      });

      sync.on('denied', (err) => {
        console.error('Sync denied:', err);
        eventBus.emit(EVENTS.PROCESS_SYNC_ERROR, { orgId, error: 'Sync denied' });
      });

      sync.on('error', (err) => {
        console.error('Sync error:', err);
        eventBus.emit(EVENTS.PROCESS_SYNC_ERROR, { orgId, error: err.message });
      });

      this.syncHandlers.set(orgId, sync);

      console.log(`Sync setup for org: ${orgId}`);

      return sync;
    } catch (error) {
      console.error('Error setting up sync:', error);
      throw error;
    }
  }

  /**
   * Cancel sync for organization
   */
  cancelSync(orgId) {
    if (this.syncHandlers.has(orgId)) {
      this.syncHandlers.get(orgId).cancel();
      this.syncHandlers.delete(orgId);
      console.log(`Sync cancelled for org: ${orgId}`);
    }
  }

  /**
   * Close database for organization
   */
  async closeDatabase(orgId) {
    try {
      // Cancel sync first
      this.cancelSync(orgId);

      // Close database
      if (this.databases.has(orgId)) {
        const db = this.databases.get(orgId);
        await db.close();
        this.databases.delete(orgId);
        console.log(`Database closed for org: ${orgId}`);
      }
    } catch (error) {
      console.error('Error closing database:', error);
      throw error;
    }
  }

  /**
   * Destroy database for organization (delete all data)
   */
  async destroyDatabase(orgId) {
    await this.ensureInitialized();

    try {
      // Cancel sync and close first
      await this.closeDatabase(orgId);

      // Destroy the database
      const dbName = `v4l_org_${orgId}`;

      // Create a temporary instance to destroy
      const tempDb = new PouchDB(dbName);
      await tempDb.destroy();

      console.log(`Database destroyed for org: ${orgId}`);
    } catch (error) {
      console.error('Error destroying database:', error);
      throw error;
    }
  }

  /**
   * Get database info
   */
  async getDatabaseInfo(orgId) {
    try {
      const db = this.getDatabase(orgId);
      const info = await db.info();
      return info;
    } catch (error) {
      console.error('Error getting database info:', error);
      return null;
    }
  }

  /**
   * Compact database (remove deleted documents)
   */
  async compactDatabase(orgId) {
    try {
      const db = this.getDatabase(orgId);
      await db.compact();
      console.log(`Database compacted for org: ${orgId}`);
    } catch (error) {
      console.error('Error compacting database:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const processPersistence = new ProcessPersistence();

export default processPersistence;
