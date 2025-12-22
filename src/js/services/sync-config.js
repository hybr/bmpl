/**
 * Sync Configuration Service
 * Manages CouchDB connection configuration and database synchronization setup
 */

import { COUCHDB_CONFIG, STORAGE_KEYS, EVENTS } from '../config/constants.js';
import { eventBus } from '../utils/events.js';

class SyncConfigService {
  constructor() {
    // Use proxied URL for API calls (to avoid CORS)
    this.couchDbUrl = COUCHDB_CONFIG.URL;
    // Use direct URL for PouchDB sync (PouchDB handles CORS internally)
    this.directCouchDbUrl = COUCHDB_CONFIG.DIRECT_URL;
    this.credentials = null;
    this.isConnected = false;
    this.connectionCheckInterval = null;
  }

  /**
   * Initialize sync configuration
   */
  async initialize() {
    // Load saved credentials
    this.loadCredentials();

    // Check CouchDB connectivity
    await this.checkConnectivity();

    // Start periodic connectivity check
    this.startConnectivityCheck();

    console.log('Sync config service initialized');
  }

  /**
   * Load credentials from localStorage
   */
  loadCredentials() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUCHDB_CREDENTIALS);
      if (saved) {
        this.credentials = JSON.parse(saved);
        console.log('CouchDB credentials loaded');
      }
    } catch (error) {
      console.error('Error loading CouchDB credentials:', error);
      this.credentials = null;
    }
  }

  /**
   * Save credentials to localStorage
   */
  saveCredentials(username, password) {
    try {
      this.credentials = { username, password };
      localStorage.setItem(
        STORAGE_KEYS.COUCHDB_CREDENTIALS,
        JSON.stringify(this.credentials)
      );
      console.log('CouchDB credentials saved');
    } catch (error) {
      console.error('Error saving CouchDB credentials:', error);
    }
  }

  /**
   * Set credentials (convenience method for testing)
   * @param {Object} credentials - { username, password }
   */
  setCredentials(credentials) {
    if (credentials && credentials.username && credentials.password) {
      this.saveCredentials(credentials.username, credentials.password);
    } else {
      console.error('Invalid credentials format. Expected { username, password }');
    }
  }

  /**
   * Clear stored credentials
   */
  clearCredentials() {
    this.credentials = null;
    localStorage.removeItem(STORAGE_KEYS.COUCHDB_CREDENTIALS);
    console.log('CouchDB credentials cleared');
  }

  /**
   * Set CouchDB URL
   */
  setCouchDbUrl(url) {
    this.couchDbUrl = url;
    console.log('CouchDB URL set to:', url);
  }

  /**
   * Get CouchDB URL
   */
  getCouchDbUrl() {
    return this.couchDbUrl;
  }

  /**
   * Check CouchDB connectivity
   */
  async checkConnectivity() {
    try {
      const response = await fetch(this.couchDbUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        this.isConnected = true;
        console.log('CouchDB connected:', data.couchdb, 'v' + data.version);

        eventBus.emit(EVENTS.SYNC_STATE_CHANGED, {
          connected: true,
          couchdb: data.couchdb,
          version: data.version
        });

        return { connected: true, info: data };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.isConnected = false;
      console.warn('CouchDB not reachable:', error.message);

      eventBus.emit(EVENTS.SYNC_STATE_CHANGED, {
        connected: false,
        error: error.message
      });

      return { connected: false, error: error.message };
    }
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.credentials && this.credentials.username && this.credentials.password) {
      const auth = btoa(`${this.credentials.username}:${this.credentials.password}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  /**
   * Get remote database URL for an organization (for PouchDB sync)
   * Uses direct URL since PouchDB needs the actual CouchDB address
   */
  getRemoteDbUrl(orgId) {
    const dbName = `${COUCHDB_CONFIG.DB_PREFIX}${orgId}`;
    // For PouchDB replication, we need the direct URL (not proxied)
    // PouchDB will handle CORS or you need to configure CouchDB CORS
    return `${this.directCouchDbUrl}/${dbName}`;
  }

  /**
   * Get API URL for database operations (uses proxy in dev)
   */
  getApiDbUrl(orgId) {
    const dbName = `${COUCHDB_CONFIG.DB_PREFIX}${orgId}`;
    return `${this.couchDbUrl}/${dbName}`;
  }

  /**
   * Check if remote database exists
   */
  async databaseExists(orgId) {
    try {
      const dbUrl = this.getApiDbUrl(orgId);
      const response = await fetch(dbUrl, {
        method: 'HEAD',
        headers: this.getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error checking database existence:', error);
      return false;
    }
  }

  /**
   * Create remote database for organization
   */
  async createDatabase(orgId) {
    try {
      const dbUrl = this.getApiDbUrl(orgId);

      const response = await fetch(dbUrl, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (response.ok || response.status === 412) {
        // 412 means database already exists
        console.log(`Database created/exists: ${dbUrl}`);
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.reason || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating database:', error);
      throw error;
    }
  }

  /**
   * Ensure database exists (create if not)
   */
  async ensureDatabase(orgId) {
    const exists = await this.databaseExists(orgId);
    if (!exists) {
      await this.createDatabase(orgId);
    }
    return true;
  }

  /**
   * Get database info
   */
  async getDatabaseInfo(orgId) {
    try {
      const dbUrl = this.getApiDbUrl(orgId);
      const response = await fetch(dbUrl, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error getting database info:', error);
      return null;
    }
  }

  /**
   * Get all databases
   */
  async getAllDatabases() {
    try {
      const response = await fetch(`${this.couchDbUrl}/_all_dbs`, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const dbs = await response.json();
        // Filter to only show our org databases
        return dbs.filter(db => db.startsWith(COUCHDB_CONFIG.DB_PREFIX));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error getting databases:', error);
      return [];
    }
  }

  /**
   * Delete database
   */
  async deleteDatabase(orgId) {
    try {
      const dbUrl = this.getApiDbUrl(orgId);
      const response = await fetch(dbUrl, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        console.log(`Database deleted: ${dbUrl}`);
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.reason || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting database:', error);
      throw error;
    }
  }

  // ============================================
  // COMMON DATABASE METHODS
  // ============================================

  /**
   * Get remote URL for common database (for PouchDB sync)
   */
  getCommonDbUrl() {
    return `${this.directCouchDbUrl}/${COUCHDB_CONFIG.COMMON_DB}`;
  }

  /**
   * Get API URL for common database (proxied in dev)
   */
  getCommonDbApiUrl() {
    return `${this.couchDbUrl}/${COUCHDB_CONFIG.COMMON_DB}`;
  }

  /**
   * Ensure common database exists on CouchDB
   */
  async ensureCommonDatabase() {
    try {
      const dbUrl = this.getCommonDbApiUrl();

      // Check if exists
      const response = await fetch(dbUrl, {
        method: 'HEAD',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        console.log('Common database exists');
        return true;
      }

      // Create database
      const createResponse = await fetch(dbUrl, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (createResponse.ok || createResponse.status === 412) {
        console.log('Common database created/exists');
        return true;
      }

      throw new Error(`Failed to create common database: ${createResponse.status}`);
    } catch (error) {
      console.error('Error ensuring common database:', error);
      throw error;
    }
  }

  /**
   * Deploy common database design documents
   */
  async deployCommonDesignDoc(designDoc) {
    try {
      const docUrl = `${this.getCommonDbApiUrl()}/_design/common`;

      const response = await fetch(docUrl, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(designDoc)
      });

      if (response.ok) {
        console.log('Common design document deployed');
        return true;
      }

      // Handle conflict - document exists, need to get rev
      if (response.status === 409) {
        const existing = await fetch(docUrl, {
          headers: this.getAuthHeaders()
        }).then(r => r.json());

        designDoc._rev = existing._rev;

        const updateResponse = await fetch(docUrl, {
          method: 'PUT',
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(designDoc)
        });

        if (updateResponse.ok) {
          console.log('Common design document updated');
          return true;
        }
      }

      const errorText = await response.text();
      throw new Error(`Failed to deploy design document: ${response.status} - ${errorText}`);
    } catch (error) {
      console.error('Error deploying common design doc:', error);
      throw error;
    }
  }

  /**
   * Set common database security
   */
  async setCommonDatabaseSecurity() {
    try {
      const securityUrl = `${this.getCommonDbApiUrl()}/_security`;

      const securityDoc = {
        admins: {
          names: [],
          roles: ['_admin']
        },
        members: {
          names: [],
          roles: ['authenticated_user']
        }
      };

      const response = await fetch(securityUrl, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(securityDoc)
      });

      if (response.ok) {
        console.log('Common database security set');
        return true;
      }

      const errorText = await response.text();
      throw new Error(`Failed to set security: ${response.status} - ${errorText}`);
    } catch (error) {
      console.error('Error setting common database security:', error);
      throw error;
    }
  }

  /**
   * Start periodic connectivity check
   */
  startConnectivityCheck(intervalMs = 30000) {
    this.stopConnectivityCheck();

    this.connectionCheckInterval = setInterval(async () => {
      await this.checkConnectivity();
    }, intervalMs);

    console.log(`Connectivity check started (every ${intervalMs}ms)`);
  }

  /**
   * Stop periodic connectivity check
   */
  stopConnectivityCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      url: this.couchDbUrl,
      connected: this.isConnected,
      hasCredentials: !!(this.credentials && this.credentials.username)
    };
  }

  /**
   * Test credentials
   */
  async testCredentials(username, password) {
    const originalCredentials = this.credentials;

    try {
      // Temporarily set new credentials
      this.credentials = { username, password };

      // Try to access session endpoint
      const response = await fetch(`${this.couchDbUrl}/_session`, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          userCtx: data.userCtx
        };
      } else {
        return {
          valid: false,
          error: 'Invalid credentials'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    } finally {
      // Restore original credentials
      this.credentials = originalCredentials;
    }
  }

  /**
   * Setup CORS for CouchDB (requires admin)
   * This configures CouchDB to accept requests from any origin
   */
  async setupCORS() {
    // Use direct URL for admin operations
    const baseUrl = this.couchDbUrl;

    try {
      // Enable CORS
      await fetch(`${baseUrl}/_node/_local/_config/httpd/enable_cors`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify('true')
      });

      // Set allowed origins
      await fetch(`${baseUrl}/_node/_local/_config/cors/origins`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify('*')
      });

      // Set allowed methods
      await fetch(`${baseUrl}/_node/_local/_config/cors/methods`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify('GET, PUT, POST, HEAD, DELETE')
      });

      // Set allowed headers
      await fetch(`${baseUrl}/_node/_local/_config/cors/headers`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify('accept, authorization, content-type, origin, referer')
      });

      // Allow credentials
      await fetch(`${baseUrl}/_node/_local/_config/cors/credentials`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify('true')
      });

      console.log('CORS configured for CouchDB');
      return true;
    } catch (error) {
      console.error('Error setting up CORS:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopConnectivityCheck();
  }
}

// Create singleton instance
export const syncConfigService = new SyncConfigService();

export default syncConfigService;
