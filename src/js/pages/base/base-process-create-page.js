/**
 * Base Process Create Page
 * Reusable base class for process creation forms
 */

import BasePage from './base-page.js';
import { processService } from '../../services/bpm/process-service.js';
import { generateForm, validateForm, getFormValues } from '../../utils/form-generator.js';

export class BaseProcessCreatePage extends BasePage {
  constructor() {
    super();
    this.definitionId = null;
    this.definition = null;
    this.formData = {};
    this.errors = {};
  }

  /**
   * Set definition ID and load
   */
  async setDefinitionId(definitionId) {
    this.definitionId = definitionId;
    await this.loadDefinition();
  }

  /**
   * Load process definition
   */
  async loadDefinition() {
    try {
      this.showLoading();

      // Get definition
      this.definition = processService.getDefinition(this.definitionId);

      if (!this.definition) {
        this.showError('Process definition not found');
        return;
      }

      // Render form
      this.renderHeader();
      this.renderForm();

    } catch (error) {
      console.error('Error loading definition:', error);
      this.showError('Failed to load process definition');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Render header
   */
  renderHeader() {
    const container = this.querySelector('#create-header');
    if (!container) return;

    const icon = this.definition?.metadata?.icon || 'add-circle';
    const color = this.definition?.metadata?.color || '#666';

    container.innerHTML = `
      <div class="create-header">
        <div class="create-header-icon" style="background-color: ${color}; color: white;">
          <ion-icon name="${icon}"></ion-icon>
        </div>
        <div class="create-header-info">
          <h1>Create ${this.definition?.name || 'Process'}</h1>
          <p>${this.definition?.description || ''}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render form
   */
  renderForm() {
    const container = this.querySelector('#create-form');
    if (!container) return;

    const variables = this.definition?.variables || {};

    // Generate form HTML
    const formHtml = generateForm(variables, this.formData);

    container.innerHTML = `
      <ion-card>
        <ion-card-content>
          <form id="process-form">
            ${formHtml}

            ${this.renderAdditionalFields()}

            <div class="form-actions">
              <ion-button
                expand="block"
                type="submit"
                color="primary">
                Create ${this.definition?.name || 'Process'}
              </ion-button>

              <ion-button
                expand="block"
                fill="clear"
                onclick="window.app.goBack()">
                Cancel
              </ion-button>
            </div>
          </form>
        </ion-card-content>
      </ion-card>
    `;

    // Setup form handlers
    this.setupFormHandlers();
  }

  /**
   * Render additional fields (override in subclass)
   */
  renderAdditionalFields() {
    return '';
  }

  /**
   * Setup form handlers
   */
  setupFormHandlers() {
    const form = this.querySelector('#process-form');
    if (!form) return;

    // Prevent default form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    // Add change listeners for validation
    const inputs = form.querySelectorAll('ion-input, ion-textarea, ion-select, ion-datetime, ion-toggle, ion-checkbox');
    inputs.forEach(input => {
      input.addEventListener('ionChange', (e) => {
        this.handleFieldChange(e.target);
      });
    });
  }

  /**
   * Handle field change
   */
  handleFieldChange(field) {
    const name = field.name;
    let value = field.value;

    // Handle different input types
    if (field.tagName === 'ION-TOGGLE' || field.tagName === 'ION-CHECKBOX') {
      value = field.checked;
    }

    // Update form data
    this.formData[name] = value;

    // Clear error for this field
    if (this.errors[name]) {
      delete this.errors[name];
      this.clearFieldError(name);
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    try {
      // Get form values
      const form = this.querySelector('#process-form');
      this.formData = getFormValues(form);

      // Validate
      const validation = validateForm(form, this.definition?.variables || {});

      if (!validation.valid) {
        this.errors = validation.errors;
        this.showValidationErrors();
        await this.showToast('Please fix the errors in the form', 'warning');
        return;
      }

      // Show loading
      const loading = await this.showLoading('Creating process...');

      try {
        // Create process
        const process = await this.createProcess(this.formData);

        // Hide loading
        await loading.dismiss();

        // Show success
        await this.showToast(`${this.definition?.name || 'Process'} created successfully`, 'success');

        // Navigate to process detail
        window.app.navigate(`/process/${process._id}`);

      } catch (error) {
        await loading.dismiss();
        throw error;
      }

    } catch (error) {
      console.error('Error creating process:', error);
      await this.showToast('Failed to create process: ' + error.message, 'danger');
    }
  }

  /**
   * Create process (override for custom creation logic)
   */
  async createProcess(formData) {
    return await processService.createProcess({
      definitionId: this.definitionId,
      type: this.definition?.type,
      variables: formData,
      metadata: this.getProcessMetadata()
    });
  }

  /**
   * Get process metadata (override in subclass)
   */
  getProcessMetadata() {
    return {};
  }

  /**
   * Show validation errors
   */
  showValidationErrors() {
    Object.entries(this.errors).forEach(([fieldName, error]) => {
      this.showFieldError(fieldName, error);
    });
  }

  /**
   * Show field error
   */
  showFieldError(fieldName, errorMessage) {
    const field = this.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    // Find or create error element
    let errorEl = field.parentElement.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      field.parentElement.appendChild(errorEl);
    }

    errorEl.textContent = errorMessage;
    errorEl.style.color = 'var(--ion-color-danger)';
    errorEl.style.fontSize = '12px';
    errorEl.style.marginTop = '4px';

    // Add error class to field
    field.classList.add('ion-invalid');
  }

  /**
   * Clear field error
   */
  clearFieldError(fieldName) {
    const field = this.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    const errorEl = field.parentElement.querySelector('.field-error');
    if (errorEl) {
      errorEl.remove();
    }

    field.classList.remove('ion-invalid');
  }

  /**
   * Show loading overlay
   */
  async showLoadingOverlay(message = 'Loading...') {
    const loading = document.createElement('ion-loading');
    loading.message = message;
    loading.spinner = 'crescent';

    document.body.appendChild(loading);
    await loading.present();

    return loading;
  }

  /**
   * Show loading
   */
  showLoading(message = 'Loading...') {
    return this.showLoadingOverlay(message);
  }

  /**
   * Hide loading
   */
  hideLoading() {
    // Loading is replaced by content
  }

  /**
   * Show error
   */
  showError(message) {
    const container = this.querySelector('#create-content');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <ion-icon name="alert-circle-outline" style="font-size: 64px; color: var(--ion-color-danger);"></ion-icon>
          <p>${message}</p>
          <ion-button onclick="window.app.goBack()">Go Back</ion-button>
        </div>
      `;
    }
  }

  /**
   * Show toast message
   */
  async showToast(message, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.color = color;
    toast.position = 'top';

    document.body.appendChild(toast);
    await toast.present();
  }

  /**
   * Lifecycle: Page will enter
   */
  async onWillEnter() {
    // Clear form data on entry
    this.formData = {};
    this.errors = {};
  }

  /**
   * Lifecycle: Page will leave
   */
  onWillLeave() {
    // Cleanup
  }
}

export default BaseProcessCreatePage;
