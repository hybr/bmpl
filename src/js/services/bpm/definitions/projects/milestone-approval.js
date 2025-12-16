/**
 * Milestone Approval Process Definition
 * Project milestone completion and approval workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const milestoneApprovalDefinition = {
  id: 'milestone_approval_v1',
  name: 'Milestone Approval',
  description: 'Project milestone completion and approval workflow',
  type: PROCESS_TYPES.PROJECTS_MILESTONE_APPROVAL,
  version: '1.0.0',
  initialState: 'pending',

  variables: {
    // Milestone details
    milestoneId: { type: 'string', required: true },
    milestoneName: { type: 'string', required: true },
    description: { type: 'string', required: true },

    // Project reference
    projectId: { type: 'string', required: true },
    projectName: { type: 'string', required: false },

    // Deliverables
    deliverables: { type: 'array', required: false, default: [] },
    deliverablesSummary: { type: 'string', required: false },

    // Criteria
    successCriteria: { type: 'array', required: false, default: [] },
    acceptanceCriteria: { type: 'string', required: false },

    // Dates
    plannedCompletionDate: { type: 'date', required: false },
    actualCompletionDate: { type: 'date', required: false },

    // Team
    completedBy: { type: 'string', required: false },
    completedByName: { type: 'string', required: false },
    projectManagerId: { type: 'string', required: false },
    projectManagerName: { type: 'string', required: false },

    // Approval
    reviewedBy: { type: 'string', required: false },
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },
    reworkNotes: { type: 'string', required: false },

    // Quality
    qualityChecked: { type: 'boolean', required: false, default: false },
    qualityNotes: { type: 'string', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    pending: {
      name: 'Pending',
      description: 'Milestone pending completion',
      transitions: ['review', 'cancelled'],
      onEnter: async (processInstance) => {
        console.log(`Milestone pending: ${processInstance.variables.milestoneName}`);
        processInstance.variables.pendingDate = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete milestone deliverables',
        actionLabel: 'Submit for Review'
      }]
    },

    review: {
      name: 'Review',
      description: 'Under review',
      transitions: ['approved', 'rework', 'rejected'],
      onEnter: async (processInstance, context) => {
        console.log(`Reviewing milestone: ${processInstance.variables.milestoneName}`);
        processInstance.variables.completedBy = context.completedBy;
        processInstance.variables.completedByName = context.completedByName;
        processInstance.variables.actualCompletionDate = context.actualCompletionDate || new Date().toISOString();
        processInstance.variables.reviewStartedAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Review milestone completion',
        actionLabel: 'Review Milestone',
        metadata: {
          approveLabel: 'Approve',
          rejectLabel: 'Reject',
          reworkLabel: 'Request Rework'
        }
      }]
    },

    rework: {
      name: 'Rework',
      description: 'Requires rework',
      transitions: ['review'],
      onEnter: async (processInstance, context) => {
        console.log(`Milestone requires rework: ${processInstance.variables.milestoneName}`);
        processInstance.variables.reworkNotes = context.reworkNotes || context.notes;
        processInstance.variables.reworkRequestedAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete rework and resubmit',
        actionLabel: 'Resubmit'
      }]
    },

    approved: {
      name: 'Approved',
      description: 'Milestone approved',
      transitions: ['completed'],
      onEnter: async (processInstance, context) => {
        console.log(`Milestone approved: ${processInstance.variables.milestoneName}`);
        processInstance.variables.approvedBy = context.approvedBy;
        processInstance.variables.approvalNotes = context.approvalNotes;
        processInstance.variables.approvedAt = new Date().toISOString();
      },
      autoTransition: {
        conditions: [{
          type: 'immediate',
          toState: 'completed'
        }]
      }
    },

    completed: {
      name: 'Completed',
      description: 'Milestone completed',
      transitions: [],
      onEnter: async (processInstance) => {
        console.log(`Milestone completed: ${processInstance.variables.milestoneName}`);
        processInstance.variables.completedAt = new Date().toISOString();

        // TODO: Update project progress
        // TODO: Trigger next milestone if applicable
      }
    },

    rejected: {
      name: 'Rejected',
      description: 'Milestone rejected',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Milestone rejected: ${processInstance.variables.milestoneName}`);
        processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        processInstance.variables.rejectedAt = new Date().toISOString();
      }
    },

    cancelled: {
      name: 'Cancelled',
      description: 'Milestone cancelled',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Milestone cancelled: ${processInstance.variables.milestoneName}`);
        processInstance.variables.cancellationReason = context.reason;
        processInstance.variables.cancelledAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.PROJECTS,
    tags: ['milestone', 'project', 'approval', 'deliverable'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'project_manager', 'team_member', 'manager', 'admin', 'owner'],
      transition: {
        pending_to_review: ['project_manager', 'team_member', 'member', 'admin', 'owner'],
        review_to_approved: ['project_manager', 'manager', 'owner'],
        review_to_rework: ['project_manager', 'manager', 'owner'],
        review_to_rejected: ['project_manager', 'manager', 'owner'],
        rework_to_review: ['team_member', 'member', 'admin', 'owner'],
        approved_to_completed: ['system'],
        any_to_cancelled: ['project_manager', 'manager', 'owner']
      }
    },
    icon: 'flag-outline',
    color: '#10b981' // green
  }
};

export default milestoneApprovalDefinition;
