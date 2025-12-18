/**
 * Mock Authentication Service
 * For development/testing without backend
 * Uses PouchDB for user persistence and sync to CouchDB
 */

import { authState } from '../state/auth-state.js';
import { storageService } from './storage-service.js';
import { userPersistence } from './user-persistence.js';

class MockAuthService {
  constructor() {
    this.delay = 500; // Simulate network delay (reduced for better UX)
    this.initialized = false;
  }

  /**
   * Initialize the auth service (connects to PouchDB)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await userPersistence.ensureInitialized();
      this.initialized = true;
      console.log('Mock auth service initialized with PouchDB');
    } catch (error) {
      console.error('Error initializing mock auth service:', error);
    }
  }

  /**
   * Setup user sync with CouchDB
   */
  async setupSync(remoteUrl, credentials = null) {
    await this.initialize();
    return userPersistence.setupSync(remoteUrl, credentials);
  }

  /**
   * Simulate network delay
   */
  async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  /**
   * Register new user (mock)
   * Stores user in PouchDB for persistence and sync
   */
  async register({ username, password, name, email, phone, securityQuestions }) {
    console.log('🔧 Mock: Registering user', { username, name, email });

    await this.initialize();
    authState.setLoading(true);

    try {
      await this.simulateDelay();

      // Check if username already exists
      const existingUser = await userPersistence.getUserByUsername(username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Create user in PouchDB
      const userData = {
        username,
        name,
        email: email || null,
        phone: phone || null,
        passwordHash: btoa(password), // Simple encoding for demo (NOT secure!)
        securityQuestions: securityQuestions.map(sq => ({
          questionId: sq.questionId,
          answerHash: btoa(sq.answer.toLowerCase().trim())
        }))
      };

      const savedUser = await userPersistence.createUser(userData);

      // Return user without sensitive data
      const user = {
        id: savedUser._id,
        username: savedUser.username,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        createdAt: savedUser.createdAt
      };

      authState.setLoading(false);

      console.log('✅ Mock: User registered successfully (stored in PouchDB)', user);

      return {
        user,
        message: 'Account created successfully! (Stored in PouchDB - will sync to CouchDB)'
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

    await this.initialize();
    authState.setLoading(true);

    try {
      await this.simulateDelay();

      const storedUser = await userPersistence.getUserByUsername(username);

      if (!storedUser || storedUser.passwordHash !== btoa(password)) {
        throw new Error('Invalid username or password');
      }

      // Generate mock tokens
      const accessToken = `mock_access_${Date.now()}`;
      const refreshToken = `mock_refresh_${Date.now()}`;

      // Create user object without sensitive data
      const user = {
        id: storedUser._id,
        username: storedUser.username,
        name: storedUser.name,
        email: storedUser.email,
        phone: storedUser.phone,
        createdAt: storedUser.createdAt
      };

      // Mock organizations
      const organizations = [
        {
          id: 'org_1',
          name: 'Demo Organization',
          role: 'owner', // Default, will be updated from membership
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

      // Initialize member data and get user's actual role
      try {
        const { memberService } = await import('./member-service.js');
        for (const org of organizations) {
          await memberService.getOrgMembers(org.id);
          const membership = await memberService.getCurrentUserMembership(org.id);
          if (membership) {
            org.role = membership.role;
            org.approvalLevel = membership.approvalLevel;
          }
        }
      } catch (err) {
        console.warn('Failed to initialize member data:', err);
      }

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

    await this.initialize();
    await this.simulateDelay();

    const storedUser = await userPersistence.getUserByUsername(username);

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

    await this.initialize();
    await this.simulateDelay();

    const storedUser = await userPersistence.getUserByUsername(username);

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

    await this.initialize();
    await this.simulateDelay();

    const storedUser = await userPersistence.getUserByUsername(username);

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

    await this.initialize();
    await this.simulateDelay();

    // Extract username from token (in real app, token would be validated)
    if (!resetToken.startsWith('mock_reset_')) {
      throw new Error('Invalid or expired reset token');
    }

    const username = resetToken.split('_').pop();
    const storedUser = await userPersistence.getUserByUsername(username);

    if (!storedUser) {
      throw new Error('Invalid reset token');
    }

    // Update password in PouchDB
    await userPersistence.updatePassword(username, btoa(newPassword));

    console.log('✅ Mock: Password reset successfully (updated in PouchDB)');

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
