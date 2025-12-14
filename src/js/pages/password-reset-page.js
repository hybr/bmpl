/**
 * Password Reset Page
 * Supports both email and security questions methods
 */

import { router } from '../router.js';
import { authService } from '../services/auth-service-wrapper.js';
import { validateUsername, validateSecurityAnswer } from '../utils/validators.js';
import { RESET_QUESTIONS_REQUIRED, ROUTES_AUTH } from '../config/constants.js';

class PasswordResetPage {
  constructor(params = {}) {
    this.params = params;
    this.currentStep = 1; // 1: username, 2: method selection, 3: security questions
    this.username = '';
    this.securityQuestions = [];
    this.resetToken = '';
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
          <ion-buttons slot="start">
            <ion-back-button default-href="/login"></ion-back-button>
          </ion-buttons>
          <ion-title>Reset Password</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div style="max-width: 500px; margin: 0 auto; padding: 20px 16px; min-height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div class="card">
            <!-- Step 1: Enter Username -->
            <div id="step-1" class="reset-step">
              <h2 style="margin-bottom: 8px;">Forgot your password?</h2>
              <p style="color: #666; margin-bottom: 24px;">
                Enter your username and we'll help you reset your password.
              </p>

              <form id="username-form">
                <div class="form-group">
                  <label class="form-label">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    class="form-input"
                    placeholder="Enter your username"
                    required
                    autocomplete="username"
                  />
                  <div id="username-error" class="form-error hidden"></div>
                </div>

                <div id="username-general-error" class="form-error hidden" style="margin-bottom: 16px;"></div>

                <ion-button id="username-submit-btn" expand="block" type="submit">
                  Continue
                </ion-button>
              </form>
            </div>

            <!-- Step 2: Method Selection -->
            <div id="step-2" class="reset-step" style="display: none;">
              <h2 style="margin-bottom: 8px;">Choose Reset Method</h2>
              <p style="color: #666; margin-bottom: 24px;">
                How would you like to reset your password?
              </p>

              <div id="method-email" class="reset-method-card" style="display: none; padding: 16px; border: 2px solid #e0e0e0; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: border-color 0.2s;">
                <div style="display: flex; align-items: center;">
                  <ion-icon name="mail-outline" style="font-size: 32px; color: var(--app-primary); margin-right: 16px;"></ion-icon>
                  <div style="flex: 1;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px;">Email</h3>
                    <p style="margin: 0; font-size: 14px; color: #666;">We'll send a reset link to your email</p>
                  </div>
                  <ion-icon name="chevron-forward-outline" style="font-size: 20px; color: #999;"></ion-icon>
                </div>
              </div>

              <div id="method-questions" class="reset-method-card" style="display: none; padding: 16px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: border-color 0.2s;">
                <div style="display: flex; align-items: center;">
                  <ion-icon name="help-circle-outline" style="font-size: 32px; color: var(--app-primary); margin-right: 16px;"></ion-icon>
                  <div style="flex: 1;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px;">Security Questions</h3>
                    <p style="margin: 0; font-size: 14px; color: #666;">Answer your security questions</p>
                  </div>
                  <ion-icon name="chevron-forward-outline" style="font-size: 20px; color: #999;"></ion-icon>
                </div>
              </div>

              <div id="method-error" class="form-error hidden" style="margin-top: 16px;"></div>

              <ion-button fill="outline" expand="block" id="back-to-username-btn" style="margin-top: 16px;">
                Back
              </ion-button>
            </div>

            <!-- Step 3: Email Sent -->
            <div id="step-email-sent" class="reset-step" style="display: none;">
              <div style="text-align: center;">
                <ion-icon name="checkmark-circle" style="font-size: 64px; color: #28a745; margin-bottom: 16px;"></ion-icon>
                <h2 style="margin-bottom: 8px;">Check Your Email</h2>
                <p style="color: #666; margin-bottom: 24px;">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </p>
                <p style="font-size: 14px; color: #999; margin-bottom: 24px;">
                  The link will expire in 1 hour.
                </p>
                <ion-button href="/login" data-link expand="block">
                  Back to Login
                </ion-button>
              </div>
            </div>

            <!-- Step 4: Security Questions -->
            <div id="step-3" class="reset-step" style="display: none;">
              <h2 style="margin-bottom: 8px;">Answer Security Questions</h2>
              <p style="color: #666; margin-bottom: 24px;">
                Please answer ${RESET_QUESTIONS_REQUIRED} of your security questions to verify your identity.
              </p>

              <form id="questions-form">
                <div id="questions-container"></div>

                <div id="questions-general-error" class="form-error hidden" style="margin-bottom: 16px;"></div>

                <ion-button id="questions-submit-btn" expand="block" type="submit">
                  Verify Answers
                </ion-button>

                <ion-button fill="outline" expand="block" id="back-to-method-btn" style="margin-top: 12px;">
                  Back
                </ion-button>
              </form>
            </div>
          </div>

          <div style="margin-top: 16px; text-align: center;">
            <a href="/login" data-link style="color: var(--app-primary); text-decoration: none; font-size: 14px;">
              Back to Login
            </a>
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
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Username form
    const usernameForm = document.getElementById('username-form');
    if (usernameForm) {
      usernameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleUsernameSubmit();
      });
    }

    // Username validation
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
      usernameInput.addEventListener('blur', () => {
        this.validateField('username', usernameInput.value);
      });
    }

    // Method selection
    const emailMethod = document.getElementById('method-email');
    if (emailMethod) {
      emailMethod.addEventListener('click', () => this.selectEmailMethod());
      emailMethod.addEventListener('mouseenter', (e) => {
        e.currentTarget.style.borderColor = 'var(--app-primary)';
      });
      emailMethod.addEventListener('mouseleave', (e) => {
        e.currentTarget.style.borderColor = '#e0e0e0';
      });
    }

    const questionsMethod = document.getElementById('method-questions');
    if (questionsMethod) {
      questionsMethod.addEventListener('click', () => this.selectQuestionsMethod());
      questionsMethod.addEventListener('mouseenter', (e) => {
        e.currentTarget.style.borderColor = 'var(--app-primary)';
      });
      questionsMethod.addEventListener('mouseleave', (e) => {
        e.currentTarget.style.borderColor = '#e0e0e0';
      });
    }

    // Questions form
    const questionsForm = document.getElementById('questions-form');
    if (questionsForm) {
      questionsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleQuestionsSubmit();
      });
    }

    // Back buttons
    const backToUsernameBtn = document.getElementById('back-to-username-btn');
    if (backToUsernameBtn) {
      backToUsernameBtn.addEventListener('click', () => this.showStep(1));
    }

    const backToMethodBtn = document.getElementById('back-to-method-btn');
    if (backToMethodBtn) {
      backToMethodBtn.addEventListener('click', () => this.showStep(2));
    }
  }

  /**
   * Validate a single field
   */
  validateField(fieldName, value) {
    let result;

    if (fieldName === 'username') {
      result = validateUsername(value);
    } else {
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
   * Handle username submission
   */
  async handleUsernameSubmit() {
    const usernameInput = document.getElementById('username');
    const submitBtn = document.getElementById('username-submit-btn');
    const generalError = document.getElementById('username-general-error');

    // Validate username
    if (!this.validateField('username', usernameInput.value)) {
      return;
    }

    this.username = usernameInput.value.trim();

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking...';
    generalError.classList.add('hidden');
    generalError.textContent = '';

    try {
      // Fetch user's security questions to determine available methods
      try {
        this.securityQuestions = await authService.getSecurityQuestions(this.username);
      } catch (error) {
        // User might not have security questions set up
        this.securityQuestions = [];
      }

      // Show method selection step
      this.showMethodSelection();
      this.showStep(2);

      // Reset button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue';
    } catch (error) {
      console.error('Username check error:', error);

      // Show error
      generalError.classList.remove('hidden');
      generalError.textContent = error.message || 'Failed to check username. Please try again.';

      // Reset button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue';
    }
  }

  /**
   * Show method selection based on available options
   */
  showMethodSelection() {
    const emailMethod = document.getElementById('method-email');
    const questionsMethod = document.getElementById('method-questions');
    const methodError = document.getElementById('method-error');

    // Always show email method (backend will handle if email doesn't exist)
    if (emailMethod) {
      emailMethod.style.display = 'block';
    }

    // Show questions method if user has security questions
    if (questionsMethod) {
      if (this.securityQuestions && this.securityQuestions.length >= RESET_QUESTIONS_REQUIRED) {
        questionsMethod.style.display = 'block';
        methodError.classList.add('hidden');
      } else {
        questionsMethod.style.display = 'none';
        // Show info that only email is available
        if (methodError) {
          methodError.classList.remove('hidden');
          methodError.style.color = '#666';
          methodError.textContent = 'Security questions are not available. Please use email reset.';
        }
      }
    }
  }

  /**
   * Select email reset method
   */
  async selectEmailMethod() {
    const methodError = document.getElementById('method-error');
    methodError.classList.add('hidden');
    methodError.textContent = '';

    try {
      // Request password reset email
      const message = await authService.requestPasswordResetEmail(this.username);

      // Show success message
      this.showStep('email-sent');
    } catch (error) {
      console.error('Email reset error:', error);

      methodError.classList.remove('hidden');
      methodError.style.color = '#dc3545';
      methodError.textContent = error.message || 'Failed to send reset email. Please try again.';
    }
  }

  /**
   * Select security questions method
   */
  async selectQuestionsMethod() {
    if (!this.securityQuestions || this.securityQuestions.length < RESET_QUESTIONS_REQUIRED) {
      const methodError = document.getElementById('method-error');
      methodError.classList.remove('hidden');
      methodError.style.color = '#dc3545';
      methodError.textContent = 'You do not have enough security questions set up. Please use email reset.';
      return;
    }

    // Render security questions
    this.renderSecurityQuestions();
    this.showStep(3);
  }

  /**
   * Render security questions
   */
  renderSecurityQuestions() {
    const container = document.getElementById('questions-container');
    if (!container) return;

    // Randomly select questions if user has more than required
    let questionsToShow = this.securityQuestions;
    if (questionsToShow.length > RESET_QUESTIONS_REQUIRED) {
      questionsToShow = this.shuffleArray([...questionsToShow]).slice(0, RESET_QUESTIONS_REQUIRED);
    }

    container.innerHTML = questionsToShow.map((q, index) => `
      <div class="form-group">
        <label class="form-label">${q.text}</label>
        <input
          type="text"
          id="answer-${index}"
          class="form-input"
          placeholder="Your answer"
          data-question-id="${q.questionId}"
          required
        />
        <div id="answer-${index}-error" class="form-error hidden"></div>
      </div>
    `).join('');

    // Add validation listeners
    questionsToShow.forEach((q, index) => {
      const input = document.getElementById(`answer-${index}`);
      if (input) {
        input.addEventListener('blur', () => {
          const result = validateSecurityAnswer(input.value);
          const errorDiv = document.getElementById(`answer-${index}-error`);
          if (errorDiv) {
            if (result.valid) {
              errorDiv.classList.add('hidden');
              errorDiv.textContent = '';
            } else {
              errorDiv.classList.remove('hidden');
              errorDiv.textContent = result.error;
            }
          }
        });
      }
    });
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Handle security questions submission
   */
  async handleQuestionsSubmit() {
    const submitBtn = document.getElementById('questions-submit-btn');
    const generalError = document.getElementById('questions-general-error');

    // Collect answers
    const answers = [];
    const container = document.getElementById('questions-container');
    const inputs = container.querySelectorAll('input[data-question-id]');

    let allValid = true;
    inputs.forEach((input, index) => {
      const result = validateSecurityAnswer(input.value);
      const errorDiv = document.getElementById(`answer-${index}-error`);

      if (!result.valid) {
        allValid = false;
        if (errorDiv) {
          errorDiv.classList.remove('hidden');
          errorDiv.textContent = result.error;
        }
      } else {
        if (errorDiv) {
          errorDiv.classList.add('hidden');
          errorDiv.textContent = '';
        }
        answers.push({
          questionId: input.dataset.questionId,
          answer: input.value.trim()
        });
      }
    });

    if (!allValid) {
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
    generalError.classList.add('hidden');
    generalError.textContent = '';

    try {
      // Verify answers with backend
      this.resetToken = await authService.verifySecurityAnswers(this.username, answers);

      // Redirect to password reset confirm page with token
      await router.navigate(`${ROUTES_AUTH.PASSWORD_RESET_CONFIRM}?token=${encodeURIComponent(this.resetToken)}`);
    } catch (error) {
      console.error('Questions verification error:', error);

      // Show error
      generalError.classList.remove('hidden');
      generalError.textContent = error.message || 'Invalid answers. Please try again.';

      // Reset button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Verify Answers';
    }
  }

  /**
   * Show specific step
   */
  showStep(stepNum) {
    // Hide all steps
    const steps = ['step-1', 'step-2', 'step-3', 'step-email-sent'];
    steps.forEach(stepId => {
      const step = document.getElementById(stepId);
      if (step) {
        step.style.display = 'none';
      }
    });

    // Show requested step
    const targetStep = typeof stepNum === 'number' ? `step-${stepNum}` : `step-${stepNum}`;
    const step = document.getElementById(targetStep);
    if (step) {
      step.style.display = 'block';
    }

    this.currentStep = stepNum;
  }
}

export default PasswordResetPage;
