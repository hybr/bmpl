/**
 * Budget Request Process Definition
 * Department budget request and approval workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const budgetRequestDefinition = {
  id: 'budget_request_v1',
  name: 'Budget Request',
  description: 'Department budget request and approval workflow',
  type: PROCESS_TYPES.FINANCIAL_BUDGET,
  version: '1.0.0',
  initialState: 'draft',

  variables: {
    // Request details
    requestNumber: { type: 'string', required: true },
    department: { type: 'string', required: true },
    fiscalYear: { type: 'string', required: true },
    fiscalPeriod: { type: 'string', required: false },

    // Requester
    requesterId: { type: 'string', required: true },
    requesterName: { type: 'string', required: true },

    // Budget details
    requestedAmount: { type: 'number', required: true, min: 0 },
    approvedAmount: { type: 'number', required: false, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },
    category: {
      type: 'string',
      required: true,
      enum: ['personnel', 'equipment', 'operations', 'marketing', 'travel', 'training', 'other']
    },

    // Justification
    purpose: { type: 'string', required: true },
    justification: { type: 'string', required: true },
    expectedBenefits: { type: 'string', required: false },

    // Line items
    lineItems: {
      type: 'array',
      required: false,
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
          justification: { type: 'string' }
        }
      }
    },

    // Approval
    approvedBy: { type: 'string', required: false },
    financeReviewedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Allocation
    budgetCode: { type: 'string', required: false },
    allocationDate: { type: 'date', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    draft: {
      name: 'Draft',
      description: 'Budget request is being prepared',
      transitions: ['submitted'],
      onEnter: async (processInstance) => {
        console.log(`Budget request ${processInstance.variables.requestNumber} in draft`);
      }
    },

    submitted: {
      name: 'Submitted',
      description: 'Budget request submitted',
      transitions: ['finance_review', 'rejected'],
      onEnter: async (processInstance) => {
        console.log(`Budget request ${processInstance.variables.requestNumber} submitted`);
        processInstance.variables.submittedAt = new Date().toISOString();
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'finance_review' }]
      }
    },

    finance_review: {
      name: 'Finance Review',
      description: 'Under review by finance team',
      transitions: ['approved', 'rejected', 'submitted'],
      onEnter: async (processInstance) => {
        console.log(`Finance reviewing budget request ${processInstance.variables.requestNumber}`);
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Review budget request',
        actionLabel: 'Review Budget'
      }]
    },

    approved: {
      name: 'Approved',
      description: 'Budget request approved',
      transitions: ['allocated'],
      onEnter: async (processInstance, context) => {
        console.log(`Budget request ${processInstance.variables.requestNumber} approved`);
        processInstance.variables.approvedBy = context.approvedBy;
        processInstance.variables.approvedAmount = context.approvedAmount || processInstance.variables.requestedAmount;
        processInstance.variables.approvedAt = new Date().toISOString();
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'allocated' }]
      }
    },

    allocated: {
      name: 'Allocated',
      description: 'Budget has been allocated',
      transitions: ['active'],
      onEnter: async (processInstance, context) => {
        console.log(`Budget allocated for ${processInstance.variables.requestNumber}`);
        processInstance.variables.allocationDate = new Date().toISOString();
        if (context.budgetCode) {
          processInstance.variables.budgetCode = context.budgetCode;
        }
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'active' }]
      }
    },

    active: {
      name: 'Active',
      description: 'Budget is active and can be used',
      transitions: [],
      onEnter: async (processInstance) => {
        console.log(`Budget ${processInstance.variables.requestNumber} is now active`);
        processInstance.variables.activeAt = new Date().toISOString();
      }
    },

    rejected: {
      name: 'Rejected',
      description: 'Budget request rejected',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Budget request ${processInstance.variables.requestNumber} rejected`);
        processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        processInstance.variables.rejectedAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.FINANCIAL,
    tags: ['budget', 'finance', 'planning'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'manager', 'finance', 'admin', 'owner'],
      transition: {
        draft_to_submitted: ['creator', 'member', 'admin', 'owner'],
        submitted_to_finance_review: ['system'],
        finance_review_to_approved: ['manager', 'director', 'owner'],
        finance_review_to_rejected: ['manager', 'director', 'owner'],
        approved_to_allocated: ['system'],
        allocated_to_active: ['system']
      }
    },
    icon: 'wallet-outline',
    color: '#84cc16' // lime
  }
};

export default budgetRequestDefinition;
