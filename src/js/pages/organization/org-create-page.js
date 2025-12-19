/**
 * Organization Create Page
 * Create new organization with full form and validation
 */

import { router } from '../../router.js';
import { authState } from '../../state/auth-state.js';
import { orgState } from '../../state/org-state.js';
import { organizationPersistence } from '../../services/organization-persistence.js';
import { validateRequired, validateOptionalEmail, validateLength } from '../../utils/validators.js';

class OrgCreatePage {
  constructor(params = {}) {
    this.params = params;
    this.formData = {};
    this.fullNameError = null;
    this.debounceTimer = null;
  }

  async render() {
    const page = document.createElement('ion-page');
    page.className = 'org-create-page';

    page.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button onclick="window.app.goBack()">
              <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Create Organization</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div class="org-create-content">
          <div class="form-section">
            <h2>Organization Information</h2>
            <p class="section-description">Create a new organization to manage processes and collaborate with your team.</p>

            <form id="org-create-form">
              <!-- Short Name -->
              <div class="form-group" data-field="shortName">
                <label for="shortName">Organization Name <span class="required">*</span></label>
                <ion-input
                  id="shortName"
                  name="shortName"
                  type="text"
                  placeholder="e.g., ACME, TechCorp"
                  required
                ></ion-input>
                <div class="form-error hidden" id="shortName-error"></div>
                <small class="form-help">The primary name of your organization (2-100 characters)</small>
              </div>

              <!-- Legal Type -->
              <div class="form-group" data-field="legalType">
                <label for="legalType">Legal Type <span class="required">*</span></label>
                <ion-select
                  id="legalType"
                  name="legalType"
                  placeholder="Select legal type"
                  interface="popover"
                  required
                >
                  <ion-select-option value="LLC">LLC</ion-select-option>
                  <ion-select-option value="Inc">Inc</ion-select-option>
                  <ion-select-option value="Corp">Corp</ion-select-option>
                  <ion-select-option value="LLP">LLP</ion-select-option>
                  <ion-select-option value="Partnership">Partnership</ion-select-option>
                  <ion-select-option value="Sole Proprietorship">Sole Proprietorship</ion-select-option>
                  <ion-select-option value="Nonprofit">Nonprofit</ion-select-option>
                  <ion-select-option value="Other">Other</ion-select-option>
                </ion-select>
                <div class="form-error hidden" id="legalType-error"></div>
                <small class="form-help">The legal structure of your organization</small>
              </div>

              <!-- Full Name (Computed, Read-only) -->
              <div class="form-group fullname-display" id="fullname-display-group" style="display: none;">
                <label>Full Organization Name</label>
                <div class="computed-value" id="fullName-display">
                  <ion-icon name="business"></ion-icon>
                  <span id="fullName-value">-</span>
                </div>
                <div class="form-error hidden" id="fullName-error"></div>
                <small class="form-help">This is how your organization will appear in the system</small>
              </div>

              <!-- Industry -->
              <div class="form-group" data-field="industry">
                <label for="industry">Industry</label>
                <ion-select
                  id="industry"
                  name="industry"
                  placeholder="Select industry"
                  interface="popover"
                >
                  <ion-select-option value="">Not specified</ion-select-option>
                  <ion-select-option value="Technology">Technology</ion-select-option>
                  <ion-select-option value="Healthcare">Healthcare</ion-select-option>
                  <ion-select-option value="Finance">Finance</ion-select-option>
                  <ion-select-option value="Retail">Retail</ion-select-option>
                  <ion-select-option value="Manufacturing">Manufacturing</ion-select-option>
                  <ion-select-option value="Education">Education</ion-select-option>
                  <ion-select-option value="Real Estate">Real Estate</ion-select-option>
                  <ion-select-option value="Food & Beverage">Food & Beverage</ion-select-option>
                  <ion-select-option value="Construction">Construction</ion-select-option>
                  <ion-select-option value="Professional Services">Professional Services</ion-select-option>
                  <ion-select-option value="Other">Other</ion-select-option>
                </ion-select>
                <div class="form-error hidden" id="industry-error"></div>
                <small class="form-help">Optional: Helps categorize your organization</small>
              </div>

              <!-- Tag Line -->
              <div class="form-group" data-field="tagLine">
                <label for="tagLine">Tag Line</label>
                <ion-input
                  id="tagLine"
                  name="tagLine"
                  type="text"
                  placeholder="e.g., Building the future"
                ></ion-input>
                <div class="form-error hidden" id="tagLine-error"></div>
                <small class="form-help">Optional: A short tagline or slogan</small>
              </div>

              <h3 class="subsection-title">Contact Information</h3>

              <!-- Primary Email -->
              <div class="form-group" data-field="primaryEmail">
                <label for="primaryEmail">Primary Email</label>
                <ion-input
                  id="primaryEmail"
                  name="primaryEmail"
                  type="email"
                  placeholder="contact@example.com"
                ></ion-input>
                <div class="form-error hidden" id="primaryEmail-error"></div>
                <small class="form-help">Optional: Main contact email for the organization</small>
              </div>

              <!-- Phone -->
              <div class="form-group" data-field="phone">
                <label for="phone">Phone Number</label>
                <ion-input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                ></ion-input>
                <div class="form-error hidden" id="phone-error"></div>
                <small class="form-help">Optional: Main contact phone number</small>
              </div>

              <!-- Website -->
              <div class="form-group" data-field="website">
                <label for="website">Website</label>
                <ion-input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://www.example.com"
                ></ion-input>
                <div class="form-error hidden" id="website-error"></div>
                <small class="form-help">Optional: Organization website URL</small>
              </div>

              <h3 class="subsection-title">Additional Settings</h3>

              <!-- Logo URL -->
              <div class="form-group" data-field="logo">
                <label for="logo">Logo URL</label>
                <ion-input
                  id="logo"
                  name="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                ></ion-input>
                <div class="form-error hidden" id="logo-error"></div>
                <small class="form-help">Optional: URL to your organization's logo image</small>
              </div>

              <!-- Subdomain -->
              <div class="form-group" data-field="subdomain">
                <label for="subdomain">Subdomain</label>
                <ion-input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  placeholder="mycompany"
                ></ion-input>
                <div class="form-error hidden" id="subdomain-error"></div>
                <small class="form-help">Optional: Unique subdomain for your organization (lowercase, hyphens only)</small>
              </div>

              <!-- Actions -->
              <div class="form-actions">
                <ion-button expand="block" id="create-org-btn" color="primary">
                  <ion-icon name="add-circle" slot="start"></ion-icon>
                  Create Organization
                </ion-button>
                <ion-button expand="block" fill="outline" id="cancel-btn">
                  Cancel
                </ion-button>
              </div>
            </form>
          </div>
        </div>
      </ion-content>
    `;

    return page;
  }

  async mounted() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Listen to shortName and legalType changes
    const shortNameInput = document.getElementById('shortName');
    const legalTypeSelect = document.getElementById('legalType');

    if (shortNameInput) {
      shortNameInput.addEventListener('ionInput', () => this.debouncedComputeFullName());
    }

    if (legalTypeSelect) {
      legalTypeSelect.addEventListener('ionChange', () => this.computeAndValidateFullName());
    }

    // Create button
    const createBtn = document.getElementById('create-org-btn');
    if (createBtn) {
      createBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSave();
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/work');
      });
    }
  }

  /**
   * Debounced version of computeAndValidateFullName
   * Waits 300ms after user stops typing before checking uniqueness
   */
  debouncedComputeFullName() {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      this.computeAndValidateFullName();
    }, 300);
  }

  /**
   * Compute fullName and validate uniqueness
   */
  async computeAndValidateFullName() {
    const shortName = this.getFieldValue('shortName');
    const legalType = this.getFieldValue('legalType');

    // Hide fullName display if either field is empty
    if (!shortName || !legalType) {
      this.displayFullName('');
      document.getElementById('fullname-display-group').style.display = 'none';
      return true;
    }

    // Compute fullName
    const fullName = `${shortName} ${legalType}`;
    this.displayFullName(fullName);
    document.getElementById('fullname-display-group').style.display = 'block';

    // Check uniqueness
    try {
      const existing = await organizationPersistence.getOrganizationByFullName(fullName);
      if (existing) {
        this.fullNameError = 'An organization with this name already exists';
        this.showFullNameError(this.fullNameError);
        return false;
      } else {
        this.fullNameError = null;
        this.clearFullNameError();
        return true;
      }
    } catch (error) {
      console.error('Error checking fullName uniqueness:', error);
      // Fail open - allow on error
      this.fullNameError = null;
      this.clearFullNameError();
      return true;
    }
  }

  /**
   * Display computed fullName
   */
  displayFullName(fullName) {
    const displayElement = document.getElementById('fullName-value');
    if (displayElement) {
      displayElement.textContent = fullName || '-';
    }
  }

  /**
   * Show fullName error
   */
  showFullNameError(message) {
    const errorElement = document.getElementById('fullName-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
    }
  }

  /**
   * Clear fullName error
   */
  clearFullNameError() {
    const errorElement = document.getElementById('fullName-error');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
    }
  }

  /**
   * Get field value
   */
  getFieldValue(fieldName) {
    const field = document.getElementById(fieldName);
    if (!field) return '';
    return field.value ? field.value.trim() : '';
  }

  /**
   * Validate form
   */
  async validateForm() {
    const errors = {};

    // Required: shortName
    const shortName = this.getFieldValue('shortName');
    const shortNameValidation = validateRequired(shortName, 'Organization Name');
    if (!shortNameValidation.valid) {
      errors.shortName = shortNameValidation.error;
    } else {
      const lengthValidation = validateLength(shortName, 2, 100, 'Organization Name');
      if (!lengthValidation.valid) {
        errors.shortName = lengthValidation.error;
      }
    }

    // Required: legalType
    const legalType = this.getFieldValue('legalType');
    const legalTypeValidation = validateRequired(legalType, 'Legal Type');
    if (!legalTypeValidation.valid) {
      errors.legalType = legalTypeValidation.error;
    }

    // Optional: primaryEmail
    const email = this.getFieldValue('primaryEmail');
    if (email) {
      const emailValidation = validateOptionalEmail(email);
      if (!emailValidation.valid) {
        errors.primaryEmail = emailValidation.error;
      }
    }

    // Optional: website URL
    const website = this.getFieldValue('website');
    if (website && !/^https?:\/\/.+/.test(website)) {
      errors.website = 'Please enter a valid URL (http:// or https://)';
    }

    // Optional: subdomain (slug validation)
    const subdomain = this.getFieldValue('subdomain');
    if (subdomain && !/^[a-z0-9-]+$/.test(subdomain)) {
      errors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    }

    // Optional: logo URL
    const logo = this.getFieldValue('logo');
    if (logo && !/^https?:\/\/.+/.test(logo)) {
      errors.logo = 'Please enter a valid URL (http:// or https://)';
    }

    return errors;
  }

  /**
   * Display validation errors
   */
  displayErrors(errors) {
    // Clear all existing errors
    document.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
    });

    // Show new errors
    Object.keys(errors).forEach(fieldName => {
      const errorElement = document.getElementById(`${fieldName}-error`);
      if (errorElement) {
        errorElement.textContent = errors[fieldName];
        errorElement.classList.remove('hidden');
      }
    });

    // Scroll to first error
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const fieldGroup = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (fieldGroup) {
        fieldGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  /**
   * Show loading overlay
   */
  async showLoading(message) {
    const loading = document.createElement('ion-loading');
    loading.message = message;
    document.body.appendChild(loading);
    await loading.present();
    return loading;
  }

  /**
   * Show toast notification
   */
  async showToast(message, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 3000;
    toast.color = color;
    toast.position = 'bottom';
    document.body.appendChild(toast);
    await toast.present();
  }

  /**
   * Handle save
   */
  async handleSave() {
    // Validate form
    const errors = await this.validateForm();
    if (Object.keys(errors).length > 0) {
      this.displayErrors(errors);
      this.showToast('Please fix the errors before submitting', 'danger');
      return;
    }

    // Final fullName uniqueness check
    const isUnique = await this.computeAndValidateFullName();
    if (!isUnique) {
      this.showToast('An organization with this name already exists', 'danger');
      return;
    }

    // Get current user
    const user = authState.getUser();
    if (!user) {
      this.showToast('You must be logged in to create an organization', 'danger');
      return;
    }

    // Prepare organization data
    const orgData = {
      shortName: this.getFieldValue('shortName'),
      legalType: this.getFieldValue('legalType'),
      industry: this.getFieldValue('industry') || null,
      logo: this.getFieldValue('logo') || null,
      tagLine: this.getFieldValue('tagLine') || null,
      subdomain: this.getFieldValue('subdomain') || null,
      website: this.getFieldValue('website') || null,
      primaryEmail: this.getFieldValue('primaryEmail') || null,
      phone: this.getFieldValue('phone') || null,
      createdBy: user._id || user.id || user.email
    };

    try {
      // Show loading
      const loading = await this.showLoading('Creating organization...');

      // Save to PouchDB
      const newOrg = await organizationPersistence.createOrganization(orgData);

      // Update org-state
      orgState.addOrganization(newOrg);

      // Hide loading
      await loading.dismiss();

      // Show success toast
      await this.showToast('Organization created successfully', 'success');

      // Navigate to org detail page
      router.navigate(`/organizations/${newOrg._id}`);
    } catch (error) {
      console.error('Error creating organization:', error);
      this.showToast(error.message || 'Failed to create organization', 'danger');
    }
  }

  destroy() {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

export default OrgCreatePage;
