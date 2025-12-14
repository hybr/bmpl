/**
 * Mock Authentication Service
 * For development/testing without backend
 */

import { authState } from '../state/auth-state.js';
import { storageService } from './storage-service.js';

class MockAuthService {
  constructor() {
    this.mockUsers = new Map(); // Store mock users in memory
    this.delay = 1000; // Simulate network delay
  }

  /**
   * Simulate network delay
   */
  async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  /**
   * Register new user (mock)
   */
  async register({ username, password, name, email, phone, securityQuestions }) {
    console.log('🔧 Mock: Registering user', { username, name, email });

    authState.setLoading(true);

    try {
      await this.simulateDelay();

      // Check if username already exists
      if (this.mockUsers.has(username)) {
        throw new Error('Username already exists');
      }

      // Create mock user
      const user = {
        id: `user_${Date.now()}`,
        username,
        name,
        email: email || null,
        phone: phone || null,
        createdAt: new Date().toISOString(),
        securityQuestions: securityQuestions.map(sq => ({
          questionId: sq.questionId,
          // In real backend, answers would be hashed
          answerHash: btoa(sq.answer.toLowerCase().trim())
        }))
      };

      // Store user (in real app, this would be in database)
      this.mockUsers.set(username, {
        ...user,
        passwordHash: btoa(password) // Simple encoding for demo (NOT secure!)
      });

      authState.setLoading(false);

      console.log('✅ Mock: User registered successfully', user);

      return {
        user,
        message: 'Account created successfully! (Mock Mode - No backend required)'
      };
    } catch (error) {
      authState.setError(error.message);
      authState.setLoading(false);
      throw error;
    }
  }

  /**
   * Login with username and password (mock)
   */
  async login(username, password) {
    console.log('🔧 Mock: Logging in user', username);

    authState.setLoading(true);

    try {
      await this.simulateDelay();

      const storedUser = this.mockUsers.get(username);

      if (!storedUser || storedUser.passwordHash !== btoa(password)) {
        throw new Error('Invalid username or password');
      }

      // Generate mock tokens
      const accessToken = `mock_access_${Date.now()}`;
      const refreshToken = `mock_refresh_${Date.now()}`;

      // Remove password hash from user object
      const { passwordHash, ...user } = storedUser;

      // Mock organizations
      const organizations = [
        {
          id: 'org_1',
          name: 'Demo Organization',
          role: 'owner',
          isSharded: false,
          shardNumber: null
        }
      ];

      // Store tokens and user
      await storageService.setAccessToken(accessToken);
      await storageService.setRefreshToken(refreshToken);
      await storageService.setUser(user);

      // Update auth state
      authState.setAuthenticated(user, accessToken, refreshToken);

      console.log('✅ Mock: Login successful', { user, organizations });

      return { user, organizations };
    } catch (error) {
      authState.setError(error.message);
      authState.setLoading(false);
      throw error;
    }
  }

  /**
   * Request password reset via email (mock)
   */
  async requestPasswordResetEmail(username) {
    console.log('🔧 Mock: Password reset email requested for', username);

    await this.simulateDelay();

    const storedUser = this.mockUsers.get(username);

    if (!storedUser) {
      throw new Error('User not found');
    }

    if (!storedUser.email) {
      throw new Error('No email associated with this account. Please use security questions.');
    }

    console.log('✅ Mock: Password reset email sent (simulated)');

    return `Password reset link sent to ${storedUser.email} (Mock Mode)`;
  }

  /**
   * Get security questions for a username (mock)
   */
  async getSecurityQuestions(username) {
    console.log('🔧 Mock: Fetching security questions for', username);

    await this.simulateDelay();

    const storedUser = this.mockUsers.get(username);

    if (!storedUser) {
      throw new Error('User not found');
    }

    if (!storedUser.securityQuestions || storedUser.securityQuestions.length === 0) {
      throw new Error('No security questions configured for this account');
    }

    // Import constants to get question text
    const { SECURITY_QUESTIONS } = await import('../config/constants.js');

    const questions = storedUser.securityQuestions.map(sq => {
      const question = SECURITY_QUESTIONS.find(q => q.id === sq.questionId);
      return {
        questionId: sq.questionId,
        text: question ? question.text : 'Unknown question'
      };
    });

    console.log('✅ Mock: Security questions retrieved', questions);

    return questions;
  }

  /**
   * Verify security question answers (mock)
   */
  async verifySecurityAnswers(username, answers) {
    console.log('🔧 Mock: Verifying security answers for', username);

    await this.simulateDelay();

    const storedUser = this.mockUsers.get(username);

    if (!storedUser) {
      throw new Error('User not found');
    }

    // Verify answers
    for (const answer of answers) {
      const storedQuestion = storedUser.securityQuestions.find(
        sq => sq.questionId === answer.questionId
      );

      if (!storedQuestion) {
        throw new Error('Invalid security question');
      }

      const answerHash = btoa(answer.answer.toLowerCase().trim());
      if (storedQuestion.answerHash !== answerHash) {
        throw new Error('Incorrect answer. Please try again.');
      }
    }

    // Generate mock reset token
    const resetToken = `mock_reset_${Date.now()}_${username}`;

    console.log('✅ Mock: Security answers verified, token generated');

    return resetToken;
  }

  /**
   * Reset password with token (mock)
   */
  async resetPassword(resetToken, newPassword) {
    console.log('🔧 Mock: Resetting password with token');

    await this.simulateDelay();

    // Extract username from token (in real app, token would be validated)
    if (!resetToken.startsWith('mock_reset_')) {
      throw new Error('Invalid or expired reset token');
    }

    const username = resetToken.split('_').pop();
    const storedUser = this.mockUsers.get(username);

    if (!storedUser) {
      throw new Error('Invalid reset token');
    }

    // Update password
    storedUser.passwordHash = btoa(newPassword);
    this.mockUsers.set(username, storedUser);

    console.log('✅ Mock: Password reset successfully');

    return 'Password reset successfully! You can now login with your new password. (Mock Mode)';
  }

  /**
   * Refresh access token (mock)
   */
  async refreshAccessToken() {
    console.log('🔧 Mock: Refreshing access token');

    const refreshToken = await storageService.getRefreshToken();

    if (!refreshToken || !refreshToken.startsWith('mock_refresh_')) {
      throw new Error('Invalid refresh token');
    }

    await this.simulateDelay();

    // Generate new mock access token
    const accessToken = `mock_access_${Date.now()}`;

    // Update stored token
    await storageService.setAccessToken(accessToken);
    authState.updateAccessToken(accessToken);

    console.log('✅ Mock: Access token refreshed');

    return accessToken;
  }

  /**
   * Logout (mock)
   */
  async logout() {
    console.log('🔧 Mock: Logging out');

    try {
      // Clear local storage
      await storageService.clearAuthData();

      // Update state
      authState.logout();

      console.log('✅ Mock: Logout successful');
    } catch (error) {
      console.error('Mock logout error:', error);
      authState.logout();
    }
  }

  /**
   * Get CouchDB credentials (mock)
   */
  async getCouchDBCredentials(accessToken, organizations) {
    console.log('🔧 Mock: Getting CouchDB credentials (simulated)');

    await this.simulateDelay();

    return {
      username: 'mock_couch_user',
      password: 'mock_couch_pass',
      databases: organizations.map(org => `v4l_org_${org.id}`)
    };
  }

  /**
   * Initialize databases (mock)
   */
  async initializeDatabases(user, organizations, couchDBCreds) {
    console.log('🔧 Mock: Initializing databases (simulated)');
    // No actual database initialization in mock mode
    return Promise.resolve();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return authState.isAuth();
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return authState.getUser();
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService();

export default MockAuthService;
