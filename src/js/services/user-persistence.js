/**
 * User Persistence Service
 * Handles storing and syncing user data with PouchDB/CouchDB
 */

import { DOC_TYPES, COUCHDB_CONFIG } from '../config/constants.js';
import { getPouchDB } from './pouchdb-init.js';
import { apiClient } from '../utils/api-client.js';

// PouchDB reference (set after initialization)
let PouchDB = null;

class UserPersistence {
  constructor() {
    this.db = null;
    this.remoteDb = null;
    this.syncHandler = null;
    this.initPromise = null;
    this.dbName = 'bmpl_users';
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
   * Initialize the user database
   */
  async initialize() {
    // Get shared PouchDB instance
    PouchDB = await getPouchDB();

    try {
      // Create local database
      this.db = new PouchDB(this.dbName);

      // Create indexes
      await this.createIndexes();

      console.log('User database initialized');
    } catch (error) {
      console.error('Error initializing user database:', error);
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
        index: { fields: ['type', 'username'] }
      });

      await this.db.createIndex({
        index: { fields: ['type', 'email'] }
      });

      await this.db.createIndex({
        index: { fields: ['type', 'phone'] }
      });

      await this.db.createIndex({
        index: { fields: ['type', 'name'] }
      });

      console.log('User database indexes created');
    } catch (error) {
      console.error('Error creating user indexes:', error);
    }
  }

  /**
   * Setup filtered sync with CouchDB
   * Only syncs the current user's document
   * @param {string} remoteUrl - CouchDB remote URL
   * @param {Object} credentials - { username, password }
   * @param {string} currentUsername - Current user's username for filtering
   */
  async setupSync(remoteUrl, credentials = null, currentUsername = null) {
    await this.ensureInitialized();

    if (!currentUsername) {
      console.warn('⚠️ No current username provided - user sync requires currentUsername for filtering');
      return false;
    }

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

      // Start FILTERED bidirectional sync
      // Only sync current user's document
      this.syncHandler = this.db.sync(this.remoteDb, {
        live: true,
        retry: true,
        filter: (doc) => {
          // Only sync current user's document
          return doc._id === `user:${currentUsername}`;
        }
      });

      this.syncHandler.on('change', (info) => {
        console.log('User sync change:', info.direction, info.change.docs_written, 'docs');
      });

      this.syncHandler.on('error', (err) => {
        console.error('User sync error:', err);
      });

      this.syncHandler.on('paused', (err) => {
        if (err) {
          console.warn('User sync paused with error:', err);
        } else {
          console.log('User sync paused (up to date)');
        }
      });

      console.log(`✅ User sync started (filtered to user: ${currentUsername})`);
      return true;
    } catch (error) {
      console.error('Error setting up user sync:', error);
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
   * Create a new user
   */
  async createUser(userData) {
    await this.ensureInitialized();

    const user = {
      _id: `user:${userData.username}`,
      type: DOC_TYPES.USER,
      username: userData.username,
      name: userData.name,
      email: userData.email || null,
      phone: userData.phone || null,
      passwordHash: userData.passwordHash,
      securityQuestions: userData.securityQuestions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const result = await this.db.put(user);
      user._rev = result.rev;
      console.log('User created:', user.username);
      return user;
    } catch (error) {
      if (error.status === 409) {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username) {
    await this.ensureInitialized();

    try {
      const user = await this.db.get(`user:${username}`);
      return user;
    } catch (error) {
      if (error.name === 'not_found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    await this.ensureInitialized();

    try {
      const result = await this.db.find({
        selector: {
          type: DOC_TYPES.USER,
          email: email
        }
      });
      return result.docs[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(username, updates) {
    await this.ensureInitialized();

    try {
      const user = await this.db.get(`user:${username}`);

      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const result = await this.db.put(updatedUser);
      updatedUser._rev = result.rev;

      console.log('User updated:', username);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(username, newPasswordHash) {
    return this.updateUser(username, { passwordHash: newPasswordHash });
  }

  /**
   * Delete user
   */
  async deleteUser(username) {
    await this.ensureInitialized();

    try {
      const user = await this.db.get(`user:${username}`);
      await this.db.remove(user);
      console.log('User deleted:', username);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    await this.ensureInitialized();

    try {
      const result = await this.db.find({
        selector: {
          type: DOC_TYPES.USER
        }
      });
      return result.docs;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Search users via backend API
   * Used for user lookups when not all users are synced locally
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.limit - Max results to return
   * @returns {Promise<Array>} Array of user objects
   */
  async searchUsers(query, options = {}) {
    try {
      const response = await apiClient.post('/api/users/search', {
        query,
        limit: options.limit || 10
      });
      return response.users || [];
    } catch (error) {
      console.error('Error searching users via API:', error);
      // Fallback to local search if API fails
      return this.searchUsersLocal(query, options);
    }
  }

  /**
   * Search users locally in PouchDB
   * Fallback when API is unavailable (offline mode)
   * Note: Will only contain current user due to filtered sync
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of user objects
   */
  async searchUsersLocal(query, options = {}) {
    await this.ensureInitialized();

    try {
      const allUsers = await this.getAllUsers();
      const lowerQuery = query.toLowerCase();

      return allUsers
        .filter(user => {
          const searchStr = [
            user.username || '',
            user.email || '',
            user.name || ''
          ].join(' ').toLowerCase();
          return searchStr.includes(lowerQuery);
        })
        .slice(0, options.limit || 10);
    } catch (error) {
      console.error('Error searching users locally:', error);
      return [];
    }
  }

  /**
   * Check if username exists
   */
  async usernameExists(username) {
    const user = await this.getUserByUsername(username);
    return user !== null;
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
      console.log('User push sync:', pushResult.docs_written, 'docs written');

      // Pull remote changes to local
      const pullResult = await this.db.replicate.from(remoteDb);
      console.log('User pull sync:', pullResult.docs_written, 'docs written');

      return {
        pushed: pushResult.docs_written,
        pulled: pullResult.docs_written
      };
    } catch (error) {
      console.error('Error forcing user sync:', error);
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
export const userPersistence = new UserPersistence();

export default userPersistence;
