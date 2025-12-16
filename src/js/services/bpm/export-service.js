/**
 * Export Service
 * Handles data export in various formats (CSV, JSON, PDF)
 */

import { processState } from '../../state/process-state.js';
import { processService } from './process-service.js';

class ExportService {
  /**
   * Export processes to CSV
   * @param {array} processes - Array of process instances
   * @param {array} fields - Fields to include in export
   * @returns {string} CSV content
   */
  exportToCSV(processes, fields = null) {
    if (!processes || processes.length === 0) {
      throw new Error('No processes to export');
    }

    // Default fields if not specified
    if (!fields) {
      fields = [
        { key: '_id', label: 'Process ID' },
        { key: 'definitionId', label: 'Process Type' },
        { key: 'currentState', label: 'Current State' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'updatedAt', label: 'Updated At' }
      ];
    }

    // Build CSV header
    const headers = fields.map(f => this.escapeCSV(f.label)).join(',');

    // Build CSV rows
    const rows = processes.map(process => {
      return fields.map(field => {
        const value = this.getNestedValue(process, field.key);
        return this.escapeCSV(this.formatValue(value));
      }).join(',');
    });

    // Combine header and rows
    return [headers, ...rows].join('\n');
  }

  /**
   * Export processes to JSON
   * @param {array} processes - Array of process instances
   * @param {boolean} pretty - Pretty print JSON
   * @returns {string} JSON content
   */
  exportToJSON(processes, pretty = true) {
    if (!processes || processes.length === 0) {
      throw new Error('No processes to export');
    }

    const data = {
      exportedAt: new Date().toISOString(),
      count: processes.length,
      processes: processes
    };

    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Download exported data as file
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  /**
   * Export processes as CSV file
   * @param {array} processes - Array of process instances
   * @param {array} fields - Fields to include
   * @param {string} filename - Optional filename
   */
  exportProcessesAsCSV(processes, fields = null, filename = null) {
    const csv = this.exportToCSV(processes, fields);
    const defaultFilename = `processes_export_${this.getDateString()}.csv`;
    this.downloadFile(csv, filename || defaultFilename, 'text/csv');
  }

  /**
   * Export processes as JSON file
   * @param {array} processes - Array of process instances
   * @param {string} filename - Optional filename
   */
  exportProcessesAsJSON(processes, filename = null) {
    const json = this.exportToJSON(processes, true);
    const defaultFilename = `processes_export_${this.getDateString()}.json`;
    this.downloadFile(json, filename || defaultFilename, 'application/json');
  }

  /**
   * Generate report from template
   * @param {string} templateId - Report template ID
   * @param {object} filters - Filter criteria for processes
   * @returns {string} Report HTML
   */
  generateReport(templateId, filters = {}) {
    const processes = this.getFilteredProcesses(filters);

    switch (templateId) {
      case 'process_efficiency':
        return this.generateProcessEfficiencyReport(processes);

      case 'sla_compliance':
        return this.generateSLAComplianceReport(processes);

      case 'user_productivity':
        return this.generateUserProductivityReport(processes);

      case 'financial_summary':
        return this.generateFinancialSummaryReport(processes);

      case 'audit_report':
        return this.generateAuditReport(processes);

      default:
        throw new Error(`Unknown template: ${templateId}`);
    }
  }

  /**
   * Generate process efficiency report
   * @param {array} processes - Processes to include
   * @returns {string} HTML report
   */
  generateProcessEfficiencyReport(processes) {
    const completed = processes.filter(p => p.status === 'completed');
    const avgDuration = this.calculateAverageDuration(completed);

    const html = `
      <html>
      <head>
        <title>Process Efficiency Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Process Efficiency Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>

        <h2>Summary</h2>
        <p>Total Processes: ${processes.length}</p>
        <p>Completed: ${completed.length}</p>
        <p>Average Duration: ${this.formatDuration(avgDuration)}</p>

        <h2>Process Details</h2>
        <table>
          <thead>
            <tr>
              <th>Process ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${completed.map(p => `
              <tr>
                <td>${p._id}</td>
                <td>${p.definitionId}</td>
                <td>${p.status}</td>
                <td>${this.formatDuration(this.getProcessDuration(p))}</td>
                <td>${new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate SLA compliance report
   * @param {array} processes - Processes to include
   * @returns {string} HTML report
   */
  generateSLAComplianceReport(processes) {
    // Simple SLA compliance report
    const html = `
      <html>
      <head>
        <title>SLA Compliance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .metric { margin: 10px 0; padding: 10px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>SLA Compliance Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="metric">
          <strong>Total Processes:</strong> ${processes.length}
        </div>
        <div class="metric">
          <strong>Active:</strong> ${processes.filter(p => p.status === 'active').length}
        </div>
        <div class="metric">
          <strong>Completed:</strong> ${processes.filter(p => p.status === 'completed').length}
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate user productivity report
   * @param {array} processes - Processes to include
   * @returns {string} HTML report
   */
  generateUserProductivityReport(processes) {
    const html = `
      <html>
      <head>
        <title>User Productivity Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>User Productivity Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Processes: ${processes.length}</p>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate financial summary report
   * @param {array} processes - Processes to include
   * @returns {string} HTML report
   */
  generateFinancialSummaryReport(processes) {
    // Filter financial processes
    const financialProcesses = processes.filter(p =>
      p.definitionId.includes('financial') ||
      p.definitionId.includes('invoice') ||
      p.definitionId.includes('expense')
    );

    const totalAmount = financialProcesses.reduce((sum, p) => {
      return sum + (p.variables?.amount || 0);
    }, 0);

    const html = `
      <html>
      <head>
        <title>Financial Summary Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .metric { margin: 10px 0; padding: 10px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Financial Summary Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="metric">
          <strong>Total Financial Processes:</strong> ${financialProcesses.length}
        </div>
        <div class="metric">
          <strong>Total Amount:</strong> $${totalAmount.toFixed(2)}
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate audit report
   * @param {array} processes - Processes to include
   * @returns {string} HTML report
   */
  generateAuditReport(processes) {
    const html = `
      <html>
      <head>
        <title>Audit Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Audit Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>

        <h2>Process Audit Log</h2>
        ${processes.map(p => `
          <h3>Process: ${p._id}</h3>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>From State</th>
                <th>To State</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              ${(p.auditLog || []).map(entry => `
                <tr>
                  <td>${new Date(entry.timestamp).toLocaleString()}</td>
                  <td>${entry.action}</td>
                  <td>${entry.from || '-'}</td>
                  <td>${entry.to || '-'}</td>
                  <td>${JSON.stringify(entry.context || {})}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Helper: Get filtered processes
   */
  getFilteredProcesses(filters) {
    let processes = processState.getAllProcesses();

    if (filters.definitionId) {
      processes = processes.filter(p => p.definitionId === filters.definitionId);
    }

    if (filters.status) {
      processes = processes.filter(p => p.status === filters.status);
    }

    if (filters.category) {
      const definitions = processService.getAllDefinitions();
      const defIds = definitions
        .filter(def => def.metadata?.category === filters.category)
        .map(def => def.id);
      processes = processes.filter(p => defIds.includes(p.definitionId));
    }

    return processes;
  }

  /**
   * Helper: Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Helper: Escape CSV value
   */
  escapeCSV(value) {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Helper: Format value for export
   */
  formatValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Helper: Calculate average duration
   */
  calculateAverageDuration(processes) {
    if (processes.length === 0) return 0;

    const totalDuration = processes.reduce((sum, p) => {
      return sum + this.getProcessDuration(p);
    }, 0);

    return totalDuration / processes.length;
  }

  /**
   * Helper: Get process duration
   */
  getProcessDuration(process) {
    if (!process.completedAt) return 0;

    const created = new Date(process.createdAt).getTime();
    const completed = new Date(process.completedAt).getTime();

    return completed - created;
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
   * Helper: Get date string for filenames
   */
  getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}`;
  }
}

// Create singleton instance
export const exportService = new ExportService();

export default exportService;
