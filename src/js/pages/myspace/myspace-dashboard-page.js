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
import { LineChart } from '../../components/charts/line-chart.js';
import { PieChart } from '../../components/charts/pie-chart.js';
import { BarChart } from '../../components/charts/bar-chart.js';

export class MySpaceDashboardPage extends BasePage {
  constructor() {
    super();
    this.stats = null;
    this.recentProcesses = [];
    this.myTasks = [];
    this.charts = {};
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
      this.renderCharts();
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
   * Render charts (Phase 5 Enhancement)
   */
  renderCharts() {
    const container = this.querySelector('#dashboard-charts');
    if (!container) return;

    // Cleanup existing charts
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.destroy) chart.destroy();
    });
    this.charts = {};

    // Get analytics data
    const last30Days = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime(),
      end: Date.now()
    };

    const trendData = analyticsService.getProcessTrend(null, 'day', last30Days);
    const categoryData = analyticsService.getProcessesByCategory();
    const efficiencyData = analyticsService.getProcessEfficiencyReport({});

    container.innerHTML = `
      <div class="charts-container" style="margin: 20px 0;">
        <!-- Process Trend Chart -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Process Trend (Last 30 Days)</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div style="position: relative; height: 250px;">
              <canvas id="trend-chart" style="width: 100%; height: 100%;"></canvas>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Category & Top Processes Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
          <!-- Category Distribution -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>By Category</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div style="position: relative; height: 250px;">
                <canvas id="category-chart" style="width: 100%; height: 100%;"></canvas>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Top Process Types -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Top Process Types</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div style="position: relative; height: 250px;">
                <canvas id="top-processes-chart" style="width: 100%; height: 100%;"></canvas>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Advanced Metrics -->
        <ion-card style="margin-top: 16px;">
          <ion-card-header>
            <ion-card-title>Performance Metrics</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              ${this.renderAdvancedMetrics()}
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    `;

    // Render charts after DOM is ready
    setTimeout(() => {
      this.renderTrendChart(trendData);
      this.renderCategoryChart(categoryData);
      this.renderTopProcessesChart(efficiencyData);
    }, 100);
  }

  /**
   * Render process trend chart
   */
  renderTrendChart(trendData) {
    if (!trendData || trendData.length === 0) return;

    const labels = trendData.map(d => {
      const date = new Date(d.period);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const chartData = {
      labels: labels,
      series: [
        {
          name: 'Created',
          values: trendData.map(d => d.created),
          color: '#3b82f6'
        },
        {
          name: 'Completed',
          values: trendData.map(d => d.completed),
          color: '#10b981'
        }
      ]
    };

    this.charts.trend = new LineChart('trend-chart', {
      title: '',
      type: 'line',
      smooth: true,
      showLegend: true,
      showPoints: true
    });
    this.charts.trend.setData(chartData);
  }

  /**
   * Render category distribution chart
   */
  renderCategoryChart(categoryData) {
    const data = Object.entries(categoryData)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        label: this.formatCategoryName(category),
        value: count
      }));

    if (data.length === 0) return;

    this.charts.category = new PieChart('category-chart', {
      title: '',
      type: 'donut',
      showLegend: true,
      legendPosition: 'right'
    });
    this.charts.category.setData(data);
  }

  /**
   * Render top processes chart
   */
  renderTopProcessesChart(efficiencyData) {
    if (!efficiencyData || !efficiencyData.byType) return;

    const data = efficiencyData.byType
      .slice(0, 5)
      .map(item => ({
        label: item.name,
        value: item.total
      }));

    if (data.length === 0) return;

    this.charts.topProcesses = new BarChart('top-processes-chart', {
      title: '',
      type: 'horizontal',
      barColor: '#f59e0b',
      showValues: true
    });
    this.charts.topProcesses.setData(data);
  }

  /**
   * Render advanced metrics
   */
  renderAdvancedMetrics() {
    const metrics = analyticsService.getProcessMetrics({});
    const sla = analyticsService.getSLACompliance({});

    const completionRate = metrics.completionRate || 0;
    const avgDuration = metrics.avgDuration || 0;
    const slaCompliance = sla.complianceRate || 0;

    return `
      <div style="padding: 16px; background: var(--ion-color-light); border-radius: 8px;">
        <div style="font-size: 12px; color: var(--ion-color-medium); margin-bottom: 4px;">Completion Rate</div>
        <div style="font-size: 24px; font-weight: bold; color: var(--ion-color-success);">${completionRate.toFixed(1)}%</div>
      </div>
      <div style="padding: 16px; background: var(--ion-color-light); border-radius: 8px;">
        <div style="font-size: 12px; color: var(--ion-color-medium); margin-bottom: 4px;">Avg Duration</div>
        <div style="font-size: 24px; font-weight: bold; color: var(--ion-color-primary);">${this.formatDuration(avgDuration)}</div>
      </div>
      <div style="padding: 16px; background: var(--ion-color-light); border-radius: 8px;">
        <div style="font-size: 12px; color: var(--ion-color-medium); margin-bottom: 4px;">SLA Compliance</div>
        <div style="font-size: 24px; font-weight: bold; color: ${slaCompliance >= 80 ? 'var(--ion-color-success)' : 'var(--ion-color-danger)'};">${slaCompliance.toFixed(1)}%</div>
      </div>
      <div style="padding: 16px; background: var(--ion-color-light); border-radius: 8px;">
        <div style="font-size: 12px; color: var(--ion-color-medium); margin-bottom: 4px;">Active Rate</div>
        <div style="font-size: 24px; font-weight: bold; color: var(--ion-color-warning);">${(metrics.activeRate || 0).toFixed(1)}%</div>
      </div>
    `;
  }

  /**
   * Format duration helper
   */
  formatDuration(ms) {
    if (ms === 0) return '0s';

    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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

    // Cleanup charts
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.destroy) chart.destroy();
    });
    this.charts = {};
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
          <div id="dashboard-charts"></div>
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
