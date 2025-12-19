/**
 * Organization Edit Page
 * Edit existing organization with permission checks
 */

import { router } from '../../router.js';
import { authState } from '../../state/auth-state.js';
import { orgState } from '../../state/org-state.js';
import { memberState } from '../../state/member-state.js';
import { organizationPersistence } from '../../services/organization-persistence.js';
import { validateRequired, validateOptionalEmail, validateLength } from '../../utils/validators.js';
import { ROLES, ROLE_HIERARCHY } from '../../config/constants.js';

class OrgEditPage {
  constructor(params = {}) {
    this.params = params;
    this.orgId = params.id;
    this.org = null;
    this.formData = {};
    this.fullNameError = null;
    this.debounceTimer = null;
  }

  async render() {
    const page = document.createElement('ion-page');
    page.className = 'org-edit-page';

    page.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button onclick="window.app.goBack()">
              <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Edit Organization</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <!-- Loading State -->
        <div id="org-loading" class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Loading organization...</p>
        </div>

        <!-- Error State -->
        <div id="org-error" class="error-state hidden">
          <ion-icon name="alert-circle-outline" color="danger"></ion-icon>
          <h3 id="error-message">Error loading organization</h3>
          <ion-button id="back-to-work-btn" fill="outline">
            <ion-icon name="arrow-back" slot="start"></ion-icon>
            Back to Work
          </ion-button>
        </div>

        <!-- Form Content -->
        <div id="org-edit-content" class="org-edit-content hidden">
          <div class="form-section">
            <h2>Organization Information</h2>
            <p class="section-description">Update your organization details.</p>

            <form id="org-edit-form">
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
              <div class="form-group fullname-display" id="fullname-display-group">
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
                <ion-button expand="block" id="save-org-btn" color="primary">
                  <ion-icon name="save" slot="start"></ion-icon>
                  Save Changes
                </ion-button>
                <ion-button expand="block" fill="outline" id="cancel-edit-btn">
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
    // Load organization data
    await this.loadOrganization();

    // Check permissions
    const canEdit = this.checkPermissions();
    if (!canEdit) {
      this.showError('You do not have permission to edit this organization');
      setTimeout(() => router.navigate('/work'), 2000);
      return;
    }

    // Pre-populate form
    this.populateForm();

    // Attach event listeners
    this.attachEventListeners();

    // Show content, hide loading
    document.getElementById('org-loading').style.display = 'none';
    document.getElementById('org-edit-content').classList.remove('hidden');
  }

  /**
   * Load organization from PouchDB
   */
  async loadOrganization() {
    try {
      this.org = await organizationPersistence.getOrganizationById(this.orgId);
      if (!this.org) {
        throw new Error('Organization not found');
      }
    } catch (error) {
      console.error('Error loading organization:', error);
      this.showError('Organization not found');
      setTimeout(() => router.navigate('/work'), 2000);
    }
  }

  /**
   * Check if current user has permission to edit
   */
  checkPermissions() {
    if (!this.org) return false;

    // Extract org identifier from _id (e.g., "org:mycompany-llc" -> "mycompany-llc")
    const orgIdentifier = this.orgId.replace('org:', '');

    // Get current user's role in this organization
    const userRole = memberState.getCurrentUserRole(orgIdentifier);

    if (!userRole) {
      return false; // Not a member
    }

    // Check role hierarchy
    const roleLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[ROLES.ADMIN]; // Admin level = 3

    return roleLevel >= requiredLevel; // owner (4) or admin (3)
  }

  /**
   * Pre-populate form with existing data
   */
  populateForm() {
    if (!this.org) return;

    this.setFieldValue('shortName', this.org.shortName);
    this.setFieldValue('legalType', this.org.legalType);
    this.setFieldValue('industry', this.org.industry || '');
    this.setFieldValue('logo', this.org.logo || '');
    this.setFieldValue('tagLine', this.org.tagLine || '');
    this.setFieldValue('subdomain', this.org.subdomain || '');
    this.setFieldValue('website', this.org.website || '');
    this.setFieldValue('primaryEmail', this.org.primaryEmail || '');
    this.setFieldValue('phone', this.org.phone || '');

    // Display computed fullName
    this.displayFullName(this.org.fullName);
  }

  /**
   * Set field value
   */
  setFieldValue(fieldName, value) {
    const field = document.getElementById(fieldName);
    if (field) {
      field.value = value || '';
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    document.getElementById('org-loading').style.display = 'none';
    document.getElementById('org-edit-content').classList.add('hidden');
    document.getElementById('org-error').classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
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

    // Save button
    const saveBtn = document.getElementById('save-org-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSave();
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate(`/organizations/${this.orgId}`);
      });
    }

    // Back to work button (error state)
    const backBtn = document.getElementById('back-to-work-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        router.navigate('/work');
      });
    }
  }

  /**
   * Debounced version of computeAndValidateFullName
   */
  debouncedComputeFullName() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.computeAndValidateFullName();
    }, 300);
  }

  /**
   * Compute fullName and validate uniqueness (excluding current org)
   */
  async computeAndValidateFullName() {
    const shortName = this.getFieldValue('shortName');
    const legalType = this.getFieldValue('legalType');

    if (!shortName || !legalType) {
      this.displayFullName('');
      return true;
    }

    // Compute fullName
    const fullName = `${shortName} ${legalType}`;
    this.displayFullName(fullName);

    // Check uniqueness (exclude current org)
    try {
      const existing = await organizationPersistence.getOrganizationByFullName(fullName);
      if (existing && existing._id !== this.orgId) {
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
      this.fullNameError = null;
      this.clearFullNameError();
      return true;
    }
  }

  displayFullName(fullName) {
    const displayElement = document.getElementById('fullName-value');
    if (displayElement) {
      displayElement.textContent = fullName || '-';
    }
  }

  showFullNameError(message) {
    const errorElement = document.getElementById('fullName-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
    }
  }

  clearFullNameError() {
    const errorElement = document.getElementById('fullName-error');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
    }
  }

  getFieldValue(fieldName) {
    const field = document.getElementById(fieldName);
    if (!field) return '';
    return field.value ? field.value.trim() : '';
  }

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

  async showLoading(message) {
    const loading = document.createElement('ion-loading');
    loading.message = message;
    document.body.appendChild(loading);
    await loading.present();
    return loading;
  }

  async showToast(message, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 3000;
    toast.color = color;
    toast.position = 'bottom';
    document.body.appendChild(toast);
    await toast.present();
  }

  async showConfirm(message) {
    return new Promise((resolve) => {
      const alert = document.createElement('ion-alert');
      alert.header = 'Confirm Changes';
      alert.message = message;
      alert.buttons = [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => resolve(false)
        },
        {
          text: 'Continue',
          handler: () => resolve(true)
        }
      ];
      document.body.appendChild(alert);
      alert.present();
    });
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

    // Check uniqueness
    const isUnique = await this.computeAndValidateFullName();
    if (!isUnique) {
      this.showToast('An organization with this name already exists', 'danger');
      return;
    }

    // Check if shortName or legalType changed
    const shortNameChanged = this.getFieldValue('shortName') !== this.org.shortName;
    const legalTypeChanged = this.getFieldValue('legalType') !== this.org.legalType;

    if (shortNameChanged || legalTypeChanged) {
      const confirmed = await this.showConfirm(
        'Changing the organization name or legal type will change its full name. This may affect how the organization appears in the system. Continue?'
      );
      if (!confirmed) return;
    }

    // Prepare updates
    const updates = {
      shortName: this.getFieldValue('shortName'),
      legalType: this.getFieldValue('legalType'),
      industry: this.getFieldValue('industry') || null,
      logo: this.getFieldValue('logo') || null,
      tagLine: this.getFieldValue('tagLine') || null,
      subdomain: this.getFieldValue('subdomain') || null,
      website: this.getFieldValue('website') || null,
      primaryEmail: this.getFieldValue('primaryEmail') || null,
      phone: this.getFieldValue('phone') || null
    };

    try {
      const loading = await this.showLoading('Updating organization...');

      // Update organization
      const updatedOrg = await organizationPersistence.updateOrganization(this.orgId, updates);

      // Update org-state
      orgState.updateOrganization(this.orgId, updatedOrg);

      await loading.dismiss();
      await this.showToast('Organization updated successfully', 'success');

      // Navigate back to org detail
      router.navigate(`/organizations/${this.orgId}`);
    } catch (error) {
      console.error('Error updating organization:', error);
      this.showToast(error.message || 'Failed to update organization', 'danger');
    }
  }

  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

export default OrgEditPage;
