/**
 * BPM Services Index
 * Central export for all BPM-related services
 */

// Core services
export { StateMachine } from './state-machine.js';
export { processService } from './process-service.js';
export { processState } from '../../state/process-state.js';

// Phase 2 services
export { processPersistence } from './process-persistence.js';
export { processSync } from './process-sync.js';
export { conditionEvaluator } from './condition-evaluator.js';
export { transitionEngine } from './transition-engine.js';
export { taskService } from './task-service.js';

// Enhanced services (Phase 1 infrastructure)
export { documentService } from './document-service.js';
export { analyticsService } from './analytics-service.js';
export { exportService } from './export-service.js';
export { templateService } from './template-service.js';

// Process definitions - Existing
export { orderFulfillmentDefinition } from './definitions/order-fulfillment.js';
export { jobApplicationDefinition } from './definitions/job-application.js';
export { taskWorkflowDefinition } from './definitions/task-workflow.js';

// Process definitions - Financial (Phase 2)
export { invoiceApprovalDefinition } from './definitions/financial/invoice-approval.js';
export { expenseApprovalDefinition } from './definitions/financial/expense-approval.js';

// Process definitions - Operations (Phase 2)
export { salesOrderDefinition } from './definitions/operations/sales-order.js';

// Process definitions - Customer (Phase 2)
export { customerOnboardingDefinition } from './definitions/customer/customer-onboarding.js';

// Process definitions - IT (Phase 2)
export { itTicketDefinition } from './definitions/it/it-ticket.js';

// Process definitions - Phase 3 (Medium Priority)
export { purchaseOrderDefinition } from './definitions/supply-chain/purchase-order.js';
export { leaveRequestDefinition } from './definitions/hr/leave-request.js';
export { employeeOnboardingDefinition } from './definitions/hr/employee-onboarding.js';
export { changeRequestDefinition } from './definitions/it/change-request.js';
export { budgetRequestDefinition } from './definitions/financial/budget-request.js';
export { serviceRequestDefinition } from './definitions/operations/service-request.js';
export { leadManagementDefinition } from './definitions/marketing/lead-management.js';
export { vendorOnboardingDefinition } from './definitions/supply-chain/vendor-onboarding.js';

// Process definitions - Phase 4 (Complete Coverage)
export { projectInitiationDefinition } from './definitions/projects/project-initiation.js';
export { milestoneApprovalDefinition } from './definitions/projects/milestone-approval.js';
export { campaignApprovalDefinition } from './definitions/marketing/campaign-approval.js';
export { performanceReviewDefinition } from './definitions/hr/performance-review.js';
export { contractApprovalDefinition } from './definitions/compliance/contract-approval.js';
export { auditWorkflowDefinition } from './definitions/compliance/audit-workflow.js';
export { qcInspectionDefinition } from './definitions/supply-chain/qc-inspection.js';

// Test utilities
export { testBPMFramework, testBPMEvents } from './test-bpm.js';

/**
 * Initialize BPM Framework
 * Registers all process definitions and initializes engines
 */
export async function initializeBPM(options = {}) {
  console.log('Initializing BPM Framework...');

  try {
    // Import all services
    const { processService } = await import('./process-service.js');
    const { transitionEngine } = await import('./transition-engine.js');

    // Register process definitions - Existing
    const { orderFulfillmentDefinition } = await import('./definitions/order-fulfillment.js');
    const { jobApplicationDefinition } = await import('./definitions/job-application.js');
    const { taskWorkflowDefinition } = await import('./definitions/task-workflow.js');

    processService.registerDefinition(orderFulfillmentDefinition);
    processService.registerDefinition(jobApplicationDefinition);
    processService.registerDefinition(taskWorkflowDefinition);

    // Register process definitions - Financial (Phase 2)
    const { invoiceApprovalDefinition } = await import('./definitions/financial/invoice-approval.js');
    const { expenseApprovalDefinition } = await import('./definitions/financial/expense-approval.js');

    processService.registerDefinition(invoiceApprovalDefinition);
    processService.registerDefinition(expenseApprovalDefinition);

    // Register process definitions - Operations (Phase 2)
    const { salesOrderDefinition } = await import('./definitions/operations/sales-order.js');

    processService.registerDefinition(salesOrderDefinition);

    // Register process definitions - Customer (Phase 2)
    const { customerOnboardingDefinition } = await import('./definitions/customer/customer-onboarding.js');

    processService.registerDefinition(customerOnboardingDefinition);

    // Register process definitions - IT (Phase 2)
    const { itTicketDefinition } = await import('./definitions/it/it-ticket.js');

    processService.registerDefinition(itTicketDefinition);

    // Register process definitions - Phase 3 (Medium Priority)
    const { purchaseOrderDefinition } = await import('./definitions/supply-chain/purchase-order.js');
    const { leaveRequestDefinition } = await import('./definitions/hr/leave-request.js');
    const { employeeOnboardingDefinition } = await import('./definitions/hr/employee-onboarding.js');
    const { changeRequestDefinition } = await import('./definitions/it/change-request.js');
    const { budgetRequestDefinition } = await import('./definitions/financial/budget-request.js');
    const { serviceRequestDefinition } = await import('./definitions/operations/service-request.js');
    const { leadManagementDefinition } = await import('./definitions/marketing/lead-management.js');
    const { vendorOnboardingDefinition } = await import('./definitions/supply-chain/vendor-onboarding.js');

    processService.registerDefinition(purchaseOrderDefinition);
    processService.registerDefinition(leaveRequestDefinition);
    processService.registerDefinition(employeeOnboardingDefinition);
    processService.registerDefinition(changeRequestDefinition);
    processService.registerDefinition(budgetRequestDefinition);
    processService.registerDefinition(serviceRequestDefinition);
    processService.registerDefinition(leadManagementDefinition);
    processService.registerDefinition(vendorOnboardingDefinition);

    // Register process definitions - Phase 4 (Complete Coverage)
    const { projectInitiationDefinition } = await import('./definitions/projects/project-initiation.js');
    const { milestoneApprovalDefinition } = await import('./definitions/projects/milestone-approval.js');
    const { campaignApprovalDefinition } = await import('./definitions/marketing/campaign-approval.js');
    const { performanceReviewDefinition } = await import('./definitions/hr/performance-review.js');
    const { contractApprovalDefinition } = await import('./definitions/compliance/contract-approval.js');
    const { auditWorkflowDefinition } = await import('./definitions/compliance/audit-workflow.js');
    const { qcInspectionDefinition } = await import('./definitions/supply-chain/qc-inspection.js');

    processService.registerDefinition(projectInitiationDefinition);
    processService.registerDefinition(milestoneApprovalDefinition);
    processService.registerDefinition(campaignApprovalDefinition);
    processService.registerDefinition(performanceReviewDefinition);
    processService.registerDefinition(contractApprovalDefinition);
    processService.registerDefinition(auditWorkflowDefinition);
    processService.registerDefinition(qcInspectionDefinition);

    console.log('✓ Process definitions registered (23 total)');

    // Initialize transition engine
    if (options.enableAutoTransitions !== false) {
      transitionEngine.initialize();
      console.log('✓ Transition engine initialized');
    }

    // Initialize sync if organization is provided
    if (options.orgId) {
      const { processSync } = await import('./process-sync.js');
      await processSync.initialize(
        options.orgId,
        options.remoteUrl,
        options.credentials
      );
      console.log('✓ Process sync initialized');
    }

    console.log('✓ BPM Framework initialized successfully');

    return {
      success: true,
      message: 'BPM Framework initialized'
    };
  } catch (error) {
    console.error('Failed to initialize BPM Framework:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Make BPM services available globally for testing
 */
export function exposeBPMGlobally() {
  if (typeof window !== 'undefined') {
    // Import services
    import('./process-service.js').then(async ({ processService }) => {
      const { processState } = await import('../../state/process-state.js');
      const { processSync } = await import('./process-sync.js');
      const { transitionEngine } = await import('./transition-engine.js');
      const { taskService } = await import('./task-service.js');
      const { conditionEvaluator } = await import('./condition-evaluator.js');
      const { documentService } = await import('./document-service.js');
      const { analyticsService } = await import('./analytics-service.js');
      const { exportService } = await import('./export-service.js');
      const { templateService } = await import('./template-service.js');

      window.BPM = {
        // Services
        processService,
        processState,
        processSync,
        transitionEngine,
        taskService,
        conditionEvaluator,
        documentService,
        analyticsService,
        exportService,
        templateService,

        // Initialization
        async init(options) {
          return initializeBPM(options);
        },

        // Test functions
        async test() {
          const { testBPMFramework } = await import('./test-bpm.js');
          return testBPMFramework();
        },
        async testEvents() {
          const { testBPMEvents } = await import('./test-bpm.js');
          return testBPMEvents();
        },

        // Utility functions - Existing processes
        async createOrder(orderData) {
          return processService.createProcess({
            definitionId: 'order_fulfillment_v1',
            type: 'order',
            variables: orderData
          });
        },

        async createJobApplication(applicationData) {
          return processService.createProcess({
            definitionId: 'job_application_v1',
            type: 'job_application',
            variables: applicationData
          });
        },

        async createTask(taskData) {
          return processService.createProcess({
            definitionId: 'task_workflow_v1',
            type: 'task',
            variables: taskData
          });
        },

        // Utility functions - Phase 2 processes
        async createInvoice(invoiceData) {
          return processService.createProcess({
            definitionId: 'invoice_approval_v1',
            type: 'financial_invoice',
            variables: invoiceData
          });
        },

        async createExpense(expenseData) {
          return processService.createProcess({
            definitionId: 'expense_approval_v1',
            type: 'financial_expense',
            variables: expenseData
          });
        },

        async createSalesOrder(orderData) {
          return processService.createProcess({
            definitionId: 'sales_order_v1',
            type: 'ops_sales_order',
            variables: orderData
          });
        },

        async createCustomerOnboarding(customerData) {
          return processService.createProcess({
            definitionId: 'customer_onboarding_v1',
            type: 'customer_onboarding',
            variables: customerData
          });
        },

        async createITTicket(ticketData) {
          return processService.createProcess({
            definitionId: 'it_ticket_v1',
            type: 'it_ticket',
            variables: ticketData
          });
        },

        // Utility functions - Phase 3 processes
        async createPurchaseOrder(poData) {
          return processService.createProcess({
            definitionId: 'purchase_order_v1',
            type: 'sc_purchase_order',
            variables: poData
          });
        },

        async createLeaveRequest(leaveData) {
          return processService.createProcess({
            definitionId: 'leave_request_v1',
            type: 'hr_leave',
            variables: leaveData
          });
        },

        async createEmployeeOnboarding(employeeData) {
          return processService.createProcess({
            definitionId: 'employee_onboarding_v1',
            type: 'hr_onboarding',
            variables: employeeData
          });
        },

        async createChangeRequest(changeData) {
          return processService.createProcess({
            definitionId: 'change_request_v1',
            type: 'it_change_request',
            variables: changeData
          });
        },

        async createBudgetRequest(budgetData) {
          return processService.createProcess({
            definitionId: 'budget_request_v1',
            type: 'financial_budget',
            variables: budgetData
          });
        },

        async createServiceRequest(serviceData) {
          return processService.createProcess({
            definitionId: 'service_request_v1',
            type: 'ops_service_request',
            variables: serviceData
          });
        },

        async createLead(leadData) {
          return processService.createProcess({
            definitionId: 'lead_management_v1',
            type: 'mkt_lead',
            variables: leadData
          });
        },

        async createVendorOnboarding(vendorData) {
          return processService.createProcess({
            definitionId: 'vendor_onboarding_v1',
            type: 'sc_vendor_onboarding',
            variables: vendorData
          });
        },

        // Utility functions - Phase 4 processes
        async createProject(projectData) {
          return processService.createProcess({
            definitionId: 'project_initiation_v1',
            type: 'project_initiation',
            variables: projectData
          });
        },

        async createMilestone(milestoneData) {
          return processService.createProcess({
            definitionId: 'milestone_approval_v1',
            type: 'project_milestone',
            variables: milestoneData
          });
        },

        async createCampaign(campaignData) {
          return processService.createProcess({
            definitionId: 'campaign_approval_v1',
            type: 'mkt_campaign',
            variables: campaignData
          });
        },

        async createPerformanceReview(reviewData) {
          return processService.createProcess({
            definitionId: 'performance_review_v1',
            type: 'hr_performance',
            variables: reviewData
          });
        },

        async createContract(contractData) {
          return processService.createProcess({
            definitionId: 'contract_approval_v1',
            type: 'legal_contract',
            variables: contractData
          });
        },

        async createAudit(auditData) {
          return processService.createProcess({
            definitionId: 'audit_workflow_v1',
            type: 'compliance_audit',
            variables: auditData
          });
        },

        async createQCInspection(inspectionData) {
          return processService.createProcess({
            definitionId: 'qc_inspection_v1',
            type: 'sc_qc_inspection',
            variables: inspectionData
          });
        }
      };

      console.log('BPM services available at window.BPM');
      console.log('Commands:');
      console.log('  window.BPM.init(options) - Initialize framework');
      console.log('  window.BPM.test() - Run tests');
      console.log('');
      console.log('Create Processes - Phase 2:');
      console.log('  window.BPM.createInvoice(data) - Invoice approval');
      console.log('  window.BPM.createExpense(data) - Expense approval');
      console.log('  window.BPM.createSalesOrder(data) - Sales order');
      console.log('  window.BPM.createCustomerOnboarding(data) - Customer onboarding');
      console.log('  window.BPM.createITTicket(data) - IT ticket');
      console.log('');
      console.log('Create Processes - Phase 3:');
      console.log('  window.BPM.createPurchaseOrder(data) - Purchase order');
      console.log('  window.BPM.createLeaveRequest(data) - Leave request');
      console.log('  window.BPM.createEmployeeOnboarding(data) - Employee onboarding');
      console.log('  window.BPM.createChangeRequest(data) - Change request');
      console.log('  window.BPM.createBudgetRequest(data) - Budget request');
      console.log('  window.BPM.createServiceRequest(data) - Service request');
      console.log('  window.BPM.createLead(data) - Lead management');
      console.log('  window.BPM.createVendorOnboarding(data) - Vendor onboarding');
      console.log('');
      console.log('Create Processes - Phase 4:');
      console.log('  window.BPM.createProject(data) - Project initiation');
      console.log('  window.BPM.createMilestone(data) - Milestone approval');
      console.log('  window.BPM.createCampaign(data) - Campaign approval');
      console.log('  window.BPM.createPerformanceReview(data) - Performance review');
      console.log('  window.BPM.createContract(data) - Contract approval');
      console.log('  window.BPM.createAudit(data) - Audit workflow');
      console.log('  window.BPM.createQCInspection(data) - QC inspection');
    });
  }
}

export default {
  initializeBPM,
  exposeBPMGlobally
};
