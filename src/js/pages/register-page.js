/**
 * Registration Page
 * Multi-step registration with security questions
 */

import { router } from '../router.js';
import { authService } from '../services/auth-service-wrapper.js';
import {
  validateUsername,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
  validateOptionalEmail,
  validateSecurityAnswer
} from '../utils/validators.js';
import {
  MIN_SECURITY_QUESTIONS,
  MAX_SECURITY_QUESTIONS,
  SECURITY_QUESTIONS,
  ROUTES
} from '../config/constants.js';

class RegisterPage {
  constructor(params = {}) {
    this.params = params;
    this.currentStep = 1;
    this.totalSteps = 3;
    this.formData = {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      phone: '',
      securityQuestions: []
    };
    this.errors = {};
    this.selectedQuestions = new Set();
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
          <ion-title>Sign Up</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div style="max-width: 500px; margin: 0 auto; padding: 20px 16px;">
          <!-- Progress indicator -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 14px; color: #666;">Step <span id="current-step">1</span> of ${this.totalSteps}</span>
              <span style="font-size: 14px; color: #666;"><span id="step-progress">33</span>%</span>
            </div>
            <div style="height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
              <div id="progress-bar" style="height: 100%; width: 33%; background: var(--app-primary); transition: width 0.3s;"></div>
            </div>
          </div>

          <!-- Step Title -->
          <h2 id="step-title" style="margin-bottom: 24px;">Account Information</h2>

          <div class="card">
            <div class="card-body">
              <form id="register-form">
                <!-- Step 1: Basic Info -->
                <div id="step-1" class="registration-step">
                  <div class="mb-3">
                    <label class="form-label">Username *</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      class="form-control"
                      placeholder="Choose a username"
                      required
                      autocomplete="username"
                    />
                    <div class="form-text text-muted">3-20 characters, lowercase letters, numbers, and underscores only</div>
                    <div id="username-error" class="invalid-feedback d-none"></div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      class="form-control"
                      placeholder="Enter your full name"
                      required
                      autocomplete="name"
                    />
                    <div id="name-error" class="invalid-feedback d-none"></div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      class="form-control"
                      placeholder="Create a password"
                      required
                      autocomplete="new-password"
                    />
                    <div class="form-text text-muted">At least 8 characters with uppercase, lowercase, and numbers</div>
                    <div id="password-error" class="invalid-feedback d-none"></div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Confirm Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      class="form-control"
                      placeholder="Re-enter your password"
                      required
                      autocomplete="new-password"
                    />
                    <div id="confirmPassword-error" class="invalid-feedback d-none"></div>
                  </div>
                </div>

                <!-- Step 2: Contact Info -->
                <div id="step-2" class="registration-step" style="display: none;">
                  <div class="mb-3">
                    <label class="form-label">Email (Optional)</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      class="form-control"
                      placeholder="your.email@example.com"
                      autocomplete="email"
                    />
                    <div class="form-text text-muted">Used for password recovery and notifications</div>
                    <div id="email-error" class="invalid-feedback d-none"></div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Phone (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      class="form-control"
                      placeholder="+1234567890"
                      autocomplete="tel"
                    />
                    <div class="form-text text-muted">Include country code (e.g., +1 for US)</div>
                    <div id="phone-error" class="invalid-feedback d-none"></div>
                  </div>

                <div style="padding: 12px; background: #fff3cd; border-radius: 8px; margin-top: 16px;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>Note:</strong> If you don't provide an email, you'll use security questions to reset your password.
                  </p>
                </div>
              </div>

              <!-- Step 3: Security Questions -->
              <div id="step-3" class="registration-step" style="display: none;">
                <p style="margin-bottom: 16px; color: #666;">
                  Select and answer ${MIN_SECURITY_QUESTIONS}-${MAX_SECURITY_QUESTIONS} security questions. These will be used for password recovery.
                </p>

                <div id="security-questions-container"></div>

                <ion-button
                  id="add-question-btn"
                  fill="outline"
                  size="small"
                  style="margin-top: 16px;"
                >
                  <ion-icon slot="start" name="add-circle-outline"></ion-icon>
                  Add Another Question
                </ion-button>

                <div id="security-questions-error" class="invalid-feedback d-none" style="margin-top: 8px;"></div>
              </div>

              <div id="general-error" class="invalid-feedback d-none" style="margin-top: 16px;"></div>

              <!-- Navigation Buttons -->
              <div style="display: flex; gap: 12px; margin-top: 24px;">
                <ion-button
                  id="prev-btn"
                  expand="block"
                  fill="outline"
                  style="flex: 1; display: none;"
                >
                  Previous
                </ion-button>
                <ion-button
                  id="next-btn"
                  expand="block"
                  type="button"
                  style="flex: 1;"
                >
                  Next
                </ion-button>
                <ion-button
                  id="submit-btn"
                  expand="block"
                  type="submit"
                  style="flex: 1; display: none;"
                >
                  Create Account
                </ion-button>
              </div>
              </form>

              <div style="margin-top: 16px; text-align: center;">
                <span style="font-size: 14px; color: #666;">Already have an account? </span>
                <a href="/login" data-link style="color: var(--app-primary); text-decoration: none; font-size: 14px;">
                  Sign in
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
    this.setupEventListeners();
    this.addSecurityQuestion(); // Add first question by default
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const form = document.getElementById('register-form');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const addQuestionBtn = document.getElementById('add-question-btn');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSubmit();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }

    if (addQuestionBtn) {
      addQuestionBtn.addEventListener('click', () => this.addSecurityQuestion());
    }

    // Real-time validation for step 1
    this.setupFieldValidation('username', (value) => this.validateField('username', value));
    this.setupFieldValidation('name', (value) => this.validateField('name', value));
    this.setupFieldValidation('password', (value) => this.validateField('password', value));
    this.setupFieldValidation('confirmPassword', (value) => this.validateField('confirmPassword', value));

    // Real-time validation for step 2
    this.setupFieldValidation('email', (value) => this.validateField('email', value));
  }

  /**
   * Setup field validation on blur
   */
  setupFieldValidation(fieldName, validator) {
    const input = document.getElementById(fieldName);
    if (input) {
      input.addEventListener('blur', () => {
        validator(input.value);
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
      case 'name':
        result = validateRequired(value, 'Full name');
        break;
      case 'password':
        result = validatePassword(value);
        break;
      case 'confirmPassword':
        const password = document.getElementById('password')?.value || this.formData.password;
        result = validatePasswordConfirmation(password, value);
        break;
      case 'email':
        result = validateOptionalEmail(value);
        break;
      default:
        return true;
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
   * Validate current step
   */
  validateCurrentStep() {
    let isValid = true;

    if (this.currentStep === 1) {
      const username = document.getElementById('username').value;
      const name = document.getElementById('name').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      isValid = this.validateField('username', username) && isValid;
      isValid = this.validateField('name', name) && isValid;
      isValid = this.validateField('password', password) && isValid;
      isValid = this.validateField('confirmPassword', confirmPassword) && isValid;

      if (isValid) {
        this.formData.username = username.trim();
        this.formData.name = name.trim();
        this.formData.password = password;
        this.formData.confirmPassword = confirmPassword;
      }
    } else if (this.currentStep === 2) {
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;

      isValid = this.validateField('email', email) && isValid;

      if (isValid) {
        this.formData.email = email.trim();
        this.formData.phone = phone.trim();
      }
    } else if (this.currentStep === 3) {
      isValid = this.validateSecurityQuestions();
    }

    return isValid;
  }

  /**
   * Validate security questions
   */
  validateSecurityQuestions() {
    const questions = this.getSecurityQuestions();
    const errorDiv = document.getElementById('security-questions-error');

    if (questions.length < MIN_SECURITY_QUESTIONS) {
      if (errorDiv) {
        errorDiv.classList.remove('d-none');
        errorDiv.textContent = `Please add at least ${MIN_SECURITY_QUESTIONS} security questions`;
      }
      return false;
    }

    // Validate each answer
    let allValid = true;
    questions.forEach((q, index) => {
      if (!q.answer || q.answer.trim().length < 2) {
        allValid = false;
        const answerError = document.getElementById(`answer-error-${index}`);
        if (answerError) {
          answerError.classList.remove('d-none');
          answerError.textContent = 'Answer must be at least 2 characters';
        }
      }
    });

    if (!allValid) {
      if (errorDiv) {
        errorDiv.classList.remove('d-none');
        errorDiv.textContent = 'Please provide valid answers to all security questions';
      }
      return false;
    }

    if (errorDiv) {
      errorDiv.classList.add('d-none');
      errorDiv.textContent = '';
    }

    this.formData.securityQuestions = questions.map(q => ({
      questionId: q.questionId,
      answer: q.answer
    }));

    return true;
  }

  /**
   * Get security questions from form
   */
  getSecurityQuestions() {
    const questions = [];
    const container = document.getElementById('security-questions-container');
    if (!container) return questions;

    const questionDivs = container.querySelectorAll('.security-question-item');
    questionDivs.forEach((div, index) => {
      const select = div.querySelector('select');
      const input = div.querySelector('input');
      if (select && input && select.value) {
        questions.push({
          questionId: select.value,
          answer: input.value.trim()
        });
      }
    });

    return questions;
  }

  /**
   * Add a security question field
   */
  addSecurityQuestion() {
    const container = document.getElementById('security-questions-container');
    const addBtn = document.getElementById('add-question-btn');
    const currentCount = container.querySelectorAll('.security-question-item').length;

    if (currentCount >= MAX_SECURITY_QUESTIONS) {
      return;
    }

    const index = currentCount;
    const questionDiv = document.createElement('div');
    questionDiv.className = 'security-question-item';
    questionDiv.style.marginBottom = '16px';
    questionDiv.style.padding = '16px';
    questionDiv.style.border = '1px solid #e0e0e0';
    questionDiv.style.borderRadius = '8px';
    questionDiv.style.position = 'relative';

    const availableQuestions = SECURITY_QUESTIONS.filter(q => !this.selectedQuestions.has(q.id));

    questionDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <label class="form-label" style="margin: 0;">Question ${index + 1}</label>
        ${index >= MIN_SECURITY_QUESTIONS ? `
          <ion-button
            fill="clear"
            size="small"
            color="danger"
            class="remove-question-btn"
            data-index="${index}"
          >
            <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
          </ion-button>
        ` : ''}
      </div>

      <div class="mb-3" style="margin-bottom: 12px;">
        <select
          class="form-control question-select"
          data-index="${index}"
          required
        >
          <option value="">Select a question...</option>
          ${availableQuestions.map(q => `<option value="${q.id}">${q.text}</option>`).join('')}
        </select>
      </div>

      <div class="mb-3" style="margin-bottom: 0;">
        <input
          type="text"
          class="form-control question-answer"
          placeholder="Your answer"
          data-index="${index}"
          required
        />
        <div id="answer-error-${index}" class="invalid-feedback d-none"></div>
      </div>
    `;

    container.appendChild(questionDiv);

    // Add event listener for question selection
    const select = questionDiv.querySelector('.question-select');
    select.addEventListener('change', (e) => {
      const oldValue = e.target.dataset.oldValue;
      if (oldValue) {
        this.selectedQuestions.delete(oldValue);
      }
      if (e.target.value) {
        this.selectedQuestions.add(e.target.value);
        e.target.dataset.oldValue = e.target.value;
      }
    });

    // Add event listener for answer validation
    const answerInput = questionDiv.querySelector('.question-answer');
    answerInput.addEventListener('blur', () => {
      const result = validateSecurityAnswer(answerInput.value);
      const errorDiv = document.getElementById(`answer-error-${index}`);
      if (errorDiv) {
        if (result.valid) {
          errorDiv.classList.add('d-none');
          errorDiv.textContent = '';
        } else {
          errorDiv.classList.remove('d-none');
          errorDiv.textContent = result.error;
        }
      }
    });

    // Add event listener for remove button
    const removeBtn = questionDiv.querySelector('.remove-question-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const select = questionDiv.querySelector('.question-select');
        if (select && select.value) {
          this.selectedQuestions.delete(select.value);
        }
        questionDiv.remove();
        this.updateQuestionNumbers();
        this.updateAddButtonVisibility();
      });
    }

    this.updateAddButtonVisibility();
  }

  /**
   * Update question numbers after removal
   */
  updateQuestionNumbers() {
    const container = document.getElementById('security-questions-container');
    const questionDivs = container.querySelectorAll('.security-question-item');
    questionDivs.forEach((div, index) => {
      const label = div.querySelector('.form-label');
      if (label) {
        label.textContent = `Question ${index + 1}`;
      }
    });
  }

  /**
   * Update add button visibility
   */
  updateAddButtonVisibility() {
    const addBtn = document.getElementById('add-question-btn');
    const container = document.getElementById('security-questions-container');
    const currentCount = container.querySelectorAll('.security-question-item').length;

    if (addBtn) {
      if (currentCount >= MAX_SECURITY_QUESTIONS) {
        addBtn.style.display = 'none';
      } else {
        addBtn.style.display = 'block';
      }
    }
  }

  /**
   * Move to next step
   */
  nextStep() {
    if (!this.validateCurrentStep()) {
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStepDisplay();
    }
  }

  /**
   * Move to previous step
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
    }
  }

  /**
   * Update step display
   */
  updateStepDisplay() {
    // Hide all steps
    for (let i = 1; i <= this.totalSteps; i++) {
      const step = document.getElementById(`step-${i}`);
      if (step) {
        step.style.display = 'none';
      }
    }

    // Show current step
    const currentStepDiv = document.getElementById(`step-${this.currentStep}`);
    if (currentStepDiv) {
      currentStepDiv.style.display = 'block';
    }

    // Update progress
    const progress = Math.round((this.currentStep / this.totalSteps) * 100);
    const progressBar = document.getElementById('progress-bar');
    const stepProgress = document.getElementById('step-progress');
    const currentStepSpan = document.getElementById('current-step');

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (stepProgress) stepProgress.textContent = progress;
    if (currentStepSpan) currentStepSpan.textContent = this.currentStep;

    // Update step title
    const stepTitle = document.getElementById('step-title');
    if (stepTitle) {
      const titles = [
        'Account Information',
        'Contact Information',
        'Security Questions'
      ];
      stepTitle.textContent = titles[this.currentStep - 1];
    }

    // Update button visibility
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (prevBtn) {
      prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
    }

    if (nextBtn) {
      nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
    }

    if (submitBtn) {
      submitBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    if (!this.validateCurrentStep()) {
      return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const generalError = document.getElementById('general-error');

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    generalError.classList.add('d-none');
    generalError.textContent = '';

    try {
      // Call auth service
      const result = await authService.register({
        username: this.formData.username,
        password: this.formData.password,
        name: this.formData.name,
        email: this.formData.email || undefined,
        phone: this.formData.phone || undefined,
        securityQuestions: this.formData.securityQuestions
      });

      // Show success message
      alert(`Account created successfully! Welcome, ${result.user.name}!`);

      // Redirect to login
      await router.navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Registration error:', error);

      // Show error
      generalError.classList.remove('d-none');
      generalError.textContent = error.message || 'Registration failed. Please try again.';

      // Reset button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';

      // Scroll to error
      generalError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

export default RegisterPage;
