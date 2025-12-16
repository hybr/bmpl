/**
 * Change Request Process Definition
 * IT change management and approval workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Change Request Process
 *
 * State Flow:
 * submitted → impact_assessment → cab_review → approved → scheduled → implemented → verified → closed | rejected
 */
export const changeRequestDefinition = {
  id: 'change_request_v1',
  name: 'Change Request',
  description: 'IT change management and approval workflow',
  type: PROCESS_TYPES.IT_CHANGE_REQUEST,
  version: '1.0.0',
  initialState: 'submitted',

  variables: {
    // Change details
    changeNumber: { type: 'string', required: true },
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    category: {
      type: 'string',
      required: true,
      enum: ['standard', 'normal', 'emergency', 'major']
    },
    type: {
      type: 'string',
      required: false,
      enum: ['infrastructure', 'application', 'database', 'network', 'security', 'other']
    },

    // Priority and risk
    priority: {
      type: 'string',
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    riskLevel: {
      type: 'string',
      required: false,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },

    // Requester information
    requesterId: { type: 'string', required: true },
    requesterName: { type: 'string', required: true },
    requesterEmail: { type: 'string', required: false },
    requestedDate: { type: 'date', required: true },

    // Change details
    justification: { type: 'string', required: true },
    affectedSystems: { type: 'array', required: false, default: [] },
    affectedUsers: { type: 'string', required: false },
    downtime: { type: 'boolean', required: false, default: false },
    estimatedDowntime: { type: 'number', required: false }, // in minutes

    // Impact assessment
    impactAssessment: { type: 'string', required: false },
    impactLevel: {
      type: 'string',
      required: false,
      enum: ['low', 'medium', 'high']
    },
    assessedBy: { type: 'string', required: false },

    // CAB (Change Advisory Board)
    cabReviewRequired: { type: 'boolean', required: false, default: true },
    cabMeetingDate: { type: 'date', required: false },
    cabDecision: { type: 'string', required: false },
    cabNotes: { type: 'string', required: false },

    // Approval
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Implementation
    implementationPlan: { type: 'string', required: false },
    rollbackPlan: { type: 'string', required: false },
    scheduledStartTime: { type: 'date', required: false },
    scheduledEndTime: { type: 'date', required: false },
    actualStartTime: { type: 'date', required: false },
    actualEndTime: { type: 'date', required: false },
    implementedBy: { type: 'string', required: false },
    implementationNotes: { type: 'string', required: false },

    // Verification
    verificationSteps: { type: 'array', required: false, default: [] },
    verifiedBy: { type: 'string', required: false },
    verificationNotes: { type: 'string', required: false },
    successful: { type: 'boolean', required: false },

    // Post-implementation
    postReviewRequired: { type: 'boolean', required: false, default: false },
    postReviewNotes: { type: 'string', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    // Submitted - Change request submitted
    submitted: {
      name: 'Submitted',
      description: 'Change request has been submitted',
      transitions: ['impact_assessment', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Change request ${processInstance.variables.changeNumber} submitted`);

        processInstance.variables.submittedAt = new Date().toISOString();

        // Emergency changes skip assessment
        if (processInstance.variables.category === 'emergency') {
          processInstance.variables.cabReviewRequired = false;
        }

        // TODO: Notify change management team
      },

      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'impact_assessment'
          }
        ]
      }
    },

    // Impact Assessment - Assessing impact
    impact_assessment: {
      name: 'Impact Assessment',
      description: 'Change impact is being assessed',
      transitions: ['cab_review', 'approved', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Assessing impact for change ${processInstance.variables.changeNumber}`);

        // Emergency changes skip CAB review
        if (processInstance.variables.category === 'emergency') {
          processInstance.variables.impactAssessment = 'Emergency change - expedited approval';
          processInstance.variables.impactLevel = 'high';
        }
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Complete impact assessment',
          actionLabel: 'Complete Assessment'
        }
      ],

      autoTransition: {
        conditions: [
          {
            type: 'condition',
            toState: 'approved',
            conditions: [
              {
                type: 'variable',
                field: 'category',
                operator: 'eq',
                value: 'emergency'
              }
            ],
            reason: 'Emergency change - expedited approval'
          }
        ]
      }
    },

    // CAB Review - Change Advisory Board review
    cab_review: {
      name: 'CAB Review',
      description: 'Under review by Change Advisory Board',
      transitions: ['approved', 'rejected', 'impact_assessment'],

      onEnter: async (processInstance, context) => {
        console.log(`CAB review for change ${processInstance.variables.changeNumber}`);

        if (context.impactAssessment) {
          processInstance.variables.impactAssessment = context.impactAssessment;
        }

        if (context.impactLevel) {
          processInstance.variables.impactLevel = context.impactLevel;
        }

        // TODO: Schedule CAB meeting if needed
        // TODO: Notify CAB members
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Review change request in CAB meeting',
          actionLabel: 'CAB Decision',
          metadata: {
            approveLabel: 'Approve Change',
            rejectLabel: 'Reject Change'
          }
        }
      ]
    },

    // Approved - Change approved
    approved: {
      name: 'Approved',
      description: 'Change has been approved',
      transitions: ['scheduled'],

      onEnter: async (processInstance, context) => {
        console.log(`Change ${processInstance.variables.changeNumber} approved`);

        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }

        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }

        processInstance.variables.approvedAt = new Date().toISOString();

        // TODO: Notify requester and implementation team
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Schedule change implementation',
          actionLabel: 'Schedule Change'
        }
      ]
    },

    // Scheduled - Change scheduled
    scheduled: {
      name: 'Scheduled',
      description: 'Change implementation scheduled',
      transitions: ['implemented'],

      onEnter: async (processInstance, context) => {
        console.log(`Change ${processInstance.variables.changeNumber} scheduled`);

        if (context.scheduledStartTime) {
          processInstance.variables.scheduledStartTime = context.scheduledStartTime;
        }

        if (context.scheduledEndTime) {
          processInstance.variables.scheduledEndTime = context.scheduledEndTime;
        }

        // TODO: Add to change calendar
        // TODO: Send reminders before implementation
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Implement the change',
          actionLabel: 'Start Implementation'
        }
      ]
    },

    // Implemented - Change implemented
    implemented: {
      name: 'Implemented',
      description: 'Change has been implemented',
      transitions: ['verified', 'scheduled'],

      onEnter: async (processInstance, context) => {
        console.log(`Change ${processInstance.variables.changeNumber} implemented`);

        processInstance.variables.actualStartTime = context.actualStartTime || new Date().toISOString();
        processInstance.variables.actualEndTime = context.actualEndTime || new Date().toISOString();

        if (context.implementedBy) {
          processInstance.variables.implementedBy = context.implementedBy;
        }

        if (context.implementationNotes) {
          processInstance.variables.implementationNotes = context.implementationNotes;
        }

        // TODO: Notify stakeholders
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Verify change implementation',
          actionLabel: 'Verify Change'
        }
      ]
    },

    // Verified - Implementation verified
    verified: {
      name: 'Verified',
      description: 'Change implementation verified',
      transitions: ['closed'],

      onEnter: async (processInstance, context) => {
        console.log(`Change ${processInstance.variables.changeNumber} verified`);

        if (context.verifiedBy) {
          processInstance.variables.verifiedBy = context.verifiedBy;
        }

        if (context.verificationNotes) {
          processInstance.variables.verificationNotes = context.verificationNotes;
        }

        processInstance.variables.successful = context.successful !== false;
        processInstance.variables.verifiedAt = new Date().toISOString();

        // TODO: Send verification notification
      },

      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'closed'
          }
        ]
      }
    },

    // Closed - Change closed (terminal state)
    closed: {
      name: 'Closed',
      description: 'Change request closed',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Change ${processInstance.variables.changeNumber} closed`);

        processInstance.variables.closedAt = new Date().toISOString();

        // Calculate change duration
        if (processInstance.variables.submittedAt && processInstance.variables.closedAt) {
          const start = new Date(processInstance.variables.submittedAt);
          const end = new Date(processInstance.variables.closedAt);
          processInstance.variables.changeDuration = end.getTime() - start.getTime();
        }

        // TODO: Update change metrics
        // TODO: Send closure notification
      }
    },

    // Rejected - Change rejected (terminal state)
    rejected: {
      name: 'Rejected',
      description: 'Change request rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Change ${processInstance.variables.changeNumber} rejected`);

        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }

        processInstance.variables.rejectedAt = new Date().toISOString();

        // TODO: Send rejection notification
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.IT,
    tags: ['change', 'it', 'change_management', 'cab'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'member', 'manager', 'admin', 'owner'],
      transition: {
        submitted_to_impact_assessment: ['system'],
        impact_assessment_to_cab_review: ['member', 'admin', 'owner'],
        impact_assessment_to_approved: ['system', 'manager', 'owner'],
        impact_assessment_to_rejected: ['manager', 'admin', 'owner'],
        cab_review_to_approved: ['manager', 'admin', 'owner'],
        cab_review_to_rejected: ['manager', 'admin', 'owner'],
        approved_to_scheduled: ['member', 'admin', 'owner'],
        scheduled_to_implemented: ['member', 'admin', 'owner'],
        implemented_to_verified: ['member', 'admin', 'owner'],
        implemented_to_scheduled: ['member', 'admin', 'owner'],
        verified_to_closed: ['system']
      }
    },
    icon: 'git-branch-outline',
    color: '#f59e0b' // amber
  }
};

export default changeRequestDefinition;
