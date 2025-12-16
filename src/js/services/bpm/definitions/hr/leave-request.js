/**
 * Leave Request Process Definition
 * Employee time-off request and approval workflow
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
    // Employee details
    employeeId: { type: 'string', required: true },
    employeeName: { type: 'string', required: true },
    employeeEmail: { type: 'string', required: false },
    department: { type: 'string', required: false },
    position: { type: 'string', required: false },

    // Leave details
    leaveType: {
      type: 'string',
      required: true,
      enum: ['vacation', 'sick', 'personal', 'bereavement', 'maternity', 'paternity', 'unpaid', 'other']
    },
    startDate: { type: 'date', required: true },
    endDate: { type: 'date', required: true },
    totalDays: { type: 'number', required: true, min: 0.5 },
    halfDay: { type: 'boolean', required: false, default: false },
    reason: { type: 'string', required: false },
    notes: { type: 'string', required: false },

    // Balance information
    currentBalance: { type: 'number', required: false, min: 0 },
    balanceAfter: { type: 'number', required: false },
    requiresUnpaid: { type: 'boolean', required: false, default: false },

    // Manager details
    managerId: { type: 'string', required: false },
    managerName: { type: 'string', required: false },

    // Approval workflow
    reviewedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },
    cancellationReason: { type: 'string', required: false },

    // Coverage
    coveringEmployeeId: { type: 'string', required: false },
    coveringEmployeeName: { type: 'string', required: false },
    coverageNotes: { type: 'string', required: false },

    // Work handover
    handoverCompleted: { type: 'boolean', required: false, default: false },
    handoverNotes: { type: 'string', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  // State definitions
  states: {
    // Submitted - Leave request submitted
    submitted: {
      name: 'Submitted',
      description: 'Leave request submitted for review',
      transitions: ['manager_review', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Leave request submitted by ${processInstance.variables.employeeName}`);

        processInstance.variables.submittedAt = new Date().toISOString();

        // Calculate total days if not provided
        if (!processInstance.variables.totalDays) {
          const start = new Date(processInstance.variables.startDate);
          const end = new Date(processInstance.variables.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end
          processInstance.variables.totalDays = processInstance.variables.halfDay ? 0.5 : diffDays;
        }

        // TODO: Check leave balance
        // const balance = await hrService.getLeaveBalance(
        //   processInstance.variables.employeeId,
        //   processInstance.variables.leaveType
        // );
        // processInstance.variables.currentBalance = balance;
        // processInstance.variables.balanceAfter = balance - processInstance.variables.totalDays;
        // processInstance.variables.requiresUnpaid = balance < processInstance.variables.totalDays;

        // TODO: Send notification to manager
        // await notificationService.send({
        //   to: processInstance.variables.managerId,
        //   type: 'leave_request_submitted',
        //   employeeName: processInstance.variables.employeeName,
        //   startDate: processInstance.variables.startDate,
        //   endDate: processInstance.variables.endDate,
        //   totalDays: processInstance.variables.totalDays
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
      description: 'Leave request is being reviewed by manager',
      transitions: ['approved', 'rejected', 'submitted'],

      onEnter: async (processInstance, context) => {
        console.log(`Leave request under manager review for ${processInstance.variables.employeeName}`);

        // TODO: Check for conflicting leave requests in the team
        // const conflicts = await hrService.checkLeaveConflicts(
        //   processInstance.variables.department,
        //   processInstance.variables.startDate,
        //   processInstance.variables.endDate
        // );
        // if (conflicts.length > 0) {
        //   processInstance.variables.hasConflicts = true;
        //   processInstance.variables.conflicts = conflicts;
        // }
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

      // Auto-approve after 7 days if no action (emergency approval)
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
        console.log(`Leave request approved for ${processInstance.variables.employeeName}`);

        // Record reviewer
        if (context.reviewedBy) {
          processInstance.variables.reviewedBy = context.reviewedBy;
        }

        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }

        if (context.coveringEmployeeId) {
          processInstance.variables.coveringEmployeeId = context.coveringEmployeeId;
        }

        if (context.coveringEmployeeName) {
          processInstance.variables.coveringEmployeeName = context.coveringEmployeeName;
        }

        processInstance.variables.approvedAt = new Date().toISOString();

        // TODO: Update leave balance
        // await hrService.deductLeaveBalance(
        //   processInstance.variables.employeeId,
        //   processInstance.variables.leaveType,
        //   processInstance.variables.totalDays
        // );

        // TODO: Send approval notification to employee
        // await notificationService.send({
        //   to: processInstance.variables.employeeEmail,
        //   type: 'leave_request_approved',
        //   startDate: processInstance.variables.startDate,
        //   endDate: processInstance.variables.endDate,
        //   totalDays: processInstance.variables.totalDays
        // });

        // TODO: Notify covering employee if assigned
        // if (processInstance.variables.coveringEmployeeId) {
        //   await notificationService.send({
        //     to: processInstance.variables.coveringEmployeeId,
        //     type: 'leave_coverage_assigned',
        //     employeeName: processInstance.variables.employeeName,
        //     startDate: processInstance.variables.startDate,
        //     endDate: processInstance.variables.endDate
        //   });
        // }
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
        console.log(`Leave scheduled for ${processInstance.variables.employeeName}`);

        // TODO: Add to team calendar
        // await calendarService.addLeave({
        //   employeeId: processInstance.variables.employeeId,
        //   employeeName: processInstance.variables.employeeName,
        //   startDate: processInstance.variables.startDate,
        //   endDate: processInstance.variables.endDate,
        //   leaveType: processInstance.variables.leaveType
        // });

        // TODO: Send reminders 1 day before leave starts
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
        console.log(`Leave completed for ${processInstance.variables.employeeName}`);

        processInstance.variables.completedAt = new Date().toISOString();

        // TODO: Send welcome back notification
        // await notificationService.send({
        //   to: processInstance.variables.employeeEmail,
        //   type: 'welcome_back',
        //   employeeName: processInstance.variables.employeeName
        // });

        // TODO: Update attendance records
        // await attendanceService.recordLeave({
        //   employeeId: processInstance.variables.employeeId,
        //   leaveType: processInstance.variables.leaveType,
        //   startDate: processInstance.variables.startDate,
        //   endDate: processInstance.variables.endDate,
        //   totalDays: processInstance.variables.totalDays
        // });
      }
    },

    // Rejected - Leave request rejected (terminal state)
    rejected: {
      name: 'Rejected',
      description: 'Leave request has been rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Leave request rejected for ${processInstance.variables.employeeName}`);

        // Record rejection reason
        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }

        processInstance.variables.rejectedAt = new Date().toISOString();

        // TODO: Restore leave balance if already deducted
        // await hrService.restoreLeaveBalance(
        //   processInstance.variables.employeeId,
        //   processInstance.variables.leaveType,
        //   processInstance.variables.totalDays
        // );

        // TODO: Send rejection notification to employee
        // await notificationService.send({
        //   to: processInstance.variables.employeeEmail,
        //   type: 'leave_request_rejected',
        //   reason: processInstance.variables.rejectionReason
        // });
      }
    },

    // Cancelled - Leave request cancelled (terminal state)
    cancelled: {
      name: 'Cancelled',
      description: 'Leave request has been cancelled',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Leave request cancelled for ${processInstance.variables.employeeName}`);

        // Record cancellation reason
        if (context.reason || context.cancellationReason) {
          processInstance.variables.cancellationReason = context.reason || context.cancellationReason;
        }

        processInstance.variables.cancelledAt = new Date().toISOString();

        // TODO: Restore leave balance if already deducted
        // if (processInstance.variables.approvedAt) {
        //   await hrService.restoreLeaveBalance(
        //     processInstance.variables.employeeId,
        //     processInstance.variables.leaveType,
        //     processInstance.variables.totalDays
        //   );
        // }

        // TODO: Remove from calendar
        // await calendarService.removeLeave({
        //   employeeId: processInstance.variables.employeeId,
        //   startDate: processInstance.variables.startDate,
        //   endDate: processInstance.variables.endDate
        // });

        // TODO: Notify manager and covering employee
        // await notificationService.send({
        //   to: [processInstance.variables.managerId, processInstance.variables.coveringEmployeeId].filter(Boolean),
        //   type: 'leave_cancelled',
        //   employeeName: processInstance.variables.employeeName,
        //   startDate: processInstance.variables.startDate,
        //   endDate: processInstance.variables.endDate,
        //   reason: processInstance.variables.cancellationReason
        // });
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
        submitted_to_manager_review: ['system'], // Auto-transition
        manager_review_to_approved: ['manager', 'admin', 'owner'],
        manager_review_to_rejected: ['manager', 'admin', 'owner'],
        manager_review_to_submitted: ['manager', 'admin', 'owner'],
        approved_to_scheduled: ['system'], // Auto-transition
        approved_to_cancelled: ['creator', 'employee', 'manager', 'admin', 'owner'],
        scheduled_to_completed: ['system'], // Auto-transition
        scheduled_to_cancelled: ['creator', 'employee', 'manager', 'admin', 'owner']
      }
    },
    icon: 'calendar-outline',
    color: '#14b8a6' // teal
  }
};

export default leaveRequestDefinition;
