/**
 * Performance Review Process Definition
 * Employee performance review workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const performanceReviewDefinition = {
  id: 'performance_review_v1',
  name: 'Performance Review',
  description: 'Employee performance review workflow',
  type: PROCESS_TYPES.HR_PERFORMANCE,
  version: '1.0.0',
  initialState: 'scheduled',

  variables: {
    reviewId: { type: 'string', required: false },
    employeeId: { type: 'string', required: true },
    employeeName: { type: 'string', required: true },
    managerId: { type: 'string', required: true },
    managerName: { type: 'string', required: true },
    reviewPeriod: { type: 'string', required: true },
    reviewType: {
      type: 'string',
      required: false,
      enum: ['annual', 'semi_annual', 'quarterly', 'probation'],
      default: 'annual'
    },
    selfAssessment: { type: 'string', required: false },
    managerAssessment: { type: 'string', required: false },
    goals: { type: 'array', required: false, default: [] },
    achievements: { type: 'array', required: false, default: [] },
    areasForImprovement: { type: 'array', required: false, default: [] },
    overallRating: {
      type: 'string',
      required: false,
      enum: ['exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory']
    },
    ratingScore: { type: 'number', required: false, min: 1, max: 5 },
    meetingScheduled: { type: 'boolean', required: false, default: false },
    meetingDate: { type: 'date', required: false },
    acknowledged: { type: 'boolean', required: false, default: false },
    employeeComments: { type: 'string', required: false },
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    scheduled: {
      name: 'Scheduled',
      description: 'Review scheduled',
      transitions: ['self_assessment'],
      onEnter: async (processInstance) => {
        console.log(`Performance review scheduled for ${processInstance.variables.employeeName}`);
        processInstance.variables.scheduledAt = new Date().toISOString();
        if (!processInstance.variables.reviewId) {
          processInstance.variables.reviewId = `REV-${Date.now()}`;
        }
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'self_assessment' }]
      }
    },

    self_assessment: {
      name: 'Self Assessment',
      description: 'Employee completing self assessment',
      transitions: ['manager_review'],
      onEnter: async (processInstance) => {
        console.log(`Self assessment stage for ${processInstance.variables.employeeName}`);
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete your self assessment',
        actionLabel: 'Submit Self Assessment'
      }]
    },

    manager_review: {
      name: 'Manager Review',
      description: 'Manager completing review',
      transitions: ['meeting_scheduled'],
      onEnter: async (processInstance, context) => {
        console.log(`Manager review for ${processInstance.variables.employeeName}`);
        processInstance.variables.selfAssessment = context.selfAssessment;
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Complete performance review',
        actionLabel: 'Complete Review'
      }]
    },

    meeting_scheduled: {
      name: 'Meeting Scheduled',
      description: 'Review meeting scheduled',
      transitions: ['completed'],
      onEnter: async (processInstance, context) => {
        console.log(`Review meeting scheduled for ${processInstance.variables.employeeName}`);
        processInstance.variables.meetingScheduled = true;
        processInstance.variables.managerAssessment = context.managerAssessment;
        processInstance.variables.overallRating = context.overallRating;
        processInstance.variables.ratingScore = context.ratingScore;
        processInstance.variables.meetingDate = context.meetingDate;
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Conduct review meeting and get acknowledgment',
        actionLabel: 'Complete Meeting'
      }]
    },

    completed: {
      name: 'Completed',
      description: 'Review completed',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Performance review completed for ${processInstance.variables.employeeName}`);
        processInstance.variables.acknowledged = true;
        processInstance.variables.employeeComments = context.employeeComments;
        processInstance.variables.completedAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.HR,
    tags: ['performance', 'review', 'hr', 'evaluation'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'employee', 'manager', 'hr', 'admin', 'owner'],
      transition: {
        scheduled_to_self_assessment: ['system'],
        self_assessment_to_manager_review: ['employee', 'member', 'admin', 'owner'],
        manager_review_to_meeting_scheduled: ['manager', 'admin', 'owner'],
        meeting_scheduled_to_completed: ['manager', 'admin', 'owner']
      }
    },
    icon: 'star-outline',
    color: '#f59e0b' // amber
  }
};

export default performanceReviewDefinition;
