/**
 * Base Process Create Page
 * Reusable base class for process creation forms
 */

import BasePage from './base-page.js';
import { processService } from '../../services/bpm/process-service.js';
import { generateForm, generateStepForm, validateForm, getFormValues, setFKOptions } from '../../utils/form-generator.js';

export class BaseProcessCreatePage extends BasePage {
  constructor() {
    super();
    this.definitionId = null;
    this.definition = null;
    this.formData = {};
    this.errors = {};
  }

  /**
   * Render the page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'process-create-page';
    page.innerHTML = this.getTemplate();
    this.element = page;
    return page;
  }

  /**
   * Query selector helper (uses stored element)
   */
  querySelector(selector) {
    return this.element ? this.element.querySelector(selector) : null;
  }

  /**
   * Get HTML template (override in subclass)
   */
  getTemplate() {
    return `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button onclick="window.app.goBack()">
              <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Create Process</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content id="create-content">
        ${this.getContentTemplate()}
      </ion-content>
    `;
  }

  /**
   * Get just the content template (for embedding)
   */
  getContentTemplate() {
    return `
      <div id="create-loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px;">
        <ion-spinner></ion-spinner>
        <p>Loading...</p>
      </div>
      <div id="create-main" style="display: none;">
        <div id="create-header"></div>
        <div id="create-form"></div>
      </div>
    `;
  }

  /**
   * Render just the content (for embedding in another page)
   */
  renderContent() {
    const content = document.createElement('div');
    content.className = 'process-create-content';
    content.innerHTML = this.getContentTemplate();
    this.element = content;
    return content;
  }

  /**
   * Called after page is mounted to DOM
   */
  async mounted() {
    await this.onWillEnter();
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
   * Uses step-based form generation - only shows fields for 'create' step
   */
  renderForm() {
    const container = this.querySelector('#create-form');
    if (!container) return;

    const variables = this.definition?.variables || {};

    // Load FK options if needed
    this.loadFKOptions(variables);

    // Create card structure
    container.innerHTML = `
      <ion-card>
        <ion-card-content>
          <div id="form-fields-container"></div>
          ${this.renderAdditionalFields()}
          <div class="form-actions" style="margin-top: 20px;">
            <ion-button
              expand="block"
              type="button"
              color="primary"
              id="submit-form-btn">
              Create ${this.definition?.name || 'Process'}
            </ion-button>
            <ion-button
              expand="block"
              fill="clear"
              onclick="window.app.goBack()">
              Cancel
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    `;

    // Generate form element for 'create' step only
    const formFieldsContainer = container.querySelector('#form-fields-container');
    if (formFieldsContainer) {
      // Use step-based form generator - only show 'create' step fields
      const formElement = generateStepForm(variables, 'create', this.formData);
      formElement.id = 'process-form';
      formFieldsContainer.appendChild(formElement);

      // If no fields for create step, show a message
      if (formElement.children.length === 0) {
        formFieldsContainer.innerHTML = `
          <div class="no-fields-message" style="padding: 20px; text-align: center; color: var(--ion-color-medium);">
            <ion-icon name="checkmark-circle-outline" style="font-size: 48px;"></ion-icon>
            <p>No initial information required. Click the button below to start the process.</p>
          </div>
        `;
      }
    }

    // Setup form handlers
    this.setupFormHandlers();
  }

  /**
   * Load FK options for fields that have foreignKey config
   * Override this in subclass to load actual data
   */
  async loadFKOptions(variables) {
    // Check each variable for foreignKey config
    for (const [fieldName, fieldSchema] of Object.entries(variables)) {
      if (fieldSchema.foreignKey && fieldSchema.foreignKey.source) {
        const options = await this.fetchFKOptions(fieldSchema.foreignKey.source);
        setFKOptions(fieldName, options);
      }
    }
  }

  /**
   * Fetch FK options from a source
   * Override in subclass for custom data sources
   * @param {string} source - Source identifier (e.g., 'users', 'departments')
   * @returns {Array} Options array
   */
  async fetchFKOptions(source) {
    // Default implementation - can be overridden
    // This would typically call an API or service to get options
    console.log(`Fetching FK options for source: ${source}`);
    return [];
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

    // Handle submit button click
    const submitBtn = this.querySelector('#submit-form-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        await this.handleSubmit();
      });
    }

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

      // Show loading overlay
      const loading = await this.showLoadingOverlay('Creating process...');

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
   * Show loading in content area
   */
  showLoading() {
    const loading = this.querySelector('#create-loading');
    const main = this.querySelector('#create-main');
    if (loading) loading.style.display = 'flex';
    if (main) main.style.display = 'none';
  }

  /**
   * Hide loading and show main content
   */
  hideLoading() {
    const loading = this.querySelector('#create-loading');
    const main = this.querySelector('#create-main');
    if (loading) loading.style.display = 'none';
    if (main) main.style.display = 'block';
  }

  /**
   * Show loading overlay (for form submission)
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
   * Show error
   */
  showError(message) {
    const loading = this.querySelector('#create-loading');
    const main = this.querySelector('#create-main');

    if (loading) loading.style.display = 'none';
    if (main) {
      main.style.display = 'block';
      main.innerHTML = `
        <div class="error-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px;">
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
