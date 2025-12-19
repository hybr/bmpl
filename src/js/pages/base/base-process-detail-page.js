/**
 * Base Process Detail Page
 * Reusable base class for process detail views
 */

import BasePage from './base-page.js';
import { processState } from '../../state/process-state.js';
import { processService } from '../../services/bpm/process-service.js';
import { formatDate, formatDateTime, getRelativeTime } from '../../utils/date-utils.js';

export class BaseProcessDetailPage extends BasePage {
  constructor() {
    super();
    this.processId = null;
    this.process = null;
    this.definition = null;
  }

  /**
   * Render the page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'process-detail-page';
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
          <ion-title>Process Details</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content id="process-content">
        <div id="process-header"></div>
        <div id="process-details"></div>
        <div id="process-timeline"></div>
        <div id="process-actions"></div>
        <div id="process-history"></div>
      </ion-content>
    `;
  }

  /**
   * Called after page is mounted to DOM
   */
  async mounted() {
    await this.onWillEnter();
  }

  /**
   * Set process ID and load
   */
  async setProcessId(processId) {
    this.processId = processId;
    await this.loadProcess();
  }

  /**
   * Load process details
   */
  async loadProcess() {
    try {
      this.showLoading();

      // Get process from state
      this.process = processState.getProcess(this.processId);

      if (!this.process) {
        this.showError('Process not found');
        return;
      }

      // Get definition
      this.definition = processService.getDefinition(this.process.definitionId);

      // Render all sections
      this.renderHeader();
      this.renderDetails();
      this.renderTimeline();
      this.renderActions();
      this.renderHistory();

    } catch (error) {
      console.error('Error loading process:', error);
      this.showError('Failed to load process details');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Render header section
   */
  renderHeader() {
    const container = this.querySelector('#process-header');
    if (!container) return;

    const statusColor = this.getStatusColor(this.process.status);
    const icon = this.definition?.metadata?.icon || 'document';
    const color = this.definition?.metadata?.color || '#666';

    container.innerHTML = `
      <div class="process-header">
        <div class="process-header-icon" style="background-color: ${color}; color: white;">
          <ion-icon name="${icon}"></ion-icon>
        </div>
        <div class="process-header-info">
          <h1>${this.definition?.name || 'Process'}</h1>
          <p class="process-id">${this.process._id}</p>
          <div class="process-badges">
            <ion-badge color="${statusColor}">${this.process.status}</ion-badge>
            <ion-badge color="medium">${this.process.currentState}</ion-badge>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render details section
   */
  renderDetails() {
    const container = this.querySelector('#process-details');
    if (!container) return;

    const variables = this.process.variables || {};
    const metadata = this.definition?.metadata || {};

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Details</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          ${this.renderVariables(variables)}

          <div class="detail-section">
            <h3>Process Information</h3>
            <ion-list lines="none">
              <ion-item>
                <ion-label>
                  <h3>Created</h3>
                  <p>${formatDateTime(this.process.createdAt)} (${getRelativeTime(this.process.createdAt)})</p>
                </ion-label>
              </ion-item>
              ${this.process.updatedAt ? `
                <ion-item>
                  <ion-label>
                    <h3>Last Updated</h3>
                    <p>${formatDateTime(this.process.updatedAt)} (${getRelativeTime(this.process.updatedAt)})</p>
                  </ion-label>
                </ion-item>
              ` : ''}
              ${this.process.completedAt ? `
                <ion-item>
                  <ion-label>
                    <h3>Completed</h3>
                    <p>${formatDateTime(this.process.completedAt)} (${getRelativeTime(this.process.completedAt)})</p>
                  </ion-label>
                </ion-item>
              ` : ''}
              <ion-item>
                <ion-label>
                  <h3>Category</h3>
                  <p>${metadata.category || 'N/A'}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </div>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Render variables (override for custom display)
   */
  renderVariables(variables) {
    if (!variables || Object.keys(variables).length === 0) {
      return '<p>No additional details</p>';
    }

    // Get important fields to display (override in subclass)
    const fieldsToShow = this.getFieldsToShow();

    return `
      <div class="detail-section">
        <h3>Variables</h3>
        <ion-list lines="none">
          ${fieldsToShow.map(field => {
            const value = variables[field];
            if (value === undefined || value === null) return '';

            return `
              <ion-item>
                <ion-label>
                  <h3>${this.formatFieldName(field)}</h3>
                  <p>${this.formatFieldValue(value)}</p>
                </ion-label>
              </ion-item>
            `;
          }).join('')}
        </ion-list>
      </div>
    `;
  }

  /**
   * Get fields to show (override in subclass)
   */
  getFieldsToShow() {
    const variables = this.process.variables || {};
    return Object.keys(variables).slice(0, 10); // Show first 10 by default
  }

  /**
   * Format field name
   */
  formatFieldName(fieldName) {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Format field value
   */
  formatFieldValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `${value.length} items`;
      return JSON.stringify(value);
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return formatDate(value);
    }
    return String(value);
  }

  /**
   * Render timeline
   */
  renderTimeline() {
    const container = this.querySelector('#process-timeline');
    if (!container) return;

    const states = this.definition?.states || {};
    const currentState = this.process.currentState;
    const stateHistory = this.process.stateHistory || [];

    const stateKeys = Object.keys(states);
    const currentIndex = stateKeys.indexOf(currentState);

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Progress</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="timeline">
            ${stateKeys.map((stateKey, index) => {
              const state = states[stateKey];
              const isCompleted = index < currentIndex || stateHistory.some(h => h.toState === stateKey);
              const isCurrent = stateKey === currentState;

              return `
                <div class="timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                  <div class="timeline-marker">
                    ${isCompleted ? '<ion-icon name="checkmark-circle"></ion-icon>' : ''}
                    ${isCurrent ? '<ion-icon name="radio-button-on"></ion-icon>' : ''}
                    ${!isCompleted && !isCurrent ? '<ion-icon name="ellipse-outline"></ion-icon>' : ''}
                  </div>
                  <div class="timeline-content">
                    <h4>${state.name || stateKey}</h4>
                    <p>${state.description || ''}</p>
                    ${this.getStateTimestamp(stateKey, stateHistory)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Get timestamp for state in history
   */
  getStateTimestamp(stateKey, stateHistory) {
    const entry = stateHistory.find(h => h.toState === stateKey);
    if (entry && entry.timestamp) {
      return `<small>${getRelativeTime(entry.timestamp)}</small>`;
    }
    return '';
  }

  /**
   * Render actions
   */
  renderActions() {
    const container = this.querySelector('#process-actions');
    if (!container) return;

    const availableTransitions = processService.getAvailableTransitions(
      this.process.definitionId,
      this.process.currentState
    );

    if (availableTransitions.length === 0) {
      container.innerHTML = '<p class="no-actions">No actions available</p>';
      return;
    }

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Actions</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="action-buttons">
            ${availableTransitions.map(toState => {
              return `
                <ion-button
                  expand="block"
                  onclick="window.app.currentPage.transitionTo('${toState}')">
                  Transition to ${this.formatFieldName(toState)}
                </ion-button>
              `;
            }).join('')}
          </div>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Render history
   */
  renderHistory() {
    const container = this.querySelector('#process-history');
    if (!container) return;

    const history = this.process.stateHistory || [];

    if (history.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>History</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            ${history.map(entry => `
              <ion-item>
                <ion-label>
                  <h3>${entry.fromState} → ${entry.toState}</h3>
                  <p>${formatDateTime(entry.timestamp)}</p>
                  ${entry.reason ? `<p class="reason">${entry.reason}</p>` : ''}
                </ion-label>
              </ion-item>
            `).join('')}
          </ion-list>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Transition to new state
   */
  async transitionTo(toState) {
    try {
      // Show confirmation
      const confirmed = await this.showConfirm(
        'Confirm Transition',
        `Are you sure you want to transition to ${this.formatFieldName(toState)}?`
      );

      if (!confirmed) return;

      // Perform transition
      await processService.transitionToState(this.processId, toState, {
        // Add context if needed
      });

      // Show success
      await this.showToast('Transition successful', 'success');

      // Reload process
      await this.loadProcess();

    } catch (error) {
      console.error('Error transitioning:', error);
      await this.showToast('Failed to transition: ' + error.message, 'danger');
    }
  }

  /**
   * Get status color
   */
  getStatusColor(status) {
    const colorMap = {
      'active': 'primary',
      'completed': 'success',
      'cancelled': 'medium',
      'failed': 'danger',
      'suspended': 'warning'
    };
    return colorMap[status] || 'medium';
  }

  /**
   * Show loading
   */
  showLoading() {
    const container = this.querySelector('#process-content');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <ion-spinner></ion-spinner>
          <p>Loading process...</p>
        </div>
      `;
    }
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
    const container = this.querySelector('#process-content');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <ion-icon name="alert-circle-outline" style="font-size: 64px; color: var(--ion-color-danger);"></ion-icon>
          <p>${message}</p>
          <ion-button onclick="window.app.navigate('/work/processes')">Back to List</ion-button>
        </div>
      `;
    }
  }

  /**
   * Show confirmation dialog
   */
  async showConfirm(header, message) {
    return new Promise((resolve) => {
      const alert = document.createElement('ion-alert');
      alert.header = header;
      alert.message = message;
      alert.buttons = [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => resolve(false)
        },
        {
          text: 'Confirm',
          handler: () => resolve(true)
        }
      ];

      document.body.appendChild(alert);
      alert.present();
    });
  }

  /**
   * Show toast message
   */
  async showToast(message, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.color = color;

    document.body.appendChild(toast);
    await toast.present();
  }

  /**
   * Lifecycle: Page will enter
   */
  async onWillEnter() {
    // Subscribe to process state changes
    this.unsubscribe = processState.subscribe(() => {
      if (this.processId) {
        this.loadProcess();
      }
    });
  }

  /**
   * Lifecycle: Page will leave
   */
  onWillLeave() {
    // Unsubscribe from state changes
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export default BaseProcessDetailPage;
