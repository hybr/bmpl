/**
 * Leave Request Process Definition
 * Employee time-off request and approval workflow
 *
 * Field Principles:
 * - Auto-generated IDs are system fields (not shown in forms)
 * - User references use userLookup with verify button
 * - Redundant fields derived from lookups are removed
 * - Fields are assigned to specific steps/states
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Leave Request Process
 *
 * State Flow:
 * submitted → manager_review → approved → scheduled → completed | rejected | cancelled
 */
export const leaveRequestDefinition = {
  id: 'leave_request_v1',
  name: 'Leave Request',
  description: 'Employee time-off request and approval workflow',
  type: PROCESS_TYPES.HR_LEAVE,
  version: '1.0.0',
  initialState: 'submitted',

  // Variable schema
  variables: {
    // === SYSTEM FIELDS (auto-generated) ===
    requestId: {
      type: 'string',
      required: false,
      step: 'system',
      description: 'Auto-generated request ID'
    },

    // === CREATE STEP FIELDS ===

    // Employee making the request - defaults to current user
    // In self-service mode, this is auto-filled; in HR mode, it's a lookup
    employeeId: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name', 'employeeNumber'],
        displayFields: ['name', 'email', 'department'],
        placeholder: 'Search employee by name or email'
      },
      description: 'Employee requesting leave'
    },

    // Leave type selection
    leaveType: {
      type: 'string',
      required: true,
      step: 'create',
      foreignKey: {
        options: [
          { value: 'vacation', label: 'Vacation' },
          { value: 'sick', label: 'Sick Leave' },
          { value: 'personal', label: 'Personal Day' },
          { value: 'bereavement', label: 'Bereavement' },
          { value: 'maternity', label: 'Maternity Leave' },
          { value: 'paternity', label: 'Paternity Leave' },
          { value: 'unpaid', label: 'Unpaid Leave' }
        ]
      }
    },

    // Date range
    startDate: {
      type: 'date',
      required: true,
      step: 'create',
      description: 'Leave start date'
    },

    endDate: {
      type: 'date',
      required: true,
      step: 'create',
      description: 'Leave end date'
    },

    halfDay: {
      type: 'boolean',
      required: false,
      step: 'create',
      default: false,
      toggleLabel: 'Half day only'
    },

    // Reason
    reason: {
      type: 'string',
      required: false,
      step: 'create',
      multiline: true,
      rows: 3,
      placeholder: 'Reason for leave (optional)'
    },

    // === MANAGER_REVIEW STEP FIELDS ===

    // Covering employee - User lookup
    coveringEmployeeId: {
      type: 'string',
      required: false,
      step: 'manager_review',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name'],
        displayFields: ['name', 'department'],
        placeholder: 'Assign covering employee'
      },
      description: 'Employee covering during absence'
    },

    approvalNotes: {
      type: 'string',
      required: false,
      step: 'manager_review',
      multiline: true,
      rows: 2,
      placeholder: 'Notes for approval (optional)'
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

    // === CANCELLED STEP FIELDS ===
    cancellationReason: {
      type: 'string',
      required: false,
      step: 'cancelled',
      multiline: true,
      rows: 2,
      placeholder: 'Reason for cancellation'
    },

    // === SYSTEM CALCULATED/TRACKING FIELDS ===
    totalDays: { type: 'number', required: false, step: 'system', min: 0.5 },
    currentBalance: { type: 'number', required: false, step: 'system', min: 0 },
    balanceAfter: { type: 'number', required: false, step: 'system' },
    requiresUnpaid: { type: 'boolean', required: false, step: 'system', default: false },
    managerId: { type: 'string', required: false, step: 'system' },
    reviewedBy: { type: 'string', required: false, step: 'system' },
    coverageNotes: { type: 'string', required: false, step: 'system' },
    handoverCompleted: { type: 'boolean', required: false, step: 'system', default: false },
    handoverNotes: { type: 'string', required: false, step: 'system' },
    documents: { type: 'array', required: false, step: 'system', default: [] },
    submittedAt: { type: 'date', required: false, step: 'system' },
    approvedAt: { type: 'date', required: false, step: 'system' },
    rejectedAt: { type: 'date', required: false, step: 'system' },
    cancelledAt: { type: 'date', required: false, step: 'system' },
    completedAt: { type: 'date', required: false, step: 'system' }
  },

  // State definitions
  states: {
    // Submitted - Leave request submitted
    submitted: {
      name: 'Submitted',
      description: 'Leave request submitted for review',
      transitions: ['manager_review', 'cancelled'],

      onEnter: async (processInstance, context) => {
        // Generate request ID
        if (!processInstance.variables.requestId) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          processInstance.variables.requestId = `LR-${timestamp}-${random}`;
        }

        processInstance.variables.submittedAt = new Date().toISOString();

        // Calculate total days if not provided
        if (!processInstance.variables.totalDays) {
          const start = new Date(processInstance.variables.startDate);
          const end = new Date(processInstance.variables.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          processInstance.variables.totalDays = processInstance.variables.halfDay ? 0.5 : diffDays;
        }

        console.log(`Leave request ${processInstance.variables.requestId} submitted`);

        // TODO: Get employee's manager and leave balance
        // const employee = await employeeService.getById(processInstance.variables.employeeId);
        // processInstance.variables.managerId = employee.managerId;
        // const balance = await hrService.getLeaveBalance(
        //   processInstance.variables.employeeId,
        //   processInstance.variables.leaveType
        // );
        // processInstance.variables.currentBalance = balance;
        // processInstance.variables.balanceAfter = balance - processInstance.variables.totalDays;
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
      description: 'Leave request is being reviewed by manager',
      transitions: ['approved', 'rejected', 'submitted'],

      onEnter: async (processInstance, context) => {
        console.log(`Leave request ${processInstance.variables.requestId} under manager review`);
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Review and approve this leave request',
          actionLabel: 'Review Leave Request',
          metadata: {
            approveLabel: 'Approve',
            rejectLabel: 'Reject',
            requiresCoverage: true
          }
        }
      ],

      // Auto-approve after 7 days if no action
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'approved',
            reason: 'Auto-approved - no manager response within 7 days'
          }
        ]
      }
    },

    // Approved - Leave request approved
    approved: {
      name: 'Approved',
      description: 'Leave request has been approved',
      transitions: ['scheduled', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Leave request ${processInstance.variables.requestId} approved`);

        processInstance.variables.approvedAt = new Date().toISOString();

        if (context.reviewedBy) {
          processInstance.variables.reviewedBy = context.reviewedBy;
        }
        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }
        if (context.coveringEmployeeId) {
          processInstance.variables.coveringEmployeeId = context.coveringEmployeeId;
        }

        // TODO: Deduct leave balance
        // TODO: Send approval notification
      },

      // Auto-transition to scheduled
      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'scheduled'
          }
        ]
      }
    },

    // Scheduled - Leave is scheduled
    scheduled: {
      name: 'Scheduled',
      description: 'Leave is scheduled',
      transitions: ['completed', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Leave ${processInstance.variables.requestId} scheduled`);

        // TODO: Add to team calendar
        // TODO: Send reminders
      },

      // Auto-complete day after leave ends
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 24 * 60 * 60 * 1000, // 1 day after end date
            toState: 'completed',
            reason: 'Leave period ended',
            checkEndDate: true
          }
        ]
      }
    },

    // Completed - Leave completed (terminal state)
    completed: {
      name: 'Completed',
      description: 'Leave has been completed',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Leave ${processInstance.variables.requestId} completed`);
        processInstance.variables.completedAt = new Date().toISOString();
      }
    },

    // Rejected - Leave request rejected (terminal state)
    rejected: {
      name: 'Rejected',
      description: 'Leave request has been rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Leave request ${processInstance.variables.requestId} rejected`);

        processInstance.variables.rejectedAt = new Date().toISOString();
        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }

        // TODO: Restore leave balance if deducted
      }
    },

    // Cancelled - Leave request cancelled (terminal state)
    cancelled: {
      name: 'Cancelled',
      description: 'Leave request has been cancelled',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Leave request ${processInstance.variables.requestId} cancelled`);

        processInstance.variables.cancelledAt = new Date().toISOString();
        if (context.reason || context.cancellationReason) {
          processInstance.variables.cancellationReason = context.reason || context.cancellationReason;
        }

        // TODO: Restore leave balance if deducted
        // TODO: Remove from calendar
      }
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.HR,
    tags: ['leave', 'time-off', 'vacation', 'absence', 'hr'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'employee', 'manager', 'hr', 'admin', 'owner'],
      transition: {
        submitted_to_manager_review: ['system'],
        manager_review_to_approved: ['manager', 'admin', 'owner'],
        manager_review_to_rejected: ['manager', 'admin', 'owner'],
        manager_review_to_submitted: ['manager', 'admin', 'owner'],
        approved_to_scheduled: ['system'],
        approved_to_cancelled: ['creator', 'employee', 'manager', 'admin', 'owner'],
        scheduled_to_completed: ['system'],
        scheduled_to_cancelled: ['creator', 'employee', 'manager', 'admin', 'owner']
      }
    },
    icon: 'calendar-outline',
    color: '#14b8a6' // teal
  }
};

export default leaveRequestDefinition;
