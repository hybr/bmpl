/**
 * Invoice Approval Process Definition
 * Multi-level approval workflow for vendor invoices
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
    // Invoice details
    invoiceNumber: { type: 'string', required: true },
    vendorId: { type: 'string', required: true },
    vendorName: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },
    invoiceDate: { type: 'date', required: true },
    dueDate: { type: 'date', required: true },

    // Line items
    lineItems: {
      type: 'array',
      required: false,
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
          totalPrice: { type: 'number' }
        }
      }
    },

    // Accounting
    glAccount: { type: 'string', required: false },
    costCenter: { type: 'string', required: false },
    projectCode: { type: 'string', required: false },

    // Approval workflow
    submittedBy: { type: 'string', required: false },
    reviewedBy: { type: 'string', required: false },
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Payment tracking
    paymentMethod: { type: 'string', required: false },
    paymentDate: { type: 'date', required: false },
    paymentReference: { type: 'string', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  // State definitions
  states: {
    // Draft - Invoice being prepared
    draft: {
      name: 'Draft',
      description: 'Invoice is being prepared',
      transitions: ['submitted', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Invoice ${processInstance.variables.invoiceNumber} in draft`);
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
        console.log(`Invoice ${processInstance.variables.invoiceNumber} submitted`);

        // Record who submitted
        if (context.submittedBy) {
          processInstance.variables.submittedBy = context.submittedBy;
        }

        // TODO: Send notification to reviewers
        // await notificationService.send({
        //   type: 'invoice_submitted',
        //   invoiceNumber: processInstance.variables.invoiceNumber,
        //   amount: processInstance.variables.amount
        // });
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
        console.log(`Invoice ${processInstance.variables.invoiceNumber} under review`);

        // TODO: Assign to appropriate approver based on amount
        const amount = processInstance.variables.amount || 0;
        const requiredRole = amount >= 5000 ? APPROVAL_LEVELS.DIRECTOR : APPROVAL_LEVELS.MANAGER;

        // TODO: Send notification to approver
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
        console.log(`Invoice ${processInstance.variables.invoiceNumber} approved`);

        // Record approver
        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }

        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }

        processInstance.variables.approvedAt = new Date().toISOString();

        // TODO: Send notification to finance team
        // await notificationService.send({
        //   type: 'invoice_approved',
        //   invoiceNumber: processInstance.variables.invoiceNumber,
        //   amount: processInstance.variables.amount
        // });
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
        console.log(`Processing payment for invoice ${processInstance.variables.invoiceNumber}`);

        // TODO: Integrate with payment system
        // TODO: Create payment record
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
        console.log(`Invoice ${processInstance.variables.invoiceNumber} paid`);

        // Record payment details
        if (context.paymentMethod) {
          processInstance.variables.paymentMethod = context.paymentMethod;
        }

        if (context.paymentReference) {
          processInstance.variables.paymentReference = context.paymentReference;
        }

        processInstance.variables.paymentDate = new Date().toISOString();

        // TODO: Send payment confirmation to vendor
        // TODO: Update accounting system
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
        console.log(`Invoice ${processInstance.variables.invoiceNumber} archived`);

        processInstance.variables.archivedAt = new Date().toISOString();

        // TODO: Move to archive storage
        // TODO: Update reporting systems
      }
    },

    // Rejected - Invoice rejected (terminal state)
    rejected: {
      name: 'Rejected',
      description: 'Invoice has been rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Invoice ${processInstance.variables.invoiceNumber} rejected`);

        // Record rejection reason
        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }

        processInstance.variables.rejectedAt = new Date().toISOString();

        // TODO: Send rejection notification
        // await notificationService.send({
        //   type: 'invoice_rejected',
        //   invoiceNumber: processInstance.variables.invoiceNumber,
        //   reason: processInstance.variables.rejectionReason
        // });
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
        submitted_to_review: ['system'], // Auto-transition
        review_to_approved: ['manager', 'director', 'owner'],
        review_to_rejected: ['manager', 'director', 'owner'],
        review_to_draft: ['manager', 'admin', 'owner'],
        approved_to_processed: ['system'], // Auto-transition
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
