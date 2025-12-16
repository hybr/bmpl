/**
 * Campaign Approval Process Definition
 * Marketing campaign approval and execution workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const campaignApprovalDefinition = {
  id: 'campaign_approval_v1',
  name: 'Campaign Approval',
  description: 'Marketing campaign approval and execution workflow',
  type: PROCESS_TYPES.MARKETING_CAMPAIGN,
  version: '1.0.0',
  initialState: 'draft',

  variables: {
    // Campaign details
    campaignId: { type: 'string', required: false },
    campaignName: { type: 'string', required: true },
    description: { type: 'string', required: true },
    campaignType: {
      type: 'string',
      required: true,
      enum: ['email', 'social_media', 'content', 'paid_ads', 'event', 'multi_channel']
    },

    // Objectives
    objective: { type: 'string', required: true },
    targetAudience: { type: 'string', required: true },
    kpis: { type: 'array', required: false, default: [] },
    successMetrics: { type: 'string', required: false },

    // Budget
    estimatedBudget: { type: 'number', required: true, min: 0 },
    approvedBudget: { type: 'number', required: false, min: 0 },
    actualSpend: { type: 'number', required: false, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },

    // Timeline
    plannedStartDate: { type: 'date', required: true },
    plannedEndDate: { type: 'date', required: true },
    actualStartDate: { type: 'date', required: false },
    actualEndDate: { type: 'date', required: false },

    // Team
    campaignOwnerId: { type: 'string', required: true },
    campaignOwnerName: { type: 'string', required: true },
    teamMembers: { type: 'array', required: false, default: [] },

    // Content
    contentReady: { type: 'boolean', required: false, default: false },
    contentNotes: { type: 'string', required: false },

    // Approval workflow
    contentReviewedBy: { type: 'string', required: false },
    legalReviewedBy: { type: 'string', required: false },
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Legal/Compliance
    legalApprovalRequired: { type: 'boolean', required: false, default: false },
    complianceNotes: { type: 'string', required: false },

    // Results
    impressions: { type: 'number', required: false, min: 0 },
    clicks: { type: 'number', required: false, min: 0 },
    conversions: { type: 'number', required: false, min: 0 },
    roi: { type: 'number', required: false },
    performanceSummary: { type: 'string', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    draft: {
      name: 'Draft',
      description: 'Campaign being drafted',
      transitions: ['content_review', 'rejected'],
      onEnter: async (processInstance) => {
        console.log(`Campaign draft: ${processInstance.variables.campaignName}`);
        processInstance.variables.draftCreatedAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete campaign details and submit for review',
        actionLabel: 'Submit for Review'
      }]
    },

    content_review: {
      name: 'Content Review',
      description: 'Content under review',
      transitions: ['legal_review', 'approved', 'draft', 'rejected'],
      onEnter: async (processInstance) => {
        console.log(`Content review for campaign: ${processInstance.variables.campaignName}`);
        processInstance.variables.contentReviewStartedAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Review campaign content',
        actionLabel: 'Review Content'
      }],
      autoTransition: {
        conditions: [{
          type: 'condition',
          toState: 'legal_review',
          conditions: [{
            type: 'variable',
            field: 'legalApprovalRequired',
            operator: 'eq',
            value: true
          }],
          reason: 'Legal review required'
        }, {
          type: 'condition',
          toState: 'approved',
          conditions: [{
            type: 'variable',
            field: 'legalApprovalRequired',
            operator: 'eq',
            value: false
          }],
          reason: 'No legal review required'
        }]
      }
    },

    legal_review: {
      name: 'Legal Review',
      description: 'Legal and compliance review',
      transitions: ['approved', 'content_review', 'rejected'],
      onEnter: async (processInstance, context) => {
        console.log(`Legal review for campaign: ${processInstance.variables.campaignName}`);
        processInstance.variables.contentReviewedBy = context.contentReviewedBy;
        processInstance.variables.legalReviewStartedAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.ADMIN,
        message: 'Review campaign for legal compliance',
        actionLabel: 'Legal Review'
      }]
    },

    approved: {
      name: 'Approved',
      description: 'Campaign approved',
      transitions: ['scheduled'],
      onEnter: async (processInstance, context) => {
        console.log(`Campaign approved: ${processInstance.variables.campaignName}`);
        processInstance.variables.approvedBy = context.approvedBy;
        processInstance.variables.approvalNotes = context.approvalNotes;
        processInstance.variables.approvedBudget = context.approvedBudget || processInstance.variables.estimatedBudget;
        processInstance.variables.approvedAt = new Date().toISOString();

        if (!processInstance.variables.campaignId) {
          processInstance.variables.campaignId = `CAMP-${Date.now()}`;
        }
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Schedule campaign execution',
        actionLabel: 'Schedule Campaign'
      }]
    },

    scheduled: {
      name: 'Scheduled',
      description: 'Campaign scheduled',
      transitions: ['active', 'approved'],
      onEnter: async (processInstance) => {
        console.log(`Campaign scheduled: ${processInstance.variables.campaignName}`);
        processInstance.variables.scheduledAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Launch campaign',
        actionLabel: 'Launch'
      }]
    },

    active: {
      name: 'Active',
      description: 'Campaign is running',
      transitions: ['completed'],
      onEnter: async (processInstance, context) => {
        console.log(`Campaign active: ${processInstance.variables.campaignName}`);
        processInstance.variables.actualStartDate = context.actualStartDate || new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Mark campaign as completed',
        actionLabel: 'Complete Campaign'
      }]
    },

    completed: {
      name: 'Completed',
      description: 'Campaign completed',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Campaign completed: ${processInstance.variables.campaignName}`);
        processInstance.variables.actualEndDate = context.actualEndDate || new Date().toISOString();
        processInstance.variables.completedAt = new Date().toISOString();

        // Record results
        if (context.impressions) processInstance.variables.impressions = context.impressions;
        if (context.clicks) processInstance.variables.clicks = context.clicks;
        if (context.conversions) processInstance.variables.conversions = context.conversions;
        if (context.actualSpend) processInstance.variables.actualSpend = context.actualSpend;

        // Calculate ROI if data available
        if (processInstance.variables.conversions && processInstance.variables.actualSpend) {
          // Simplified ROI calculation
          processInstance.variables.roi = (processInstance.variables.conversions / processInstance.variables.actualSpend) * 100;
        }
      }
    },

    rejected: {
      name: 'Rejected',
      description: 'Campaign rejected',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Campaign rejected: ${processInstance.variables.campaignName}`);
        processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        processInstance.variables.rejectedAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.MARKETING,
    tags: ['campaign', 'marketing', 'approval', 'advertising'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'campaign_owner', 'marketing', 'manager', 'admin', 'owner'],
      transition: {
        draft_to_content_review: ['creator', 'campaign_owner', 'member', 'admin', 'owner'],
        content_review_to_legal_review: ['system', 'manager', 'owner'],
        content_review_to_approved: ['system', 'manager', 'owner'],
        content_review_to_draft: ['manager', 'owner'],
        legal_review_to_approved: ['admin', 'owner'],
        legal_review_to_content_review: ['admin', 'owner'],
        approved_to_scheduled: ['campaign_owner', 'member', 'admin', 'owner'],
        scheduled_to_active: ['campaign_owner', 'member', 'admin', 'owner'],
        active_to_completed: ['campaign_owner', 'member', 'admin', 'owner'],
        any_to_rejected: ['manager', 'admin', 'owner']
      }
    },
    icon: 'megaphone-outline',
    color: '#ec4899' // pink
  }
};

export default campaignApprovalDefinition;
