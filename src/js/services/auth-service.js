/**
 * Authentication Service
 * Handles user registration, login, and password reset
 */

import ENV from '../config/env.js';
import { authState } from '../state/auth-state.js';
import { storageService } from './storage-service.js';
import { dbManager } from './db-manager.js';
import { mockAuthService } from './mock-auth-service.js';

class AuthService {
  constructor() {
    this.authApiUrl = ENV.AUTH_API_URL;
    this.useMockMode = ENV.DEBUG; // Use mock mode in development
    this.backendAvailable = null; // Will check on first request
  }

  /**
   * Check if backend is available
   */
  async checkBackendAvailability() {
    if (this.backendAvailable !== null) {
      return this.backendAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      await fetch(`${this.authApiUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.backendAvailable = true;
      console.log('✅ Backend server is available');
      return true;
    } catch (error) {
      this.backendAvailable = false;
      console.warn('⚠️ Backend server not available, using mock mode');
      return false;
    }
  }

  /**
   * Get the appropriate service (real or mock)
   */
  async getService() {
    if (this.useMockMode) {
      console.log('🔧 Development mode: Using mock auth service');
      return mockAuthService;
    }

    const available = await this.checkBackendAvailability();
    if (!available) {
      console.log('🔧 Fallback: Using mock auth service (backend unavailable)');
      return mockAuthService;
    }

    return this; // Use real service
  }

  /**
   * Register new user
   * @param {Object} data - Registration data
   * @param {string} data.username - Username
   * @param {string} data.password - Password
   * @param {string} data.name - Display name
   * @param {string} data.email - Optional email
   * @param {string} data.phone - Optional phone
   * @param {Array} data.securityQuestions - Array of { questionId, answer }
   * @returns {Promise<Object>} Created user
   */
  async register({ username, password, name, email, phone, securityQuestions }) {
    authState.setLoading(true);

    try {
      const response = await fetch(`${this.authApiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          name,
          email,
          phone,
          securityQuestions
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const { user, message } = await response.json();

      authState.setLoading(false);
      return { user, message };
    } catch (error) {
      authState.setError(error.message);
      authState.setLoading(false);
      throw error;
    }
  }

  /**
   * Login with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} User and tokens
   */
  async login(username, password) {
    authState.setLoading(true);

    try {
      const response = await fetch(`${this.authApiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid username or password');
      }

      const { accessToken, refreshToken, user, organizations } = await response.json();

      // Store tokens and user
      await storageService.setAccessToken(accessToken);
      await storageService.setRefreshToken(refreshToken);
      await storageService.setUser(user);

      // Get CouchDB credentials and initialize databases
      try {
        const couchDBCreds = await this.getCouchDBCredentials(accessToken, organizations);
        await storageService.setCouchDBCredentials(couchDBCreds);
        await this.initializeDatabases(user, organizations, couchDBCreds);
      } catch (dbError) {
        console.warn('Database initialization skipped:', dbError.message);
        // Continue without database - Phase 2 feature, not critical for login
      }

      // Update auth state
      authState.setAuthenticated(user, accessToken, refreshToken);

      return { user, organizations };
    } catch (error) {
      authState.setError(error.message);
      authState.setLoading(false);
      throw error;
    }
  }

  /**
   * Request password reset via email
   * @param {string} username - Username
   * @returns {Promise<string>} Success message
   */
  async requestPasswordResetEmail(username) {
    const response = await fetch(`${this.authApiUrl}/password-reset/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset request failed');
    }

    const { message } = await response.json();
    return message;
  }

  /**
   * Get security questions for a username
   * @param {string} username - Username
   * @returns {Promise<Array>} Security questions (without answers)
   */
  async getSecurityQuestions(username) {
    const response = await fetch(`${this.authApiUrl}/password-reset/questions?username=${encodeURIComponent(username)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch security questions');
    }

    const { questions } = await response.json();
    return questions; // Array of { questionId, text }
  }

  /**
   * Verify security question answers
   * @param {string} username - Username
   * @param {Array} answers - Array of { questionId, answer }
   * @returns {Promise<string>} Reset token
   */
  async verifySecurityAnswers(username, answers) {
    const response = await fetch(`${this.authApiUrl}/password-reset/verify-answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, answers })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid answers');
    }

    const { resetToken } = await response.json();
    return resetToken;
  }

  /**
   * Reset password with token
   * @param {string} resetToken - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<string>} Success message
   */
  async resetPassword(resetToken, newPassword) {
    const response = await fetch(`${this.authApiUrl}/password-reset/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }

    const { message } = await response.json();
    return message;
  }

  /**
   * Refresh access token
   * @returns {Promise<string>} New access token
   */
  async refreshAccessToken() {
    const refreshToken = await storageService.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.authApiUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      // Refresh token invalid, logout user
      await this.logout();
      throw new Error('Session expired. Please login again.');
    }

    const { accessToken } = await response.json();

    // Update stored token
    await storageService.setAccessToken(accessToken);
    authState.updateAccessToken(accessToken);

    return accessToken;
  }

  /**
   * Logout
   */
  async logout() {
    try {
      // Call logout endpoint (optional, for token invalidation)
      const accessToken = await storageService.getAccessToken();
      if (accessToken) {
        try {
          await fetch(`${this.authApiUrl}/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
        } catch (error) {
          console.warn('Logout API call failed:', error);
          // Continue with local logout anyway
        }
      }

      // Clear local storage
      await storageService.clearAuthData();

      // Clear databases (if database manager exists)
      try {
        // Dynamic import to avoid errors if db-manager doesn't exist yet
        const { dbManager } = await import('./db-manager.js');
        if (dbManager && dbManager.destroyAllDatabases) {
          await dbManager.destroyAllDatabases();
        }
      } catch (error) {
        console.warn('Database cleanup skipped:', error.message);
        // Continue without database cleanup - Phase 2 feature
      }

      // Update state
      authState.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      authState.logout();
    }
  }

  /**
   * Exchange JWT for CouchDB credentials
   * @param {string} accessToken - JWT access token
   * @param {Array} organizations - User's organizations
   * @returns {Promise<Object>} CouchDB credentials
   */
  async getCouchDBCredentials(accessToken, organizations) {
    const response = await fetch(`${this.authApiUrl}/couchdb-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ organizations })
    });

    if (!response.ok) {
      throw new Error('Failed to get CouchDB credentials');
    }

    return response.json();
  }

  /**
   * Initialize PouchDB databases
   * @param {Object} user - User object
   * @param {Array} organizations - Organizations
   * @param {Object} couchDBCreds - CouchDB credentials
   */
  async initializeDatabases(user, organizations, couchDBCreds) {
    // Dynamic import to avoid errors if db-manager doesn't exist yet
    const { dbManager } = await import('./db-manager.js');

    // Initialize shared DB
    await dbManager.initSharedDB();

    // Initialize first organization DB
    if (organizations.length > 0) {
      const firstOrg = organizations[0];
      await dbManager.initOrgDB(
        firstOrg.id,
        firstOrg.isSharded,
        firstOrg.shardNumber
      );
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return authState.isAuth();
  }

  /**
   * Get current user
   * @returns {Object|null}
   */
  getCurrentUser() {
    return authState.getUser();
  }
}

// Export singleton instance
export const authService = new AuthService();

export default AuthService;
