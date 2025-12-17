/**
 * Invoice Approval Process Definition
 * Multi-level approval workflow for vendor invoices
 *
 * Field Principles:
 * - Auto-generated IDs are system fields (not shown in forms)
 * - Vendor references use entityLookup
 * - Redundant fields derived from lookups are removed
 * - Fields are assigned to specific steps/states
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Invoice Approval Process
 *
 * State Flow:
 * draft → submitted → review → approved → processed → paid → archived | rejected
 *
 * Approval Rules:
 * - < $1,000: Auto-approve (skip review)
 * - $1,000 - $4,999: Manager approval
 * - $5,000+: Director approval
 */
export const invoiceApprovalDefinition = {
  id: 'invoice_approval_v1',
  name: 'Invoice Approval',
  description: 'Vendor invoice approval and payment workflow',
  type: PROCESS_TYPES.FINANCIAL_INVOICE,
  version: '1.0.0',
  initialState: 'draft',

  // Variable schema
  variables: {
    // === SYSTEM FIELDS (auto-generated) ===
    invoiceId: {
      type: 'string',
      required: false,
      step: 'system',
      description: 'Auto-generated invoice ID'
    },

    // === CREATE/DRAFT STEP FIELDS ===

    // Vendor - Entity lookup
    vendorId: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'vendors',
        searchFields: ['name', 'vendorCode', 'email'],
        displayTemplate: '{name} ({vendorCode})',
        placeholder: 'Search for vendor'
      },
      description: 'Vendor sending the invoice'
    },

    // Invoice reference number from vendor
    vendorInvoiceNumber: {
      type: 'string',
      required: true,
      step: 'create',
      placeholder: "Vendor's invoice number"
    },

    // Amount
    amount: {
      type: 'number',
      required: true,
      step: 'create',
      min: 0,
      placeholder: 'Invoice amount'
    },

    currency: {
      type: 'string',
      required: false,
      step: 'create',
      default: 'USD',
      foreignKey: {
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
      }
    },

    // Dates
    invoiceDate: {
      type: 'date',
      required: true,
      step: 'create',
      description: 'Invoice date'
    },

    dueDate: {
      type: 'date',
      required: true,
      step: 'create',
      description: 'Payment due date'
    },

    // Accounting
    glAccount: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'glAccounts',
        searchFields: ['code', 'name'],
        displayTemplate: '{code} - {name}',
        placeholder: 'Search GL account'
      }
    },

    costCenter: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'costCenters',
        searchFields: ['code', 'name'],
        displayTemplate: '{code} - {name}',
        placeholder: 'Search cost center'
      }
    },

    projectCode: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'projects',
        searchFields: ['code', 'name'],
        displayTemplate: '{code} - {name}',
        placeholder: 'Search project'
      }
    },

    // Description
    description: {
      type: 'string',
      required: false,
      step: 'create',
      multiline: true,
      rows: 2,
      placeholder: 'Invoice description or notes'
    },

    // === REVIEW STEP FIELDS ===
    reviewNotes: {
      type: 'string',
      required: false,
      step: 'review',
      multiline: true,
      rows: 2,
      placeholder: 'Review notes'
    },

    // === APPROVED STEP FIELDS ===
    approvalNotes: {
      type: 'string',
      required: false,
      step: 'approved',
      multiline: true,
      rows: 2,
      placeholder: 'Approval notes'
    },

    // === PROCESSED STEP FIELDS ===
    paymentMethod: {
      type: 'string',
      required: false,
      step: 'processed',
      foreignKey: {
        options: [
          { value: 'ach', label: 'ACH Transfer' },
          { value: 'wire', label: 'Wire Transfer' },
          { value: 'check', label: 'Check' },
          { value: 'card', label: 'Credit Card' }
        ]
      }
    },

    // === PAID STEP FIELDS ===
    paymentReference: {
      type: 'string',
      required: false,
      step: 'paid',
      placeholder: 'Payment reference number'
    },

    // === REJECTED STEP FIELDS ===
    rejectionReason: {
      type: 'string',
      required: false,
      step: 'rejected',
      multiline: true,
      rows: 2,
      placeholder: 'Reason for rejection'
    },

    // === SYSTEM TRACKING FIELDS ===
    lineItems: { type: 'array', required: false, step: 'system', default: [] },
    submittedBy: { type: 'string', required: false, step: 'system' },
    reviewedBy: { type: 'string', required: false, step: 'system' },
    approvedBy: { type: 'string', required: false, step: 'system' },
    paymentDate: { type: 'date', required: false, step: 'system' },
    documents: { type: 'array', required: false, step: 'system', default: [] },
    submittedAt: { type: 'date', required: false, step: 'system' },
    approvedAt: { type: 'date', required: false, step: 'system' },
    rejectedAt: { type: 'date', required: false, step: 'system' },
    paidAt: { type: 'date', required: false, step: 'system' },
    archivedAt: { type: 'date', required: false, step: 'system' }
  },

  // State definitions
  states: {
    // Draft - Invoice being prepared
    draft: {
      name: 'Draft',
      description: 'Invoice is being prepared',
      transitions: ['submitted', 'rejected'],

      onEnter: async (processInstance, context) => {
        // Generate invoice ID
        if (!processInstance.variables.invoiceId) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          processInstance.variables.invoiceId = `INV-${timestamp}-${random}`;
        }

        console.log(`Invoice ${processInstance.variables.invoiceId} in draft`);
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Complete invoice details and submit for approval',
          actionLabel: 'Submit Invoice'
        }
      ]
    },

    // Submitted - Awaiting initial review
    submitted: {
      name: 'Submitted',
      description: 'Invoice submitted for review',
      transitions: ['review', 'approved', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Invoice ${processInstance.variables.invoiceId} submitted`);

        processInstance.variables.submittedAt = new Date().toISOString();

        if (context.submittedBy) {
          processInstance.variables.submittedBy = context.submittedBy;
        }
      },

      // Auto-transition based on amount
      autoTransition: {
        conditions: [
          {
            type: 'condition',
            toState: 'approved',
            conditions: [
              {
                type: 'variable',
                field: 'amount',
                operator: 'lt',
                value: 1000
              }
            ],
            reason: 'Auto-approved (amount < $1,000)'
          },
          {
            type: 'immediate',
            toState: 'review'
          }
        ]
      }
    },

    // Review - Under review by approver
    review: {
      name: 'Under Review',
      description: 'Invoice is being reviewed',
      transitions: ['approved', 'rejected', 'draft'],

      onEnter: async (processInstance, context) => {
        console.log(`Invoice ${processInstance.variables.invoiceId} under review`);
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Review and approve this invoice',
          actionLabel: 'Review Invoice',
          metadata: {
            approveLabel: 'Approve',
            rejectLabel: 'Reject',
            requiresAmount: true,
            amountThreshold: 5000,
            escalateTo: APPROVAL_LEVELS.DIRECTOR
          }
        }
      ],

      // Auto-reject after 30 days if no action
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 30 * 24 * 60 * 60 * 1000, // 30 days
            toState: 'rejected',
            reason: 'No review action within 30 days'
          }
        ]
      }
    },

    // Approved - Invoice approved for payment
    approved: {
      name: 'Approved',
      description: 'Invoice approved for payment',
      transitions: ['processed'],

      onEnter: async (processInstance, context) => {
        console.log(`Invoice ${processInstance.variables.invoiceId} approved`);

        processInstance.variables.approvedAt = new Date().toISOString();

        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }
        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }
      },

      // Auto-transition to processed
      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'processed'
          }
        ]
      }
    },

    // Processed - Payment being processed
    processed: {
      name: 'Processing Payment',
      description: 'Payment is being processed',
      transitions: ['paid'],

      onEnter: async (processInstance, context) => {
        console.log(`Processing payment for invoice ${processInstance.variables.invoiceId}`);
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.ADMIN,
          message: 'Process payment for this invoice',
          actionLabel: 'Mark as Paid'
        }
      ]
    },

    // Paid - Payment completed
    paid: {
      name: 'Paid',
      description: 'Invoice has been paid',
      transitions: ['archived'],

      onEnter: async (processInstance, context) => {
        console.log(`Invoice ${processInstance.variables.invoiceId} paid`);

        processInstance.variables.paidAt = new Date().toISOString();
        processInstance.variables.paymentDate = new Date().toISOString();

        if (context.paymentMethod) {
          processInstance.variables.paymentMethod = context.paymentMethod;
        }
        if (context.paymentReference) {
          processInstance.variables.paymentReference = context.paymentReference;
        }
      },

      // Auto-archive after 7 days
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'archived',
            reason: 'Auto-archived after 7 days'
          }
        ]
      }
    },

    // Archived - Invoice archived (terminal state)
    archived: {
      name: 'Archived',
      description: 'Invoice has been archived',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Invoice ${processInstance.variables.invoiceId} archived`);
        processInstance.variables.archivedAt = new Date().toISOString();
      }
    },

    // Rejected - Invoice rejected (terminal state)
    rejected: {
      name: 'Rejected',
      description: 'Invoice has been rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Invoice ${processInstance.variables.invoiceId} rejected`);

        processInstance.variables.rejectedAt = new Date().toISOString();

        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }
      }
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.FINANCIAL,
    tags: ['invoice', 'approval', 'payment', 'accounting'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'manager', 'admin', 'owner'],
      transition: {
        draft_to_submitted: ['creator', 'member', 'admin', 'owner'],
        submitted_to_review: ['system'],
        review_to_approved: ['manager', 'director', 'owner'],
        review_to_rejected: ['manager', 'director', 'owner'],
        review_to_draft: ['manager', 'admin', 'owner'],
        approved_to_processed: ['system'],
        processed_to_paid: ['admin', 'owner'],
        paid_to_archived: ['system', 'admin', 'owner'],
        any_to_rejected: ['manager', 'director', 'owner']
      }
    },
    icon: 'document-text',
    color: '#10b981' // green
  }
};

export default invoiceApprovalDefinition;
