/**
 * Process Create Page
 * Create new process instances
 */

import BasePage from '../base/base-page.js';
import { processService } from '../../services/bpm/process-service.js';
import { BaseProcessCreatePage } from '../base/base-process-create-page.js';

export class ProcessCreatePage extends BasePage {
  constructor() {
    super();
    this.selectedDefinitionId = null;
    this.createPage = null;
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
   * Query selector helper
   */
  querySelector(selector) {
    return this.element ? this.element.querySelector(selector) : null;
  }

  /**
   * Called after page is mounted to DOM
   */
  async mounted() {
    await this.onWillEnter();
  }

  /**
   * Load available process definitions
   */
  async loadDefinitions() {
    const definitions = processService.getAllDefinitions();

    // Group by category
    const grouped = {};
    definitions.forEach(def => {
      const category = def.metadata?.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(def);
    });

    this.renderDefinitionList(grouped);
  }

  /**
   * Render definition list
   */
  renderDefinitionList(grouped) {
    const container = this.querySelector('#definition-list');
    if (!container) return;

    container.innerHTML = `
      <div class="definition-list">
        ${Object.entries(grouped).map(([category, defs]) => `
          <div class="definition-category">
            <h3>${this.formatCategoryName(category)}</h3>
            ${defs.map(def => this.renderDefinitionCard(def)).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render definition card
   */
  renderDefinitionCard(definition) {
    const icon = definition.metadata?.icon || 'document';
    const color = definition.metadata?.color || '#666';

    return `
      <ion-card class="definition-card" onclick="window.app.currentPage.selectDefinition('${definition.id}')">
        <ion-card-content>
          <div class="definition-icon" style="background-color: ${color}; color: white;">
            <ion-icon name="${icon}"></ion-icon>
          </div>
          <div class="definition-info">
            <h3>${definition.name}</h3>
            <p>${definition.description || ''}</p>
          </div>
          <ion-icon name="chevron-forward" color="medium"></ion-icon>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Select definition and show create form
   */
  async selectDefinition(definitionId) {
    this.selectedDefinitionId = definitionId;

    // Create a new create page instance
    this.createPage = new BaseProcessCreatePage();

    // Show the form
    await this.showCreateForm();

    // Set definition ID after element is in DOM
    await this.createPage.setDefinitionId(definitionId);
  }

  /**
   * Show create form
   */
  async showCreateForm() {
    const container = this.querySelector('#create-form-container');
    if (!container) return;

    // Hide definition list
    const list = this.querySelector('#definition-list');
    if (list) list.style.display = 'none';

    // Show form container
    container.style.display = 'block';

    // Render form content (not full page) - for embedding
    if (this.createPage) {
      container.innerHTML = '';
      const formElement = this.createPage.renderContent();
      container.appendChild(formElement);
    }
  }

  /**
   * Format category name
   */
  formatCategoryName(category) {
    return category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Lifecycle: Page will enter
   */
  async onWillEnter() {
    await this.loadDefinitions();
  }

  /**
   * Get HTML template
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

      <ion-content>
        <div id="definition-list" class="create-page-container"></div>
        <div id="create-form-container" style="display: none;"></div>
      </ion-content>
    `;
  }
}

// Register page
customElements.define('page-process-create', ProcessCreatePage);

export default ProcessCreatePage;
