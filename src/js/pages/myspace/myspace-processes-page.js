/**
 * My Space Processes Page
 * List of all processes with filtering
 */

import { BaseProcessListPage } from '../base/base-process-list-page.js';

export class MySpaceProcessesPage extends BaseProcessListPage {
  constructor() {
    super();
  }

  /**
   * Get list configuration
   */
  getListConfig() {
    return {
      title: 'My Processes',
      emptyMessage: 'No processes found',
      showCreateButton: true,
      createButtonLabel: 'Create Process'
    };
  }

  /**
   * Render process card body with category-specific fields
   */
  renderProcessCardBody(process, definition) {
    const variables = process.variables || {};

    // Show key variables based on process type
    let keyInfo = '';

    // Financial processes
    if (variables.amount !== undefined) {
      keyInfo += `<p><strong>Amount:</strong> $${variables.amount.toLocaleString()}</p>`;
    }
    if (variables.invoiceNumber) {
      keyInfo += `<p><strong>Invoice:</strong> ${variables.invoiceNumber}</p>`;
    }
    if (variables.orderNumber) {
      keyInfo += `<p><strong>Order:</strong> ${variables.orderNumber}</p>`;
    }

    // Customer/Employee info
    if (variables.customerName) {
      keyInfo += `<p><strong>Customer:</strong> ${variables.customerName}</p>`;
    }
    if (variables.employeeName) {
      keyInfo += `<p><strong>Employee:</strong> ${variables.employeeName}</p>`;
    }

    // IT Ticket info
    if (variables.ticketNumber) {
      keyInfo += `<p><strong>Ticket:</strong> ${variables.ticketNumber}</p>`;
    }
    if (variables.priority) {
      keyInfo += `<p><strong>Priority:</strong> ${variables.priority}</p>`;
    }

    return keyInfo || `<p>${definition?.description || ''}</p>`;
  }

  /**
   * Get HTML template
   */
  getTemplate() {
    return `
      <ion-header>
        <ion-toolbar>
          <ion-title>Processes</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="window.app.navigate('/process/create')">
              <ion-icon slot="icon-only" name="add"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar
            placeholder="Search processes..."
            debounce="500"
            onIonInput="window.app.currentPage.applyFilter('query', event.target.value)">
          </ion-searchbar>
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
}

// Register page
customElements.define('page-myspace-processes', MySpaceProcessesPage);

export default MySpaceProcessesPage;
