/**
 * Storage Service
 * Wrapper around Capacitor Preferences for secure local storage
 */

import { Preferences } from '@capacitor/preferences';
import { STORAGE_KEYS } from '../config/constants.js';

class StorageService {
  /**
   * Set a value in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON stringified)
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      const stringValue = JSON.stringify(value);
      await Preferences.set({ key, value: stringValue });
    } catch (error) {
      console.error(`Error setting storage key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Get a value from storage
   * @param {string} key - Storage key
   * @returns {Promise<*|null>} Stored value or null if not found
   */
  async get(key) {
    try {
      const { value } = await Preferences.get({ key });

      if (value === null) return null;

      return JSON.parse(value);
    } catch (error) {
      console.error(`Error getting storage key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove a value from storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Check if a key exists
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }

  // Authentication-specific methods

  /**
   * Set access token
   * @param {string} token - Access token
   * @returns {Promise<void>}
   */
  async setAccessToken(token) {
    return this.set(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Get access token
   * @returns {Promise<string|null>}
   */
  async getAccessToken() {
    return this.get(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Set refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<void>}
   */
  async setRefreshToken(token) {
    return this.set(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  /**
   * Get refresh token
   * @returns {Promise<string|null>}
   */
  async getRefreshToken() {
    return this.get(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Set user data
   * @param {Object} user - User object
   * @returns {Promise<void>}
   */
  async setUser(user) {
    return this.set(STORAGE_KEYS.USER, user);
  }

  /**
   * Get user data
   * @returns {Promise<Object|null>}
   */
  async getUser() {
    return this.get(STORAGE_KEYS.USER);
  }

  /**
   * Set CouchDB credentials
   * @param {Object} credentials - CouchDB credentials by org ID
   * @returns {Promise<void>}
   */
  async setCouchDBCredentials(credentials) {
    return this.set(STORAGE_KEYS.COUCHDB_CREDENTIALS, credentials);
  }

  /**
   * Get CouchDB credentials
   * @returns {Promise<Object|null>}
   */
  async getCouchDBCredentials() {
    return this.get(STORAGE_KEYS.COUCHDB_CREDENTIALS);
  }

  /**
   * Set active organization ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<void>}
   */
  async setActiveOrgId(orgId) {
    return this.set(STORAGE_KEYS.ACTIVE_ORG_ID, orgId);
  }

  /**
   * Get active organization ID
   * @returns {Promise<string|null>}
   */
  async getActiveOrgId() {
    return this.get(STORAGE_KEYS.ACTIVE_ORG_ID);
  }

  /**
   * Set app settings
   * @param {Object} settings - App settings
   * @returns {Promise<void>}
   */
  async setAppSettings(settings) {
    return this.set(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  /**
   * Get app settings
   * @returns {Promise<Object|null>}
   */
  async getAppSettings() {
    return this.get(STORAGE_KEYS.APP_SETTINGS);
  }

  /**
   * Clear all auth data
   * @returns {Promise<void>}
   */
  async clearAuthData() {
    await this.remove(STORAGE_KEYS.ACCESS_TOKEN);
    await this.remove(STORAGE_KEYS.REFRESH_TOKEN);
    await this.remove(STORAGE_KEYS.USER);
    await this.remove(STORAGE_KEYS.COUCHDB_CREDENTIALS);
    await this.remove(STORAGE_KEYS.ACTIVE_ORG_ID);
  }
}

// Export singleton instance
export const storageService = new StorageService();

export default StorageService;
