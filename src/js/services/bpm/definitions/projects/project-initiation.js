/**
 * Project Initiation Process Definition
 * New project approval and planning workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const projectInitiationDefinition = {
  id: 'project_initiation_v1',
  name: 'Project Initiation',
  description: 'New project approval and planning workflow',
  type: PROCESS_TYPES.PROJECT_INITIATION,
  version: '1.0.0',
  initialState: 'concept',

  variables: {
    // Project details
    projectId: { type: 'string', required: false },
    projectName: { type: 'string', required: true },
    projectDescription: { type: 'string', required: true },
    projectType: {
      type: 'string',
      required: false,
      enum: ['internal', 'customer', 'research', 'infrastructure']
    },

    // Sponsor and stakeholders
    sponsorId: { type: 'string', required: true },
    sponsorName: { type: 'string', required: true },
    projectManagerId: { type: 'string', required: false },
    projectManagerName: { type: 'string', required: false },
    stakeholders: { type: 'array', required: false, default: [] },

    // Business case
    businessObjective: { type: 'string', required: true },
    expectedBenefits: { type: 'string', required: true },
    successCriteria: { type: 'string', required: false },
    risks: { type: 'array', required: false, default: [] },

    // Budget and timeline
    estimatedBudget: { type: 'number', required: true, min: 0 },
    approvedBudget: { type: 'number', required: false, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },
    estimatedDuration: { type: 'number', required: false }, // in days
    plannedStartDate: { type: 'date', required: false },
    plannedEndDate: { type: 'date', required: false },
    actualStartDate: { type: 'date', required: false },

    // Resources
    requiredResources: { type: 'array', required: false, default: [] },
    teamMembers: { type: 'array', required: false, default: [] },

    // Approval
    reviewedBy: { type: 'string', required: false },
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Planning
    projectCharter: { type: 'string', required: false },
    projectPlan: { type: 'string', required: false },
    milestones: { type: 'array', required: false, default: [] },

    // Priority
    priority: {
      type: 'string',
      required: false,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    concept: {
      name: 'Concept',
      description: 'Project concept stage',
      transitions: ['proposal', 'rejected'],
      onEnter: async (processInstance) => {
        console.log(`Project concept: ${processInstance.variables.projectName}`);
        processInstance.variables.conceptDate = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Develop project proposal',
        actionLabel: 'Submit Proposal'
      }]
    },

    proposal: {
      name: 'Proposal',
      description: 'Project proposal submitted',
      transitions: ['review', 'concept', 'rejected'],
      onEnter: async (processInstance) => {
        console.log(`Project proposal submitted: ${processInstance.variables.projectName}`);
        processInstance.variables.proposalDate = new Date().toISOString();
      },
      autoTransition: {
        conditions: [{
          type: 'immediate',
          toState: 'review'
        }]
      }
    },

    review: {
      name: 'Review',
      description: 'Under management review',
      transitions: ['approved', 'proposal', 'rejected'],
      onEnter: async (processInstance) => {
        console.log(`Reviewing project: ${processInstance.variables.projectName}`);
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Review and approve project proposal',
        actionLabel: 'Review Project',
        metadata: {
          approveLabel: 'Approve Project',
          rejectLabel: 'Reject',
          requiresBudget: true
        }
      }]
    },

    approved: {
      name: 'Approved',
      description: 'Project approved',
      transitions: ['planned'],
      onEnter: async (processInstance, context) => {
        console.log(`Project approved: ${processInstance.variables.projectName}`);
        processInstance.variables.approvedBy = context.approvedBy;
        processInstance.variables.approvedBudget = context.approvedBudget || processInstance.variables.estimatedBudget;
        processInstance.variables.approvalNotes = context.approvalNotes;
        processInstance.variables.approvedAt = new Date().toISOString();

        if (!processInstance.variables.projectId) {
          processInstance.variables.projectId = `PROJ-${Date.now()}`;
        }
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Create project plan',
        actionLabel: 'Start Planning'
      }]
    },

    planned: {
      name: 'Planned',
      description: 'Project planning in progress',
      transitions: ['active', 'approved'],
      onEnter: async (processInstance) => {
        console.log(`Planning project: ${processInstance.variables.projectName}`);
        processInstance.variables.planningStartedAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete project planning and start execution',
        actionLabel: 'Activate Project'
      }]
    },

    active: {
      name: 'Active',
      description: 'Project is active',
      transitions: ['closed'],
      onEnter: async (processInstance, context) => {
        console.log(`Project activated: ${processInstance.variables.projectName}`);
        processInstance.variables.actualStartDate = context.actualStartDate || new Date().toISOString();

        // TODO: Create project in project management system
        // TODO: Assign team members
        // TODO: Create initial milestones
      }
    },

    closed: {
      name: 'Closed',
      description: 'Project closed',
      transitions: [],
      onEnter: async (processInstance) => {
        console.log(`Project closed: ${processInstance.variables.projectName}`);
        processInstance.variables.closedAt = new Date().toISOString();

        // Calculate project initiation duration
        if (processInstance.variables.conceptDate && processInstance.variables.closedAt) {
          const start = new Date(processInstance.variables.conceptDate);
          const end = new Date(processInstance.variables.closedAt);
          processInstance.variables.initiationDuration = end - start;
        }
      }
    },

    rejected: {
      name: 'Rejected',
      description: 'Project rejected',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Project rejected: ${processInstance.variables.projectName}`);
        processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        processInstance.variables.rejectedAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.PROJECTS,
    tags: ['project', 'initiation', 'planning'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'sponsor', 'project_manager', 'manager', 'admin', 'owner'],
      transition: {
        concept_to_proposal: ['creator', 'sponsor', 'member', 'admin', 'owner'],
        proposal_to_review: ['system'],
        review_to_approved: ['manager', 'director', 'owner'],
        review_to_rejected: ['manager', 'director', 'owner'],
        approved_to_planned: ['sponsor', 'project_manager', 'manager', 'owner'],
        planned_to_active: ['project_manager', 'manager', 'owner'],
        active_to_closed: ['project_manager', 'manager', 'owner']
      }
    },
    icon: 'rocket-outline',
    color: '#8b5cf6' // purple
  }
};

export default projectInitiationDefinition;
