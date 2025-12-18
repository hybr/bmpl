/**
 * Organization Persistence Service
 * Handles storing and syncing organization data with PouchDB/CouchDB
 */

import { DOC_TYPES, COUCHDB_CONFIG } from '../config/constants.js';
import { getPouchDB } from './pouchdb-init.js';

// PouchDB reference (set after initialization)
let PouchDB = null;

class OrganizationPersistence {
  constructor() {
    this.db = null;
    this.remoteDb = null;
    this.syncHandler = null;
    this.initPromise = null;
    this.dbName = 'bmpl_organizations';
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
   * Initialize the organization database
   */
  async initialize() {
    // Get shared PouchDB instance
    PouchDB = await getPouchDB();

    try {
      // Create local database
      this.db = new PouchDB(this.dbName);

      // Create indexes
      await this.createIndexes();

      console.log('Organization database initialized');
    } catch (error) {
      console.error('Error initializing organization database:', error);
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
      await this.db.createIndex({
        index: { fields: ['type', 'shortName'] }
      });

      await this.db.createIndex({
        index: { fields: ['type', 'fullName'] }
      });

      await this.db.createIndex({
        index: { fields: ['type', 'subdomain'] }
      });

      await this.db.createIndex({
        index: { fields: ['type', 'industry'] }
      });

      await this.db.createIndex({
        index: { fields: ['type', 'legalType'] }
      });

      console.log('Organization database indexes created');
    } catch (error) {
      console.error('Error creating organization indexes:', error);
    }
  }

  /**
   * Setup sync with CouchDB
   */
  async setupSync(remoteUrl, credentials = null) {
    await this.ensureInitialized();

    try {
      // Cancel existing sync
      if (this.syncHandler) {
        this.syncHandler.cancel();
      }

      // Build remote URL with credentials
      let remote = remoteUrl;
      if (credentials && credentials.username && credentials.password) {
        const url = new URL(remoteUrl);
        url.username = credentials.username;
        url.password = credentials.password;
        remote = url.toString();
      }

      // Create remote database reference
      this.remoteDb = new PouchDB(remote);

      // Start bidirectional sync
      this.syncHandler = this.db.sync(this.remoteDb, {
        live: true,
        retry: true
      });

      this.syncHandler.on('change', (info) => {
        console.log('Organization sync change:', info.direction, info.change.docs_written, 'docs');
      });

      this.syncHandler.on('error', (err) => {
        console.error('Organization sync error:', err);
      });

      this.syncHandler.on('paused', (err) => {
        if (err) {
          console.warn('Organization sync paused with error:', err);
        }
      });

      console.log('Organization sync started with:', remoteUrl);
      return true;
    } catch (error) {
      console.error('Error setting up organization sync:', error);
      return false;
    }
  }

  /**
   * Cancel sync
   */
  cancelSync() {
    if (this.syncHandler) {
      this.syncHandler.cancel();
      this.syncHandler = null;
    }
  }

  /**
   * Create a new organization
   */
  async createOrganization(orgData) {
    await this.ensureInitialized();

    const fullName = `${orgData.shortName} ${orgData.legalType}`;

    const org = {
      _id: `org:${orgData.shortName.toLowerCase().replace(/\s+/g, '-')}`,
      type: DOC_TYPES.ORGANIZATION,
      shortName: orgData.shortName,
      legalType: orgData.legalType,
      fullName: fullName,
      industry: orgData.industry || null,
      logo: orgData.logo || null,
      tagLine: orgData.tagLine || null,
      subdomain: orgData.subdomain || null,
      website: orgData.website || null,
      primaryEmail: orgData.primaryEmail || null,
      phone: orgData.phone || null,
      createdBy: orgData.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const result = await this.db.put(org);
      org._rev = result.rev;
      console.log('Organization created:', org.shortName);
      return org;
    } catch (error) {
      if (error.status === 409) {
        throw new Error('Organization with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Get organization by short name
   */
  async getOrganizationByShortName(shortName) {
    await this.ensureInitialized();

    try {
      const org = await this.db.get(`org:${shortName.toLowerCase().replace(/\s+/g, '-')}`);
      return org;
    } catch (error) {
      if (error.name === 'not_found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get organization by full name (exact match)
   */
  async getOrganizationByFullName(fullName) {
    await this.ensureInitialized();

    try {
      const result = await this.db.find({
        selector: {
          type: DOC_TYPES.ORGANIZATION,
          fullName: fullName
        }
      });
      return result.docs[0] || null;
    } catch (error) {
      console.error('Error finding organization by full name:', error);
      return null;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(orgId) {
    await this.ensureInitialized();

    try {
      const org = await this.db.get(orgId);
      return org;
    } catch (error) {
      if (error.name === 'not_found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Search organizations by query
   */
  async searchOrganizations(query, options = {}) {
    await this.ensureInitialized();
    const { limit = 10 } = options;
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) return [];

    try {
      const result = await this.db.find({
        selector: {
          type: DOC_TYPES.ORGANIZATION,
          $or: [
            { shortName: { $regex: new RegExp(lowerQuery, 'i') } },
            { fullName: { $regex: new RegExp(lowerQuery, 'i') } },
            { tagLine: { $regex: new RegExp(lowerQuery, 'i') } }
          ]
        },
        limit: limit
      });

      return result.docs;
    } catch (error) {
      console.error('Error searching organizations:', error);
      // Fallback to manual search
      return this.searchFallback(lowerQuery, limit);
    }
  }

  /**
   * Fallback search when $regex is not supported
   */
  async searchFallback(query, limit) {
    try {
      const orgs = await this.getAllOrganizations();

      const filtered = orgs.filter(org => {
        const searchStr = [
          org.shortName || '',
          org.fullName || '',
          org.tagLine || ''
        ].join(' ').toLowerCase();
        return searchStr.includes(query);
      });

      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Error in fallback search:', error);
      return [];
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(orgId, updates) {
    await this.ensureInitialized();

    try {
      const org = await this.db.get(orgId);

      // Recompute fullName if shortName or legalType changed
      let fullName = org.fullName;
      if (updates.shortName || updates.legalType) {
        const shortName = updates.shortName || org.shortName;
        const legalType = updates.legalType || org.legalType;
        fullName = `${shortName} ${legalType}`;
      }

      const updatedOrg = {
        ...org,
        ...updates,
        fullName: fullName,
        updatedAt: new Date().toISOString()
      };

      const result = await this.db.put(updatedOrg);
      updatedOrg._rev = result.rev;

      console.log('Organization updated:', updatedOrg.shortName);
      return updatedOrg;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(orgId) {
    await this.ensureInitialized();

    try {
      const org = await this.db.get(orgId);
      await this.db.remove(org);
      console.log('Organization deleted:', org.shortName);
      return true;
    } catch (error) {
      console.error('Error deleting organization:', error);
      return false;
    }
  }

  /**
   * Get all organizations
   */
  async getAllOrganizations() {
    await this.ensureInitialized();

    try {
      const result = await this.db.find({
        selector: {
          type: DOC_TYPES.ORGANIZATION
        }
      });
      return result.docs;
    } catch (error) {
      console.error('Error getting all organizations:', error);
      return [];
    }
  }

  /**
   * Get organizations by industry
   */
  async getOrganizationsByIndustry(industry) {
    await this.ensureInitialized();

    try {
      const result = await this.db.find({
        selector: {
          type: DOC_TYPES.ORGANIZATION,
          industry: industry
        }
      });
      return result.docs;
    } catch (error) {
      console.error('Error getting organizations by industry:', error);
      return [];
    }
  }

  /**
   * Check if organization name exists
   */
  async organizationExists(shortName) {
    const org = await this.getOrganizationByShortName(shortName);
    return org !== null;
  }

  /**
   * Get database info
   */
  async getDatabaseInfo() {
    await this.ensureInitialized();
    return this.db.info();
  }

  /**
   * Force sync (one-time replication)
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

      const remoteDb = new PouchDB(remote);

      // Push local changes to remote
      const pushResult = await this.db.replicate.to(remoteDb);
      console.log('Organization push sync:', pushResult.docs_written, 'docs written');

      // Pull remote changes to local
      const pullResult = await this.db.replicate.from(remoteDb);
      console.log('Organization pull sync:', pullResult.docs_written, 'docs written');

      return {
        pushed: pushResult.docs_written,
        pulled: pullResult.docs_written
      };
    } catch (error) {
      console.error('Error forcing organization sync:', error);
      throw error;
    }
  }

  /**
   * Cleanup
   */
  async close() {
    this.cancelSync();
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
    if (this.remoteDb) {
      await this.remoteDb.close();
      this.remoteDb = null;
    }
  }
}

// Create singleton instance
export const organizationPersistence = new OrganizationPersistence();

export default organizationPersistence;
