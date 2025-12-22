/**
 * Login Page
 * Username-based authentication
 */

import { authService } from '../services/auth-service-wrapper.js';
import { validateUsername, validateRequired } from '../utils/validators.js';

class LoginPage {
  constructor(params = {}) {
    this.params = params;
    this.errors = {};
  }

  /**
   * Render the page
   * @returns {HTMLElement} Page element
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'page-container auth-page';
    container.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title>Login</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div style="max-width: 500px; margin: 0 auto; padding: 20px 16px; min-height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div style="margin-bottom: 32px; text-align: center;">
            <h1 style="margin-bottom: 8px; font-size: 32px; font-weight: 700; color: var(--app-primary);">V4L</h1>
            <p style="color: #666; margin: 0; font-size: 15px;">
              Connecting Local Businesses & Customers
            </p>
          </div>

          <div class="card">
            <div class="card-body">
              <form id="login-form">
                <div class="mb-3">
                  <label class="form-label">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    class="form-control"
                    placeholder="Enter your username"
                    required
                    autocomplete="username"
                  />
                  <div id="username-error" class="invalid-feedback d-none"></div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    class="form-control"
                    placeholder="Enter your password"
                    required
                    autocomplete="current-password"
                  />
                  <div id="password-error" class="invalid-feedback d-none"></div>
                </div>

                <div id="general-error" class="invalid-feedback d-none" style="margin-bottom: 16px;"></div>

                <ion-button id="login-btn" expand="block" type="submit">
                  Login
                </ion-button>
              </form>

              <div style="margin-top: 16px; text-align: center;">
                <a href="/password-reset" data-link style="color: var(--app-primary); text-decoration: none; font-size: 14px;">
                  Forgot password?
                </a>
              </div>

              <div style="margin-top: 16px; text-align: center;">
                <span style="font-size: 14px; color: #666;">Don't have an account? </span>
                <a href="/register" data-link style="color: var(--app-primary); text-decoration: none; font-size: 14px;">
                  Sign up
                </a>
              </div>
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
    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }

    // Real-time validation
    if (usernameInput) {
      usernameInput.addEventListener('blur', () => {
        this.validateField('username', usernameInput.value);
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('blur', () => {
        this.validateField('password', passwordInput.value);
      });
    }
  }

  /**
   * Validate a single field
   */
  validateField(fieldName, value) {
    let result;

    switch (fieldName) {
      case 'username':
        result = validateUsername(value);
        break;
      case 'password':
        result = validateRequired(value, 'Password');
        break;
      default:
        return;
    }

    const errorDiv = document.getElementById(`${fieldName}-error`);
    if (errorDiv) {
      if (result.valid) {
        errorDiv.classList.add('d-none');
        errorDiv.textContent = '';
        delete this.errors[fieldName];
      } else {
        errorDiv.classList.remove('d-none');
        errorDiv.textContent = result.error;
        this.errors[fieldName] = result.error;
      }
    }

    return result.valid;
  }

  /**
   * Handle login form submission
   */
  async handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const generalError = document.getElementById('general-error');

    // Validate inputs
    const usernameValid = this.validateField('username', usernameInput.value);
    const passwordValid = this.validateField('password', passwordInput.value);

    if (!usernameValid || !passwordValid) {
      return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    generalError.classList.add('d-none');
    generalError.textContent = '';

    try {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      // Call auth service
      await authService.login(username, password);

      // Success - router will handle redirect to dashboard
      // (via event listener in app.js)
    } catch (error) {
      console.error('Login error:', error);

      // Show error
      generalError.classList.remove('d-none');
      generalError.textContent = error.message || 'Login failed. Please try again.';

      // Reset button
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  }
}

export default LoginPage;
