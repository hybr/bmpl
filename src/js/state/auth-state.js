/**
 * Authentication State Management
 */

import Store from './store.js';
import { EVENTS } from '../config/constants.js';

class AuthState extends Store {
  constructor() {
    super({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      accessToken: null,
      refreshToken: null
    });
  }

  /**
   * Set user and authentication state
   * @param {Object} user - User object
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   */
  setAuthenticated(user, accessToken, refreshToken) {
    this.setState({
      user,
      isAuthenticated: true,
      accessToken,
      refreshToken,
      loading: false,
      error: null
    });

    this.emitEvent(EVENTS.AUTH_STATE_CHANGED, {
      authenticated: true,
      user
    });
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.setState({ loading });
  }

  /**
   * Set error
   * @param {string} error - Error message
   */
  setError(error) {
    this.setState({
      error,
      loading: false
    });
  }

  /**
   * Clear error
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * Update user profile
   * @param {Object} updates - User updates
   */
  updateUser(updates) {
    const user = { ...this._state.user, ...updates };
    this.setState({ user });
  }

  /**
   * Update access token
   * @param {string} accessToken - New access token
   */
  updateAccessToken(accessToken) {
    this.setState({ accessToken });
  }

  /**
   * Logout - clear authentication state
   */
  logout() {
    this.setState({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      error: null,
      loading: false
    });

    this.emitEvent(EVENTS.AUTH_STATE_CHANGED, {
      authenticated: false,
      user: null
    });
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Is authenticated
   */
  isAuth() {
    return this._state.isAuthenticated && this._state.user !== null;
  }

  /**
   * Get current user
   * @returns {Object|null} User object
   */
  getUser() {
    return this._state.user;
  }

  /**
   * Get access token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    return this._state.accessToken;
  }

  /**
   * Get refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return this._state.refreshToken;
  }
}

// Export singleton instance
export const authState = new AuthState();

export default AuthState;
