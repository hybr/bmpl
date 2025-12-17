/**
 * Process Detail Page
 * Shows details of a single process instance
 */

import { BaseProcessDetailPage } from '../base/base-process-detail-page.js';

export class ProcessDetailPage extends BaseProcessDetailPage {
  constructor() {
    super();
  }

  /**
   * Get fields to show based on process type
   */
  getFieldsToShow() {
    const variables = this.process.variables || {};
    const type = this.process.type;

    // Define important fields per process type
    const fieldMaps = {
      'financial_invoice': ['invoiceNumber', 'vendorName', 'amount', 'dueDate', 'glAccount', 'approvedBy'],
      'financial_expense': ['employeeName', 'category', 'amount', 'expenseDate', 'reimbursementMethod'],
      'operations_sales_order': ['orderNumber', 'customerName', 'totalAmount', 'salesRepName', 'paymentTerms'],
      'customer_onboarding': ['customerName', 'businessType', 'requestedCreditLimit', 'approvedCreditLimit'],
      'it_ticket': ['ticketNumber', 'subject', 'priority', 'category', 'assignedToName', 'resolution']
    };

    const fields = fieldMaps[type] || Object.keys(variables).slice(0, 10);
    return fields.filter(f => variables[f] !== undefined);
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
          <ion-title>Process Details</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="window.app.currentPage.loadProcess()">
              <ion-icon slot="icon-only" name="refresh"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div id="process-content">
          <div id="process-header"></div>
          <div id="process-details"></div>
          <div id="process-timeline"></div>
          <div id="process-actions"></div>
          <div id="process-history"></div>
        </div>
      </ion-content>
    `;
  }
}

// Register page
customElements.define('page-process-detail', ProcessDetailPage);

export default ProcessDetailPage;
