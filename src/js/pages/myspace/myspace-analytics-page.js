/**
 * Analytics Page
 * Comprehensive reports and analytics dashboard
 */

import { BasePage } from '../base/base-page.js';
import { analyticsService } from '../../services/bpm/analytics-service.js';
import { exportService } from '../../services/bpm/export-service.js';
import { processState } from '../../state/process-state.js';
import { BarChart } from '../../components/charts/bar-chart.js';
import { LineChart } from '../../components/charts/line-chart.js';
import { PieChart } from '../../components/charts/pie-chart.js';
import { PROCESS_CATEGORIES } from '../../config/constants.js';

export class MySpaceAnalyticsPage extends BasePage {
  constructor() {
    super();
    this.currentReport = 'process_efficiency';
    this.charts = {};
    this.filters = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date(),
      category: null,
      status: null
    };
  }

  async onEnter() {
    this.render();
    this.loadReport(this.currentReport);
  }

  onExit() {
    // Cleanup charts
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
    this.charts = {};
  }

  getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    return date;
  }

  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="analytics-page" style="padding: 20px;">
        <div class="page-header" style="margin-bottom: 20px;">
          <h1 style="margin: 0 0 10px 0;">Analytics & Reports</h1>
          <p style="color: #6b7280; margin: 0;">Comprehensive process analytics and reporting</p>
        </div>

        <!-- Report Controls -->
        <div class="report-controls" style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">

            <!-- Report Selector -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 14px;">Report Type</label>
              <select id="report-selector" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                <option value="process_efficiency">Process Efficiency</option>
                <option value="sla_compliance">SLA Compliance</option>
                <option value="user_productivity">User Productivity</option>
                <option value="financial_summary">Financial Summary</option>
                <option value="audit_report">Audit Report</option>
              </select>
            </div>

            <!-- Date Range -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 14px;">Start Date</label>
              <input type="date" id="start-date" value="${this.formatDateInput(this.filters.startDate)}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" />
            </div>

            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 14px;">End Date</label>
              <input type="date" id="end-date" value="${this.formatDateInput(this.filters.endDate)}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" />
            </div>

            <!-- Category Filter -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 14px;">Category</label>
              <select id="category-filter" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                <option value="">All Categories</option>
                ${Object.values(PROCESS_CATEGORIES).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="refresh-report" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
              <ion-icon name="refresh-outline" style="vertical-align: middle;"></ion-icon> Refresh
            </button>
            <button id="export-csv" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
              <ion-icon name="download-outline" style="vertical-align: middle;"></ion-icon> Export CSV
            </button>
            <button id="export-json" style="padding: 8px 16px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
              <ion-icon name="code-download-outline" style="vertical-align: middle;"></ion-icon> Export JSON
            </button>
            <button id="print-report" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
              <ion-icon name="print-outline" style="vertical-align: middle;"></ion-icon> Print
            </button>
          </div>
        </div>

        <!-- Report Display Area -->
        <div id="report-container" style="min-height: 400px;">
          <div style="text-align: center; padding: 40px; color: #9ca3af;">
            <ion-icon name="analytics-outline" style="font-size: 48px;"></ion-icon>
            <p>Loading report...</p>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Report selector
    const selector = document.getElementById('report-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        this.currentReport = e.target.value;
        this.loadReport(this.currentReport);
      });
    }

    // Date filters
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    if (startDate) {
      startDate.addEventListener('change', (e) => {
        this.filters.startDate = new Date(e.target.value);
      });
    }
    if (endDate) {
      endDate.addEventListener('change', (e) => {
        this.filters.endDate = new Date(e.target.value);
      });
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.filters.category = e.target.value || null;
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-report');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadReport(this.currentReport);
      });
    }

    // Export buttons
    const exportCSV = document.getElementById('export-csv');
    if (exportCSV) {
      exportCSV.addEventListener('click', () => this.exportReport('csv'));
    }

    const exportJSON = document.getElementById('export-json');
    if (exportJSON) {
      exportJSON.addEventListener('click', () => this.exportReport('json'));
    }

    const printBtn = document.getElementById('print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printReport());
    }
  }

  loadReport(reportType) {
    // Cleanup existing charts
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.destroy) chart.destroy();
    });
    this.charts = {};

    // Load the selected report
    switch (reportType) {
      case 'process_efficiency':
        this.renderProcessEfficiencyReport();
        break;
      case 'sla_compliance':
        this.renderSLAComplianceReport();
        break;
      case 'user_productivity':
        this.renderUserProductivityReport();
        break;
      case 'financial_summary':
        this.renderFinancialSummaryReport();
        break;
      case 'audit_report':
        this.renderAuditReport();
        break;
    }
  }

  /**
   * Process Efficiency Report
   */
  renderProcessEfficiencyReport() {
    const filters = this.getFilters();
    const data = analyticsService.getProcessEfficiencyReport(filters);

    const container = document.getElementById('report-container');
    container.innerHTML = `
      <div class="efficiency-report">
        <h2 style="margin: 0 0 20px 0;">Process Efficiency Report</h2>

        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Process Types</div>
            <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${data.summary.totalProcessTypes}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Total Processes</div>
            <div style="font-size: 32px; font-weight: bold; color: #10b981;">${data.summary.totalProcesses}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Avg Completion Rate</div>
            <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${data.summary.averageCompletionRate.toFixed(1)}%</div>
          </div>
        </div>

        <!-- Duration Chart -->
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0;">Average Duration by Process Type</h3>
          <canvas id="efficiency-chart" style="max-height: 400px;"></canvas>
        </div>

        <!-- Process Table -->
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0;">Process Details</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Process Name</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Category</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Total</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Completed</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Completion %</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Avg Duration</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Top Bottleneck</th>
                </tr>
              </thead>
              <tbody>
                ${data.byType.map((item, index) => `
                  <tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                    <td style="padding: 12px;">${item.name}</td>
                    <td style="padding: 12px;">${item.category}</td>
                    <td style="padding: 12px; text-align: right;">${item.total}</td>
                    <td style="padding: 12px; text-align: right;">${item.completed}</td>
                    <td style="padding: 12px; text-align: right;">${item.completionRate.toFixed(1)}%</td>
                    <td style="padding: 12px; text-align: right;">${this.formatDuration(item.avgDuration)}</td>
                    <td style="padding: 12px;">${item.topBottleneck ? item.topBottleneck.state : 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Create chart
    setTimeout(() => {
      const chartData = data.byType.slice(0, 10).map(item => ({
        label: item.name,
        value: item.avgDuration / (1000 * 60 * 60) // Convert to hours
      }));

      this.charts.efficiency = new BarChart('efficiency-chart', {
        title: '',
        type: 'horizontal',
        barColor: '#3b82f6',
        valueSuffix: 'h',
        showValues: true
      });
      this.charts.efficiency.setData(chartData);
    }, 100);
  }

  /**
   * SLA Compliance Report
   */
  renderSLAComplianceReport() {
    const filters = this.getFilters();
    const data = analyticsService.getSLACompliance(filters);

    const container = document.getElementById('report-container');
    container.innerHTML = `
      <div class="sla-report">
        <h2 style="margin: 0 0 20px 0;">SLA Compliance Report</h2>

        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Compliance Rate</div>
            <div style="font-size: 32px; font-weight: bold; color: ${data.complianceRate >= 80 ? '#10b981' : '#ef4444'};">${data.complianceRate.toFixed(1)}%</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">On Time</div>
            <div style="font-size: 32px; font-weight: bold; color: #10b981;">${data.onTime}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Breached</div>
            <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${data.breached}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">At Risk</div>
            <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${data.atRisk}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <!-- Compliance Pie Chart -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 15px 0;">Compliance Overview</h3>
            <canvas id="sla-pie-chart" style="max-height: 300px;"></canvas>
          </div>

          <!-- Breaches by Category -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 15px 0;">Breaches by Category</h3>
            <canvas id="sla-bar-chart" style="max-height: 300px;"></canvas>
          </div>
        </div>

        <!-- Metrics -->
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0;">Performance Metrics</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div style="padding: 15px; background: #f9fafb; border-radius: 4px;">
              <div style="font-weight: 600; margin-bottom: 5px;">Average Response Time</div>
              <div style="font-size: 20px; color: #3b82f6;">${this.formatDuration(data.averageResponseTime)}</div>
            </div>
            <div style="padding: 15px; background: #f9fafb; border-radius: 4px;">
              <div style="font-weight: 600; margin-bottom: 5px;">Total Processes with SLA</div>
              <div style="font-size: 20px; color: #3b82f6;">${data.total}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      // Pie chart
      this.charts.slaPie = new PieChart('sla-pie-chart', {
        title: '',
        type: 'donut',
        colors: ['#10b981', '#ef4444', '#f59e0b'],
        legendPosition: 'bottom'
      });
      this.charts.slaPie.setData([
        { label: 'On Time', value: data.onTime },
        { label: 'Breached', value: data.breached },
        { label: 'At Risk', value: data.atRisk }
      ]);

      // Bar chart for breaches
      const breachData = Object.entries(data.breachesByCategory).map(([category, count]) => ({
        label: category,
        value: count
      }));

      if (breachData.length > 0) {
        this.charts.slaBar = new BarChart('sla-bar-chart', {
          title: '',
          type: 'vertical',
          barColor: '#ef4444',
          showValues: true
        });
        this.charts.slaBar.setData(breachData);
      }
    }, 100);
  }

  /**
   * User Productivity Report
   */
  renderUserProductivityReport() {
    const workload = analyticsService.getWorkloadDistribution();

    const container = document.getElementById('report-container');
    container.innerHTML = `
      <div class="productivity-report">
        <h2 style="margin: 0 0 20px 0;">User Productivity Report</h2>

        <!-- User Workload Chart -->
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0;">User Workload Distribution</h3>
          <canvas id="productivity-chart" style="max-height: 400px;"></canvas>
        </div>

        <!-- User Table -->
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0;">User Details</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">User ID</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Total Processes</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Active</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Completed</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Pending Actions</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Completion %</th>
                </tr>
              </thead>
              <tbody>
                ${workload.slice(0, 20).map((user, index) => {
                  const completionRate = user.totalProcesses > 0 ? (user.completedProcesses / user.totalProcesses * 100) : 0;
                  return `
                    <tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                      <td style="padding: 12px;">${user.userId}</td>
                      <td style="padding: 12px; text-align: right;">${user.totalProcesses}</td>
                      <td style="padding: 12px; text-align: right;">${user.activeProcesses}</td>
                      <td style="padding: 12px; text-align: right;">${user.completedProcesses}</td>
                      <td style="padding: 12px; text-align: right;">${user.pendingActions}</td>
                      <td style="padding: 12px; text-align: right;">${completionRate.toFixed(1)}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const chartData = workload.slice(0, 10).map(user => ({
        label: user.userId,
        value: user.totalProcesses
      }));

      this.charts.productivity = new BarChart('productivity-chart', {
        title: '',
        type: 'horizontal',
        barColor: '#8b5cf6',
        showValues: true
      });
      this.charts.productivity.setData(chartData);
    }, 100);
  }

  /**
   * Financial Summary Report
   */
  renderFinancialSummaryReport() {
    const filters = this.getFilters();
    const data = analyticsService.getFinancialAnalytics(filters);

    const container = document.getElementById('report-container');
    container.innerHTML = `
      <div class="financial-report">
        <h2 style="margin: 0 0 20px 0;">Financial Summary Report</h2>

        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Total Invoices</div>
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">$${data.totalInvoiceAmount.toLocaleString()}</div>
            <div style="font-size: 12px; color: #9ca3af;">${data.totalInvoices} invoices</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Total Expenses</div>
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">$${data.totalExpenseAmount.toLocaleString()}</div>
            <div style="font-size: 12px; color: #9ca3af;">${data.totalExpenses} expenses</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Sales Orders</div>
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">$${data.totalSalesAmount.toLocaleString()}</div>
            <div style="font-size: 12px; color: #9ca3af;">${data.totalSalesOrders} orders</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Purchase Orders</div>
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">$${data.totalPOAmount.toLocaleString()}</div>
            <div style="font-size: 12px; color: #9ca3af;">${data.totalPurchaseOrders} POs</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <!-- Category Pie Chart -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 15px 0;">Amount by Category</h3>
            <canvas id="financial-pie-chart" style="max-height: 300px;"></canvas>
          </div>

          <!-- Type Comparison -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 15px 0;">Financial Overview</h3>
            <canvas id="financial-bar-chart" style="max-height: 300px;"></canvas>
          </div>
        </div>

        <!-- Outstanding -->
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0;">Outstanding & Pending</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div style="padding: 15px; background: #fef3c7; border-radius: 4px; border-left: 4px solid #f59e0b;">
              <div style="font-weight: 600; margin-bottom: 5px;">Outstanding Invoices</div>
              <div style="font-size: 20px; color: #d97706;">$${data.outstandingInvoiceAmount.toLocaleString()}</div>
              <div style="font-size: 12px; color: #92400e;">${data.outstandingInvoices} invoices</div>
            </div>
            <div style="padding: 15px; background: #fee2e2; border-radius: 4px; border-left: 4px solid #ef4444;">
              <div style="font-weight: 600; margin-bottom: 5px;">Pending Expenses</div>
              <div style="font-size: 20px; color: #dc2626;">$${data.pendingExpenseAmount.toLocaleString()}</div>
              <div style="font-size: 12px; color: #991b1b;">${data.pendingExpenses} expenses</div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      // Category pie chart
      const categoryData = Object.entries(data.byCategory)
        .filter(([_, value]) => value.amount > 0)
        .map(([category, value]) => ({
          label: category,
          value: value.amount
        }));

      if (categoryData.length > 0) {
        this.charts.financialPie = new PieChart('financial-pie-chart', {
          title: '',
          type: 'donut',
          valuePrefix: '$',
          legendPosition: 'bottom'
        });
        this.charts.financialPie.setData(categoryData);
      }

      // Type bar chart
      const typeData = [
        { label: 'Invoices', value: data.totalInvoiceAmount },
        { label: 'Expenses', value: data.totalExpenseAmount },
        { label: 'Sales', value: data.totalSalesAmount },
        { label: 'Purchase Orders', value: data.totalPOAmount }
      ].filter(item => item.value > 0);

      if (typeData.length > 0) {
        this.charts.financialBar = new BarChart('financial-bar-chart', {
          title: '',
          type: 'vertical',
          valuePrefix: '$',
          showValues: true,
          barColors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']
        });
        this.charts.financialBar.setData(typeData);
      }
    }, 100);
  }

  /**
   * Audit Report
   */
  renderAuditReport() {
    const filters = this.getFilters();
    const processes = exportService.getFilteredProcesses(filters).slice(0, 50); // Limit to 50 for performance

    const container = document.getElementById('report-container');
    container.innerHTML = `
      <div class="audit-report">
        <h2 style="margin: 0 0 20px 0;">Audit Report</h2>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <p style="color: #6b7280; margin: 0;">
            Showing audit trail for ${processes.length} processes. Export for complete audit log.
          </p>
        </div>

        ${processes.map(process => `
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
              <div>
                <h3 style="margin: 0 0 5px 0;">${process.definitionId}</h3>
                <div style="color: #6b7280; font-size: 14px;">ID: ${process._id}</div>
              </div>
              <div style="padding: 4px 12px; background: ${this.getStatusColor(process.status)}; color: white; border-radius: 12px; font-size: 12px;">
                ${process.status}
              </div>
            </div>

            <!-- State History -->
            ${(process.stateHistory && process.stateHistory.length > 0) ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                      <th style="padding: 8px; text-align: left; font-weight: 600;">Timestamp</th>
                      <th style="padding: 8px; text-align: left; font-weight: 600;">From State</th>
                      <th style="padding: 8px; text-align: left; font-weight: 600;">To State</th>
                      <th style="padding: 8px; text-align: left; font-weight: 600;">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${process.stateHistory.map((entry, index) => `
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px;">${new Date(entry.timestamp).toLocaleString()}</td>
                        <td style="padding: 8px;">${entry.from || '-'}</td>
                        <td style="padding: 8px;">${entry.to || '-'}</td>
                        <td style="padding: 8px;">${entry.userId || entry.by || 'system'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<p style="color: #9ca3af; font-style: italic;">No state history available</p>'}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Export report data
   */
  exportReport(format) {
    const filters = this.getFilters();
    const processes = exportService.getFilteredProcesses(filters);

    if (processes.length === 0) {
      alert('No data to export');
      return;
    }

    const timestamp = exportService.getDateString();
    const reportName = this.currentReport.replace(/_/g, '-');

    if (format === 'csv') {
      const fields = [
        { key: '_id', label: 'Process ID' },
        { key: 'definitionId', label: 'Type' },
        { key: 'currentState', label: 'State' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created' },
        { key: 'updatedAt', label: 'Updated' }
      ];
      exportService.exportProcessesAsCSV(processes, fields, `${reportName}_${timestamp}.csv`);
    } else if (format === 'json') {
      exportService.exportProcessesAsJSON(processes, `${reportName}_${timestamp}.json`);
    }
  }

  /**
   * Print report
   */
  printReport() {
    window.print();
  }

  /**
   * Helper: Get filters for analytics
   */
  getFilters() {
    const filters = {};

    if (this.filters.category) {
      filters.category = this.filters.category;
    }

    if (this.filters.startDate && this.filters.endDate) {
      filters.timeRange = {
        start: this.filters.startDate.getTime(),
        end: this.filters.endDate.getTime()
      };
    }

    return filters;
  }

  /**
   * Helper: Format duration
   */
  formatDuration(ms) {
    if (ms === 0) return '0s';

    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '< 1m';
  }

  /**
   * Helper: Format date for input
   */
  formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Get status color
   */
  getStatusColor(status) {
    const colors = {
      active: '#3b82f6',
      completed: '#10b981',
      cancelled: '#6b7280',
      failed: '#ef4444',
      suspended: '#f59e0b'
    };
    return colors[status] || '#6b7280';
  }
}

export default MySpaceAnalyticsPage;
