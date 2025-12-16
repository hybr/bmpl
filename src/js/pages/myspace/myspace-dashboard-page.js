/**
 * My Space Dashboard Page
 * Main dashboard showing process metrics, activity, and action items
 */

import BasePage from '../base/base-page.js';
import { processState } from '../../state/process-state.js';
import { processService } from '../../services/bpm/process-service.js';
import { analyticsService } from '../../services/bpm/analytics-service.js';
import { taskService } from '../../services/bpm/task-service.js';
import { formatDate, getRelativeTime } from '../../utils/date-utils.js';

export class MySpaceDashboardPage extends BasePage {
  constructor() {
    super();
    this.stats = null;
    this.recentProcesses = [];
    this.myTasks = [];
  }

  /**
   * Load dashboard data
   */
  async loadDashboard() {
    try {
      // Load statistics
      await this.loadStats();

      // Load recent processes
      await this.loadRecentProcesses();

      // Load my tasks
      await this.loadMyTasks();

      // Render all sections
      this.renderStats();
      this.renderRecentActivity();
      this.renderActionItems();

    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.showError('Failed to load dashboard');
    }
  }

  /**
   * Load statistics
   */
  async loadStats() {
    this.stats = processState.getStatistics();

    // Get category breakdown
    const allProcesses = processState.getAllProcesses();
    this.categoryStats = {};

    allProcesses.forEach(process => {
      const definition = processService.getDefinition(process.definitionId);
      const category = definition?.metadata?.category || 'other';

      if (!this.categoryStats[category]) {
        this.categoryStats[category] = 0;
      }
      this.categoryStats[category]++;
    });
  }

  /**
   * Load recent processes
   */
  async loadRecentProcesses() {
    const allProcesses = processState.getProcessesSortedByUpdate(false);
    this.recentProcesses = allProcesses.slice(0, 10); // Get last 10
  }

  /**
   * Load my tasks
   */
  async loadMyTasks() {
    // Get all active processes
    const activeProcesses = processState.getActiveProcesses();

    // Get tasks requiring action
    this.myTasks = [];

    for (const process of activeProcesses) {
      const definition = processService.getDefinition(process.definitionId);
      const currentState = definition?.states?.[process.currentState];

      if (currentState?.requiredActions) {
        currentState.requiredActions.forEach(action => {
          this.myTasks.push({
            processId: process._id,
            process: process,
            definition: definition,
            action: action
          });
        });
      }
    }
  }

  /**
   * Render statistics cards
   */
  renderStats() {
    const container = this.querySelector('#dashboard-stats');
    if (!container) return;

    const stats = this.stats || {};

    container.innerHTML = `
      <div class="stats-grid">
        <ion-card class="stat-card" onclick="window.app.navigate('/myspace/processes?status=active')">
          <ion-card-content>
            <div class="stat-icon" style="background-color: var(--ion-color-primary-tint);">
              <ion-icon name="pulse" color="primary"></ion-icon>
            </div>
            <div class="stat-info">
              <h2>${stats.active || 0}</h2>
              <p>Active</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card" onclick="window.app.navigate('/myspace/tasks')">
          <ion-card-content>
            <div class="stat-icon" style="background-color: var(--ion-color-warning-tint);">
              <ion-icon name="checkbox" color="warning"></ion-icon>
            </div>
            <div class="stat-info">
              <h2>${this.myTasks.length}</h2>
              <p>My Tasks</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card" onclick="window.app.navigate('/myspace/processes?status=completed')">
          <ion-card-content>
            <div class="stat-icon" style="background-color: var(--ion-color-success-tint);">
              <ion-icon name="checkmark-circle" color="success"></ion-icon>
            </div>
            <div class="stat-info">
              <h2>${stats.completed || 0}</h2>
              <p>Completed</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card" onclick="window.app.navigate('/myspace/processes')">
          <ion-card-content>
            <div class="stat-icon" style="background-color: var(--ion-color-medium-tint);">
              <ion-icon name="folder" color="medium"></ion-icon>
            </div>
            <div class="stat-info">
              <h2>${stats.total || 0}</h2>
              <p>Total</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      ${this.renderCategoryBreakdown()}
    `;
  }

  /**
   * Render category breakdown
   */
  renderCategoryBreakdown() {
    if (!this.categoryStats || Object.keys(this.categoryStats).length === 0) {
      return '';
    }

    const categories = Object.entries(this.categoryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 categories

    return `
      <ion-card>
        <ion-card-header>
          <ion-card-title>By Category</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="category-list">
            ${categories.map(([category, count]) => `
              <div class="category-item" onclick="window.app.navigate('/myspace/processes?category=${category}')">
                <span class="category-name">${this.formatCategoryName(category)}</span>
                <ion-badge>${count}</ion-badge>
              </div>
            `).join('')}
          </div>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Render recent activity
   */
  renderRecentActivity() {
    const container = this.querySelector('#recent-activity');
    if (!container) return;

    if (this.recentProcesses.length === 0) {
      container.innerHTML = `
        <ion-card>
          <ion-card-header>
            <ion-card-title>Recent Activity</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="empty-state">
              <ion-icon name="time-outline" style="font-size: 48px; color: var(--ion-color-medium);"></ion-icon>
              <p>No recent activity</p>
            </div>
          </ion-card-content>
        </ion-card>
      `;
      return;
    }

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Recent Activity</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            ${this.recentProcesses.map(process => this.renderActivityItem(process)).join('')}
          </ion-list>
          <ion-button
            expand="block"
            fill="clear"
            size="small"
            onclick="window.app.navigate('/myspace/processes')">
            View All Processes
          </ion-button>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Render activity item
   */
  renderActivityItem(process) {
    const definition = processService.getDefinition(process.definitionId);
    const icon = definition?.metadata?.icon || 'document';
    const color = definition?.metadata?.color || '#666';
    const statusColor = this.getStatusColor(process.status);

    return `
      <ion-item button onclick="window.app.navigate('/process/${process._id}')">
        <div slot="start" class="activity-icon" style="background-color: ${color}20; color: ${color};">
          <ion-icon name="${icon}"></ion-icon>
        </div>
        <ion-label>
          <h3>${definition?.name || 'Process'}</h3>
          <p>${process._id}</p>
          <p class="timestamp">${getRelativeTime(process.updatedAt || process.createdAt)}</p>
        </ion-label>
        <ion-badge slot="end" color="${statusColor}">${process.currentState}</ion-badge>
      </ion-item>
    `;
  }

  /**
   * Render action items
   */
  renderActionItems() {
    const container = this.querySelector('#action-items');
    if (!container) return;

    if (this.myTasks.length === 0) {
      container.innerHTML = `
        <ion-card>
          <ion-card-header>
            <ion-card-title>Action Items</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="empty-state">
              <ion-icon name="checkmark-done-outline" style="font-size: 48px; color: var(--ion-color-success);"></ion-icon>
              <p>No pending actions</p>
            </div>
          </ion-card-content>
        </ion-card>
      `;
      return;
    }

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Action Items</ion-card-title>
          <ion-badge color="warning">${this.myTasks.length}</ion-badge>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            ${this.myTasks.map(task => this.renderActionItem(task)).join('')}
          </ion-list>
          <ion-button
            expand="block"
            fill="clear"
            size="small"
            onclick="window.app.navigate('/myspace/tasks')">
            View All Tasks
          </ion-button>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Render action item
   */
  renderActionItem(task) {
    const { process, definition, action } = task;
    const icon = definition?.metadata?.icon || 'document';
    const color = definition?.metadata?.color || '#666';

    return `
      <ion-item button onclick="window.app.navigate('/process/${process._id}')">
        <div slot="start" class="action-icon" style="background-color: ${color}; color: white;">
          <ion-icon name="${icon}"></ion-icon>
        </div>
        <ion-label>
          <h3>${action.message || action.actionLabel || 'Action Required'}</h3>
          <p>${definition?.name || 'Process'} - ${process._id}</p>
          <p class="timestamp">${getRelativeTime(process.updatedAt || process.createdAt)}</p>
        </ion-label>
        <ion-icon slot="end" name="chevron-forward" color="medium"></ion-icon>
      </ion-item>
    `;
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
   * Setup refresh
   */
  setupRefresh() {
    const refresher = this.querySelector('ion-refresher');
    if (refresher) {
      refresher.addEventListener('ionRefresh', async (event) => {
        await this.loadDashboard();
        event.target.complete();
      });
    }
  }

  /**
   * Show error
   */
  showError(message) {
    const container = this.querySelector('#dashboard-content');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <ion-icon name="alert-circle-outline" style="font-size: 64px; color: var(--ion-color-danger);"></ion-icon>
          <p>${message}</p>
          <ion-button onclick="window.app.currentPage.loadDashboard()">Retry</ion-button>
        </div>
      `;
    }
  }

  /**
   * Lifecycle: Page will enter
   */
  async onWillEnter() {
    await this.loadDashboard();
    this.setupRefresh();

    // Subscribe to process state changes
    this.unsubscribe = processState.subscribe(() => {
      this.loadDashboard();
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

  /**
   * Get HTML template
   */
  getTemplate() {
    return `
      <ion-header>
        <ion-toolbar>
          <ion-title>Dashboard</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="window.app.currentPage.loadDashboard()">
              <ion-icon slot="icon-only" name="refresh"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-refresher slot="fixed">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <div id="dashboard-content" class="dashboard-container">
          <div id="dashboard-stats"></div>
          <div id="action-items"></div>
          <div id="recent-activity"></div>
        </div>
      </ion-content>
    `;
  }
}

// Register page
customElements.define('page-myspace-dashboard', MySpaceDashboardPage);

export default MySpaceDashboardPage;
