/**
 * Base Process List Page
 * Reusable base class for process list views
 */

import BasePage from './base-page.js';
import { processState } from '../../state/process-state.js';
import { processService } from '../../services/bpm/process-service.js';

export class BaseProcessListPage extends BasePage {
  constructor() {
    super();
    this.processes = [];
    this.filteredProcesses = [];
    this.currentPage = 1;
    this.pageSize = 50;
    this.filters = {};
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
  }

  /**
   * Render the page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'process-list-page';
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
   * Called after page is mounted to DOM
   */
  async mounted() {
    await this.onWillEnter();
  }

  /**
   * Get HTML template (override in subclass)
   */
  getTemplate() {
    const config = this.getListConfig();
    return `
      <ion-header>
        <ion-toolbar>
          <ion-title>${config.title}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-refresher slot="fixed">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <div id="process-list" class="process-list-container"></div>
        <div id="pagination"></div>
      </ion-content>
    `;
  }

  /**
   * Get filter configuration (override in subclass)
   */
  getFilterConfig() {
    return {
      showStatusFilter: true,
      showDateFilter: true,
      showSearch: true,
      showCategoryFilter: false
    };
  }

  /**
   * Get list configuration (override in subclass)
   */
  getListConfig() {
    return {
      title: 'Processes',
      emptyMessage: 'No processes found',
      showCreateButton: true,
      createButtonLabel: 'Create Process'
    };
  }

  /**
   * Load processes
   */
  async loadProcesses() {
    try {
      this.showLoading();

      // Get all processes or filtered by definition/category
      const allProcesses = this.getProcessesToDisplay();

      // Apply filters
      const filtered = this.applyFilters(allProcesses);

      // Sort
      const sorted = this.sortProcesses(filtered);

      // Paginate
      const paginated = this.paginateProcesses(sorted);

      this.processes = allProcesses;
      this.filteredProcesses = filtered;

      this.renderProcessList(paginated);
      this.renderPagination(paginated);

    } catch (error) {
      console.error('Error loading processes:', error);
      this.showError('Failed to load processes');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Get processes to display (override in subclass)
   */
  getProcessesToDisplay() {
    return processState.getAllProcesses();
  }

  /**
   * Apply filters to processes
   */
  applyFilters(processes) {
    let filtered = [...processes];

    // Status filter
    if (this.filters.status) {
      const statuses = Array.isArray(this.filters.status)
        ? this.filters.status
        : [this.filters.status];
      filtered = filtered.filter(p => statuses.includes(p.status));
    }

    // Date range filter
    if (this.filters.dateRange) {
      const { start, end } = this.filters.dateRange;
      filtered = filtered.filter(p => {
        const created = new Date(p.createdAt).getTime();
        return created >= start && created <= end;
      });
    }

    // Search query
    if (this.filters.query) {
      const lowerQuery = this.filters.query.toLowerCase();
      filtered = filtered.filter(p => {
        // Search in process ID
        if (p._id.toLowerCase().includes(lowerQuery)) return true;

        // Search in variables
        if (p.variables) {
          return Object.values(p.variables).some(value => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(lowerQuery);
            }
            return false;
          });
        }

        return false;
      });
    }

    return filtered;
  }

  /**
   * Sort processes
   */
  sortProcesses(processes) {
    return processState.sortProcesses(processes, this.sortBy, this.sortOrder);
  }

  /**
   * Paginate processes
   */
  paginateProcesses(processes) {
    return processState.paginateProcesses(processes, this.currentPage, this.pageSize);
  }

  /**
   * Render process list (override in subclass)
   */
  renderProcessList(paginatedResult) {
    const container = this.querySelector('#process-list');
    if (!container) return;

    const { processes } = paginatedResult;

    if (processes.length === 0) {
      const config = this.getListConfig();
      container.innerHTML = `
        <div class="empty-state">
          <ion-icon name="folder-open-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
          <p>${config.emptyMessage}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = processes.map(process => this.renderProcessCard(process)).join('');
  }

  /**
   * Render process card (override in subclass for custom rendering)
   */
  renderProcessCard(process) {
    const definition = processService.getDefinition(process.definitionId);
    const statusColor = this.getStatusColor(process.status);
    const icon = definition?.metadata?.icon || 'document';
    const color = definition?.metadata?.color || '#666';

    return `
      <ion-card class="process-card" onclick="window.app.navigate('/process/${process._id}')">
        <ion-card-content>
          <div class="process-card-header">
            <div class="process-icon" style="background-color: ${color}20; color: ${color};">
              <ion-icon name="${icon}"></ion-icon>
            </div>
            <div class="process-info">
              <h3>${definition?.name || 'Process'}</h3>
              <p class="process-id">${process._id}</p>
            </div>
            <ion-badge color="${statusColor}">${process.status}</ion-badge>
          </div>

          <div class="process-card-body">
            ${this.renderProcessCardBody(process, definition)}
          </div>

          <div class="process-card-footer">
            <span class="timestamp">
              <ion-icon name="time-outline"></ion-icon>
              ${this.formatDate(process.createdAt)}
            </span>
            <span class="state-badge">${process.currentState}</span>
          </div>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Render process card body (override for custom fields)
   */
  renderProcessCardBody(process, definition) {
    return `
      <p>${process.variables?.description || definition?.description || ''}</p>
    `;
  }

  /**
   * Render pagination
   */
  renderPagination(paginatedResult) {
    const container = this.querySelector('#pagination');
    if (!container) return;

    const { page, pages, hasNext, hasPrev, total } = paginatedResult;

    if (pages <= 1) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="pagination">
        <ion-button
          fill="clear"
          size="small"
          ${!hasPrev ? 'disabled' : ''}
          onclick="window.app.currentPage.goToPage(${page - 1})">
          <ion-icon slot="icon-only" name="chevron-back"></ion-icon>
        </ion-button>

        <span class="pagination-info">Page ${page} of ${pages} (${total} total)</span>

        <ion-button
          fill="clear"
          size="small"
          ${!hasNext ? 'disabled' : ''}
          onclick="window.app.currentPage.goToPage(${page + 1})">
          <ion-icon slot="icon-only" name="chevron-forward"></ion-icon>
        </ion-button>
      </div>
    `;
  }

  /**
   * Go to page
   */
  goToPage(page) {
    this.currentPage = page;
    this.loadProcesses();
  }

  /**
   * Apply filters
   */
  applyFilter(filterKey, filterValue) {
    this.filters[filterKey] = filterValue;
    this.currentPage = 1; // Reset to first page
    this.loadProcesses();
  }

  /**
   * Clear filters
   */
  clearFilters() {
    this.filters = {};
    this.currentPage = 1;
    this.loadProcesses();
  }

  /**
   * Change sort
   */
  changeSort(sortBy, sortOrder = 'desc') {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.loadProcesses();
  }

  /**
   * Get status color for badge
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
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Show loading
   */
  showLoading() {
    const container = this.querySelector('#process-list');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <ion-spinner></ion-spinner>
          <p>Loading processes...</p>
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
    const container = this.querySelector('#process-list');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <ion-icon name="alert-circle-outline" style="font-size: 64px; color: var(--ion-color-danger);"></ion-icon>
          <p>${message}</p>
          <ion-button onclick="window.app.currentPage.loadProcesses()">Retry</ion-button>
        </div>
      `;
    }
  }

  /**
   * Setup refresh
   */
  setupRefresh() {
    const refresher = this.querySelector('ion-refresher');
    if (refresher) {
      refresher.addEventListener('ionRefresh', async (event) => {
        await this.loadProcesses();
        event.target.complete();
      });
    }
  }

  /**
   * Lifecycle: Page will enter
   */
  async onWillEnter() {
    await this.loadProcesses();
    this.setupRefresh();

    // Subscribe to process state changes
    this.unsubscribe = processState.subscribe(() => {
      this.loadProcesses();
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

export default BaseProcessListPage;
