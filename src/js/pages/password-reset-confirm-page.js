/**
 * Password Reset Confirmation Page
 * Set new password with reset token
 */

import { router } from '../router.js';
import { authService } from '../services/auth-service-wrapper.js';
import { validatePassword, validatePasswordConfirmation } from '../utils/validators.js';
import { ROUTES } from '../config/constants.js';

class PasswordResetConfirmPage {
  constructor(params = {}) {
    this.params = params;
    this.resetToken = this.extractTokenFromURL();
    this.errors = {};
  }

  /**
   * Extract reset token from URL
   */
  extractTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || '';
  }

  /**
   * Render the page
   * @returns {HTMLElement} Page element
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'page-container auth-page';

    // If no token, show error
    if (!this.resetToken) {
      container.innerHTML = `
        <ion-header>
          <ion-toolbar>
            <ion-title>Reset Password</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div style="max-width: 500px; margin: 0 auto; padding: 20px 16px; min-height: 100%; display: flex; flex-direction: column; justify-content: center;">
            <div class="card" style="text-align: center;">
              <ion-icon name="alert-circle" style="font-size: 64px; color: #dc3545; margin-bottom: 16px;"></ion-icon>
              <h2 style="margin-bottom: 8px;">Invalid Reset Link</h2>
              <p style="color: #666; margin-bottom: 24px;">
                This password reset link is invalid or has expired. Please request a new password reset.
              </p>
              <ion-button href="/password-reset" data-link expand="block">
                Request Password Reset
              </ion-button>
              <ion-button href="/login" data-link fill="outline" expand="block" style="margin-top: 12px;">
                Back to Login
              </ion-button>
            </div>
          </div>
        </ion-content>
      `;
      return container;
    }

    // Valid token, show password reset form
    container.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title>Reset Password</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div style="max-width: 500px; margin: 0 auto; padding: 20px 16px; min-height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div class="card">
            <h2 style="margin-bottom: 8px;">Set New Password</h2>
            <p style="color: #666; margin-bottom: 24px;">
              Please enter your new password below.
            </p>

            <form id="reset-password-form">
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  class="form-input"
                  placeholder="Enter new password"
                  required
                  autocomplete="new-password"
                />
                <div class="form-hint">At least 8 characters with uppercase, lowercase, and numbers</div>
                <div id="password-error" class="form-error hidden"></div>
              </div>

              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  class="form-input"
                  placeholder="Re-enter new password"
                  required
                  autocomplete="new-password"
                />
                <div id="confirmPassword-error" class="form-error hidden"></div>
              </div>

              <div id="general-error" class="form-error hidden" style="margin-bottom: 16px;"></div>

              <ion-button id="submit-btn" expand="block" type="submit">
                Reset Password
              </ion-button>
            </form>

            <div style="margin-top: 16px; text-align: center;">
              <a href="/login" data-link style="color: var(--app-primary); text-decoration: none; font-size: 14px;">
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </ion-content>
    `;

    return container;
  }

  /**
   * Called after the page is mounted to the DOM
   */
  async mounted() {
    if (!this.resetToken) {
      return; // No need to setup listeners if there's no token
    }

    const form = document.getElementById('reset-password-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSubmit();
      });
    }

    // Real-time validation
    if (passwordInput) {
      passwordInput.addEventListener('blur', () => {
        this.validateField('password', passwordInput.value);
      });
    }

    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('blur', () => {
        this.validateField('confirmPassword', confirmPasswordInput.value);
      });
    }
  }

  /**
   * Validate a single field
   */
  validateField(fieldName, value) {
    let result;

    switch (fieldName) {
      case 'password':
        result = validatePassword(value);
        break;
      case 'confirmPassword':
        const password = document.getElementById('password')?.value || '';
        result = validatePasswordConfirmation(password, value);
        break;
      default:
        return true;
    }

    const errorDiv = document.getElementById(`${fieldName}-error`);
    if (errorDiv) {
      if (result.valid) {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
        delete this.errors[fieldName];
      } else {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = result.error;
        this.errors[fieldName] = result.error;
      }
    }

    return result.valid;
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submit-btn');
    const generalError = document.getElementById('general-error');

    // Validate inputs
    const passwordValid = this.validateField('password', passwordInput.value);
    const confirmPasswordValid = this.validateField('confirmPassword', confirmPasswordInput.value);

    if (!passwordValid || !confirmPasswordValid) {
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting Password...';
    generalError.classList.add('hidden');
    generalError.textContent = '';

    try {
      const newPassword = passwordInput.value;

      // Call auth service to reset password
      const message = await authService.resetPassword(this.resetToken, newPassword);

      // Show success message
      alert(message || 'Password reset successfully! You can now login with your new password.');

      // Redirect to login
      await router.navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Password reset error:', error);

      // Show error
      generalError.classList.remove('hidden');

      // Check if token is expired/invalid
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        generalError.innerHTML = `
          ${error.message || 'Password reset failed. The link may have expired.'}
          <div style="margin-top: 12px;">
            <a href="/password-reset" data-link style="color: var(--app-primary); text-decoration: underline;">
              Request a new reset link
            </a>
          </div>
        `;
      } else {
        generalError.textContent = error.message || 'Password reset failed. Please try again.';
      }

      // Reset button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reset Password';
    }
  }
}

export default PasswordResetConfirmPage;
