/**
 * Expense Approval Process Definition
 * Employee expense claim and reimbursement workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Expense Approval Process
 *
 * State Flow:
 * submitted → manager_review → approved → reimbursed → completed | rejected
 */
export const expenseApprovalDefinition = {
  id: 'expense_approval_v1',
  name: 'Expense Approval',
  description: 'Employee expense claim and reimbursement workflow',
  type: PROCESS_TYPES.FINANCIAL_EXPENSE,
  version: '1.0.0',
  initialState: 'submitted',

  // Variable schema
  variables: {
    // Employee details
    employeeId: { type: 'string', required: true },
    employeeName: { type: 'string', required: true },
    employeeEmail: { type: 'string', required: false },
    department: { type: 'string', required: false },

    // Expense details
    expenseDate: { type: 'date', required: true },
    category: {
      type: 'string',
      required: true,
      enum: ['travel', 'meals', 'accommodation', 'supplies', 'equipment', 'other']
    },
    description: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },

    // Additional info
    projectCode: { type: 'string', required: false },
    clientName: { type: 'string', required: false },
    businessPurpose: { type: 'string', required: false },

    // Approval workflow
    managerId: { type: 'string', required: false },
    managerName: { type: 'string', required: false },
    reviewedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Reimbursement
    reimbursementMethod: { type: 'string', required: false, enum: ['direct_deposit', 'check', 'payroll'] },
    reimbursementDate: { type: 'date', required: false },
    reimbursementReference: { type: 'string', required: false },

    // Receipt documents
    documents: { type: 'array', required: false, default: [] }
  },

  // State definitions
  states: {
    // Submitted - Expense claim submitted
    submitted: {
      name: 'Submitted',
      description: 'Expense claim submitted for review',
      transitions: ['manager_review', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Expense claim submitted by ${processInstance.variables.employeeName}`);

        processInstance.variables.submittedAt = new Date().toISOString();

        // TODO: Send notification to manager
        // await notificationService.send({
        //   to: processInstance.variables.managerId,
        //   type: 'expense_submitted',
        //   employeeName: processInstance.variables.employeeName,
        //   amount: processInstance.variables.amount,
        //   category: processInstance.variables.category
        // });
      },

      // Auto-transition to manager review
      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'manager_review'
          }
        ]
      }
    },

    // Manager Review - Being reviewed by manager
    manager_review: {
      name: 'Manager Review',
      description: 'Expense is being reviewed by manager',
      transitions: ['approved', 'rejected', 'submitted'],

      onEnter: async (processInstance, context) => {
        console.log(`Expense claim under manager review for ${processInstance.variables.employeeName}`);
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Review and approve this expense claim',
          actionLabel: 'Review Expense',
          metadata: {
            approveLabel: 'Approve',
            rejectLabel: 'Reject',
            requiresReceipt: true
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
            reason: 'No manager review within 30 days'
          }
        ]
      }
    },

    // Approved - Expense approved
    approved: {
      name: 'Approved',
      description: 'Expense claim has been approved',
      transitions: ['reimbursed'],

      onEnter: async (processInstance, context) => {
        console.log(`Expense claim approved for ${processInstance.variables.employeeName}`);

        // Record reviewer
        if (context.reviewedBy) {
          processInstance.variables.reviewedBy = context.reviewedBy;
        }

        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }

        processInstance.variables.approvedAt = new Date().toISOString();

        // TODO: Send notification to employee
        // await notificationService.send({
        //   to: processInstance.variables.employeeEmail,
        //   type: 'expense_approved',
        //   amount: processInstance.variables.amount
        // });

        // TODO: Send to finance for reimbursement
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.ADMIN,
          message: 'Process reimbursement for this expense',
          actionLabel: 'Process Reimbursement'
        }
      ]
    },

    // Reimbursed - Payment processed
    reimbursed: {
      name: 'Reimbursed',
      description: 'Expense has been reimbursed',
      transitions: ['completed'],

      onEnter: async (processInstance, context) => {
        console.log(`Expense reimbursed to ${processInstance.variables.employeeName}`);

        // Record reimbursement details
        if (context.reimbursementMethod) {
          processInstance.variables.reimbursementMethod = context.reimbursementMethod;
        }

        if (context.reimbursementReference) {
          processInstance.variables.reimbursementReference = context.reimbursementReference;
        }

        processInstance.variables.reimbursementDate = new Date().toISOString();

        // TODO: Send confirmation to employee
        // await notificationService.send({
        //   to: processInstance.variables.employeeEmail,
        //   type: 'expense_reimbursed',
        //   amount: processInstance.variables.amount,
        //   method: processInstance.variables.reimbursementMethod
        // });
      },

      // Auto-complete immediately
      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'completed'
          }
        ]
      }
    },

    // Completed - Process completed (terminal state)
    completed: {
      name: 'Completed',
      description: 'Expense claim completed',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Expense claim completed for ${processInstance.variables.employeeName}`);

        processInstance.variables.completedAt = new Date().toISOString();

        // TODO: Update financial records
        // TODO: Add to expense reports
      }
    },

    // Rejected - Expense rejected (terminal state)
    rejected: {
      name: 'Rejected',
      description: 'Expense claim has been rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Expense claim rejected for ${processInstance.variables.employeeName}`);

        // Record rejection reason
        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }

        processInstance.variables.rejectedAt = new Date().toISOString();

        // TODO: Send rejection notification to employee
        // await notificationService.send({
        //   to: processInstance.variables.employeeEmail,
        //   type: 'expense_rejected',
        //   reason: processInstance.variables.rejectionReason
        // });
      }
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.FINANCIAL,
    tags: ['expense', 'reimbursement', 'approval'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'manager', 'admin', 'owner'],
      transition: {
        submitted_to_manager_review: ['system'], // Auto-transition
        manager_review_to_approved: ['manager', 'admin', 'owner'],
        manager_review_to_rejected: ['manager', 'admin', 'owner'],
        manager_review_to_submitted: ['manager', 'admin', 'owner'],
        approved_to_reimbursed: ['admin', 'owner'],
        reimbursed_to_completed: ['system'], // Auto-transition
        any_to_rejected: ['manager', 'admin', 'owner']
      }
    },
    icon: 'cash',
    color: '#f59e0b' // amber
  }
};

export default expenseApprovalDefinition;
