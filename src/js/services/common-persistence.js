/**
 * Common Persistence Service
 * Handles storing and syncing common reference data with PouchDB/CouchDB
 * This includes enums, common tables, and globally accessible reference data
 */

import { COMMON_DATA_TYPES, COUCHDB_CONFIG, EVENTS } from '../config/constants.js';
import { getPouchDB } from './pouchdb-init.js';
import { eventBus } from '../utils/events.js';
import { apiClient } from '../utils/api-client.js';

// PouchDB reference (set after initialization)
let PouchDB = null;

class CommonPersistence {
  constructor() {
    this.db = null;
    this.remoteDb = null;
    this.syncHandler = null;
    this.initPromise = null;
    this.dbName = 'bmpl_common';
  }

  /**
   * Ensure PouchDB is initialized
   */
  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    await this.initPromise;
  }

  /**
   * Initialize the common database
   */
  async initialize() {
    // Get shared PouchDB instance
    PouchDB = await getPouchDB();

    try {
      // Create local database
      this.db = new PouchDB(this.dbName);

      // Create indexes
      await this.createIndexes();

      console.log('Common database initialized');
    } catch (error) {
      console.error('Error initializing common database:', error);
      throw error;
    }
  }

  /**
   * Create database indexes
   */
  async createIndexes() {
    // Check if pouchdb-find plugin is available
    if (typeof this.db.createIndex !== 'function') {
      console.warn('PouchDB-find plugin not available. Skipping index creation.');
      console.warn('Make sure pouchdb-find is loaded via CDN in index.html');
      return;
    }

    try {
      // Index by type
      await this.db.createIndex({
        index: { fields: ['type'] }
      });

      // Index by type and country
      await this.db.createIndex({
        index: { fields: ['type', 'country_iso_code'] }
      });

      // Index by type and legal_type
      await this.db.createIndex({
        index: { fields: ['type', 'legal_type'] }
      });

      // Composite index for type, country, and legal_type
      await this.db.createIndex({
        index: { fields: ['type', 'country_iso_code', 'legal_type'] }
      });

      // Index by creator for permission checks
      await this.db.createIndex({
        index: { fields: ['createdBy'] }
      });

      console.log('Common database indexes created');
    } catch (error) {
      console.error('Error creating common database indexes:', error);
    }
  }

  /**
   * Setup sync with CouchDB
   * DISABLED: Common database uses API queries instead of local sync
   */
  async setupSync(remoteUrl, credentials = null) {
    console.log('ℹ️  Common database sync disabled - using Moleculer API queries');
    console.log('💡 Common data will be fetched from backend API for better performance');
    console.log('📡 API endpoint: /api/common/*');

    // Do not setup sync for common database
    // All queries will go through the backend API
    return;
  }

  /**
   * Cancel sync
   */
  cancelSync() {
    if (this.syncHandler) {
      this.syncHandler.cancel();
      this.syncHandler = null;
      console.log('Common database sync cancelled');
    }
  }

  /**
   * Force a one-time sync
   */
  async forceSync(remoteUrl, credentials = null) {
    await this.ensureInitialized();

    try {
      let remote = remoteUrl;
      if (credentials && credentials.username && credentials.password) {
        const url = new URL(remoteUrl);
        url.username = credentials.username;
        url.password = credentials.password;
        remote = url.toString();
      }

      const result = await this.db.sync(remote);
      console.log('Common database force sync complete:', result);
      return result;
    } catch (error) {
      console.error('Error during common database force sync:', error);
      throw error;
    }
  }

  /**
   * Generic method to create common data
   */
  async createCommonData(type, data) {
    await this.ensureInitialized();

    const now = new Date().toISOString();

    const doc = {
      type: type,
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };

    // Ensure required fields
    if (!doc.createdBy) {
      throw new Error('createdBy is required');
    }

    try {
      const result = await this.db.put(doc);
      console.log(`Common data created: ${result.id}`);

      eventBus.emit(EVENTS.COMMON_DATA_CREATED, { id: result.id, type });

      return { ...doc, _id: result.id, _rev: result.rev };
    } catch (error) {
      console.error('Error creating common data:', error);
      throw error;
    }
  }

  /**
   * Get common data by ID
   */
  async getCommonDataById(id) {
    await this.ensureInitialized();

    try {
      const doc = await this.db.get(id);
      return doc;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      console.error('Error getting common data by ID:', error);
      throw error;
    }
  }

  /**
   * Get common data by type
   */
  async getCommonDataByType(type, options = {}) {
    await this.ensureInitialized();

    try {
      const query = {
        selector: {
          type: type
        },
        limit: options.limit || 1000,
        skip: options.skip || 0
      };

      // Add sorting if specified
      if (options.sort) {
        query.sort = options.sort;
      }

      const result = await this.db.find(query);
      return result.docs;
    } catch (error) {
      console.error('Error getting common data by type:', error);
      throw error;
    }
  }

  /**
   * Update common data
   */
  async updateCommonData(id, updates) {
    await this.ensureInitialized();

    try {
      const doc = await this.db.get(id);

      const updatedDoc = {
        ...doc,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Preserve immutable fields
      updatedDoc._id = doc._id;
      updatedDoc._rev = doc._rev;
      updatedDoc.type = doc.type;
      updatedDoc.createdBy = doc.createdBy;
      updatedDoc.createdAt = doc.createdAt;

      const result = await this.db.put(updatedDoc);

      eventBus.emit(EVENTS.COMMON_DATA_UPDATED, { id: result.id, type: doc.type });

      return { ...updatedDoc, _rev: result.rev };
    } catch (error) {
      console.error('Error updating common data:', error);
      throw error;
    }
  }

  /**
   * Delete common data
   */
  async deleteCommonData(id) {
    await this.ensureInitialized();

    try {
      const doc = await this.db.get(id);
      const result = await this.db.remove(doc);

      eventBus.emit(EVENTS.COMMON_DATA_DELETED, { id: result.id, type: doc.type });

      return result;
    } catch (error) {
      console.error('Error deleting common data:', error);
      throw error;
    }
  }

  // ============================================
  // ORGANIZATION LEGAL TYPE SPECIFIC METHODS
  // ============================================

  /**
   * Create an organization legal type
   */
  async createLegalType(legalTypeData) {
    await this.ensureInitialized();

    // Generate ID: organization_legal_type:us:llc
    const countryCode = legalTypeData.country_iso_code.toLowerCase();
    const legalTypeSlug = legalTypeData.legal_type.toLowerCase().replace(/\s+/g, '-');
    const id = `${COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE}:${countryCode}:${legalTypeSlug}`;

    const doc = {
      _id: id,
      type: COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE,
      ...legalTypeData
    };

    return await this.createCommonData(COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE, doc);
  }

  /**
   * Get legal types by country
   * Uses Moleculer API with local PouchDB fallback
   */
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

  /**
   * Get legal types by country from local PouchDB
   * Fallback when API is unavailable
   */
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
      console.error('Error getting legal types by country from local DB:', error);
      return [];
    }
  }

  /**
   * Get all legal types
   * Uses Moleculer API with local PouchDB fallback
   */
  async getAllLegalTypes(options = {}) {
    try {
      // Try API first
      const params = {};
      if (options.activeOnly) {
        params.activeOnly = true;
      }
      if (options.limit) {
        params.limit = options.limit;
      }

      const response = await apiClient.get('/api/common/legal-types', { params });
      return response.data || [];
    } catch (error) {
      console.warn('API request failed, falling back to local cache:', error.message);
      // Fallback to local PouchDB
      return this.getAllLegalTypesLocal(options);
    }
  }

  /**
   * Get all legal types from local PouchDB
   * Fallback when API is unavailable
   */
  async getAllLegalTypesLocal(options = {}) {
    await this.ensureInitialized();

    try {
      const selector = {
        type: COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE
      };

      // Filter by active status if specified
      if (options.activeOnly) {
        selector.is_active = { $ne: false };
      }

      const result = await this.db.find({
        selector,
        sort: [{ country_name: 'asc' }, { legal_type: 'asc' }],
        limit: options.limit || 1000
      });

      return result.docs;
    } catch (error) {
      console.error('Error getting all legal types from local DB:', error);
      return [];
    }
  }

  /**
   * Search legal types
   * Uses Moleculer API with local PouchDB fallback
   */
  async searchLegalTypes(query, countryFilter = null) {
    try {
      // Try API first
      const params = {};
      if (query) {
        params.search = query;
      }
      if (countryFilter) {
        params.country = countryFilter;
      }

      const response = await apiClient.get('/api/common/legal-types', { params });
      return response.data || [];
    } catch (error) {
      console.warn('API request failed, falling back to local cache:', error.message);
      // Fallback to local PouchDB
      return this.searchLegalTypesLocal(query, countryFilter);
    }
  }

  /**
   * Search legal types in local PouchDB
   * Fallback when API is unavailable
   */
  async searchLegalTypesLocal(query, countryFilter = null) {
    await this.ensureInitialized();

    try {
      const selector = {
        type: COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE,
        is_active: { $ne: false }
      };

      if (countryFilter) {
        selector.country_iso_code = countryFilter.toUpperCase();
      }

      // Get all matching documents (PouchDB doesn't support regex in queries)
      const result = await this.db.find({
        selector,
        limit: 1000
      });

      // Filter client-side by query
      if (query) {
        const lowerQuery = query.toLowerCase();
        return result.docs.filter(doc =>
          doc.legal_type.toLowerCase().includes(lowerQuery) ||
          doc.full_name?.toLowerCase().includes(lowerQuery) ||
          doc.abbreviation?.toLowerCase().includes(lowerQuery) ||
          doc.description?.toLowerCase().includes(lowerQuery)
        );
      }

      return result.docs;
    } catch (error) {
      console.error('Error searching legal types from local DB:', error);
      return [];
    }
  }

  /**
   * Update legal type
   */
  async updateLegalType(id, updates) {
    return await this.updateCommonData(id, updates);
  }

  /**
   * Delete legal type
   */
  async deleteLegalType(id) {
    return await this.deleteCommonData(id);
  }

  /**
   * Get database info
   */
  async getDatabaseInfo() {
    await this.ensureInitialized();
    return await this.db.info();
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.syncHandler) {
      this.syncHandler.cancel();
    }
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
    this.remoteDb = null;
    this.syncHandler = null;
    this.initPromise = null;
    console.log('Common database closed');
  }
}

// Export singleton instance
export const commonPersistence = new CommonPersistence();
export default commonPersistence;
