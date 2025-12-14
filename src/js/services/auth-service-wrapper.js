/**
 * Auth Service Wrapper
 * Automatically uses mock service when backend is unavailable
 */

import { authService as realAuthService } from './auth-service.js';
import { mockAuthService } from './mock-auth-service.js';
import ENV from '../config/env.js';

class AuthServiceWrapper {
  constructor() {
    this.backendChecked = false;
    this.useRealService = false;
  }

  /**
   * Check if backend is available (only once)
   */
  async checkBackend() {
    if (this.backendChecked) {
      return this.useRealService;
    }

    // Always use mock in development mode
    if (ENV.DEBUG) {
      console.log('🔧 Development mode: Using mock auth service');
      this.backendChecked = true;
      this.useRealService = false;
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${realAuthService.authApiUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Backend server is available');
        this.useRealService = true;
      } else {
        console.warn('⚠️ Backend server returned error, using mock mode');
        this.useRealService = false;
      }
    } catch (error) {
      console.warn('⚠️ Backend server not available, using mock mode');
      this.useRealService = false;
    }

    this.backendChecked = true;
    return this.useRealService;
  }

  /**
   * Get the service to use
   */
  async getService() {
    await this.checkBackend();
    return this.useRealService ? realAuthService : mockAuthService;
  }

  /**
   * Register new user
   */
  async register(data) {
    const service = await this.getService();
    return service.register(data);
  }

  /**
   * Login
   */
  async login(username, password) {
    const service = await this.getService();
    return service.login(username, password);
  }

  /**
   * Request password reset via email
   */
  async requestPasswordResetEmail(username) {
    const service = await this.getService();
    return service.requestPasswordResetEmail(username);
  }

  /**
   * Get security questions
   */
  async getSecurityQuestions(username) {
    const service = await this.getService();
    return service.getSecurityQuestions(username);
  }

  /**
   * Verify security answers
   */
  async verifySecurityAnswers(username, answers) {
    const service = await this.getService();
    return service.verifySecurityAnswers(username, answers);
  }

  /**
   * Reset password
   */
  async resetPassword(resetToken, newPassword) {
    const service = await this.getService();
    return service.resetPassword(resetToken, newPassword);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    const service = await this.getService();
    return service.refreshAccessToken();
  }

  /**
   * Logout
   */
  async logout() {
    const service = await this.getService();
    return service.logout();
  }

  /**
   * Get CouchDB credentials
   */
  async getCouchDBCredentials(accessToken, organizations) {
    const service = await this.getService();
    if (service.getCouchDBCredentials) {
      return service.getCouchDBCredentials(accessToken, organizations);
    }
    return null;
  }

  /**
   * Initialize databases
   */
  async initializeDatabases(user, organizations, couchDBCreds) {
    const service = await this.getService();
    if (service.initializeDatabases) {
      return service.initializeDatabases(user, organizations, couchDBCreds);
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return realAuthService.isAuthenticated();
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return realAuthService.getCurrentUser();
  }
}

// Export singleton
export const authService = new AuthServiceWrapper();
export default authService;
