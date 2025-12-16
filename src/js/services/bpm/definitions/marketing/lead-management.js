/**
 * Lead Management Process Definition
 * Sales lead tracking and conversion workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const leadManagementDefinition = {
  id: 'lead_management_v1',
  name: 'Lead Management',
  description: 'Sales lead tracking and conversion workflow',
  type: PROCESS_TYPES.MARKETING_LEAD,
  version: '1.0.0',
  initialState: 'new',

  variables: {
    // Lead details
    leadId: { type: 'string', required: true },
    firstName: { type: 'string', required: true },
    lastName: { type: 'string', required: true },
    email: { type: 'string', required: true },
    phone: { type: 'string', required: false },
    company: { type: 'string', required: false },
    jobTitle: { type: 'string', required: false },

    // Lead source
    source: {
      type: 'string',
      required: false,
      enum: ['website', 'referral', 'social_media', 'email_campaign', 'trade_show', 'cold_call', 'other']
    },
    campaign: { type: 'string', required: false },

    // Lead scoring
    score: { type: 'number', required: false, min: 0, max: 100, default: 0 },
    grade: {
      type: 'string',
      required: false,
      enum: ['A', 'B', 'C', 'D'],
      default: 'C'
    },

    // Interest and budget
    interestedProducts: { type: 'array', required: false, default: [] },
    estimatedValue: { type: 'number', required: false, min: 0 },
    budget: { type: 'string', required: false },
    timeframe: {
      type: 'string',
      required: false,
      enum: ['immediate', '1-3_months', '3-6_months', '6-12_months', 'not_specified']
    },

    // Assignment
    assignedTo: { type: 'string', required: false },
    assignedToName: { type: 'string', required: false },

    // Qualification
    qualifiedBy: { type: 'string', required: false },
    qualificationNotes: { type: 'string', required: false },
    disqualificationReason: { type: 'string', required: false },

    // Sales activities
    contactAttempts: { type: 'number', required: false, default: 0 },
    lastContactDate: { type: 'date', required: false },
    meetingsScheduled: { type: 'number', required: false, default: 0 },
    proposalSent: { type: 'boolean', required: false, default: false },
    proposalDate: { type: 'date', required: false },

    // Conversion
    opportunityId: { type: 'string', required: false },
    dealValue: { type: 'number', required: false, min: 0 },
    closedDate: { type: 'date', required: false },
    lossReason: { type: 'string', required: false },

    // Notes
    notes: { type: 'string', required: false },
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    new: {
      name: 'New',
      description: 'New lead captured',
      transitions: ['contacted', 'disqualified'],
      onEnter: async (processInstance) => {
        console.log(`New lead: ${processInstance.variables.firstName} ${processInstance.variables.lastName}`);
        processInstance.variables.createdAt = new Date().toISOString();

        // Auto-score based on criteria
        let score = 0;
        if (processInstance.variables.company) score += 10;
        if (processInstance.variables.phone) score += 10;
        if (processInstance.variables.estimatedValue) score += 20;
        processInstance.variables.score = score;
      },
      autoTransition: {
        conditions: [{
          type: 'timer',
          duration: 7 * 24 * 60 * 60 * 1000, // 7 days
          toState: 'disqualified',
          reason: 'No contact attempted within 7 days'
        }]
      }
    },

    contacted: {
      name: 'Contacted',
      description: 'Lead has been contacted',
      transitions: ['qualified', 'disqualified', 'new'],
      onEnter: async (processInstance, context) => {
        console.log(`Lead contacted: ${processInstance.variables.leadId}`);
        processInstance.variables.contactAttempts = (processInstance.variables.contactAttempts || 0) + 1;
        processInstance.variables.lastContactDate = new Date().toISOString();
        if (context.assignedTo) {
          processInstance.variables.assignedTo = context.assignedTo;
        }
      },
      autoTransition: {
        conditions: [{
          type: 'timer',
          duration: 30 * 24 * 60 * 60 * 1000, // 30 days
          toState: 'disqualified',
          reason: 'Stale lead - no activity for 30 days'
        }]
      }
    },

    qualified: {
      name: 'Qualified',
      description: 'Lead is qualified',
      transitions: ['proposal', 'negotiation', 'disqualified'],
      onEnter: async (processInstance, context) => {
        console.log(`Lead qualified: ${processInstance.variables.leadId}`);
        processInstance.variables.qualifiedBy = context.qualifiedBy;
        processInstance.variables.qualificationNotes = context.qualificationNotes;
        processInstance.variables.qualifiedAt = new Date().toISOString();

        // Increase score
        processInstance.variables.score = Math.min((processInstance.variables.score || 0) + 30, 100);
      }
    },

    proposal: {
      name: 'Proposal',
      description: 'Proposal sent to lead',
      transitions: ['negotiation', 'won', 'lost'],
      onEnter: async (processInstance, context) => {
        console.log(`Proposal sent to lead: ${processInstance.variables.leadId}`);
        processInstance.variables.proposalSent = true;
        processInstance.variables.proposalDate = context.proposalDate || new Date().toISOString();
      },
      autoTransition: {
        conditions: [{
          type: 'timer',
          duration: 60 * 24 * 60 * 60 * 1000, // 60 days
          toState: 'lost',
          reason: 'No response to proposal within 60 days'
        }]
      }
    },

    negotiation: {
      name: 'Negotiation',
      description: 'Negotiating with lead',
      transitions: ['won', 'lost', 'proposal'],
      onEnter: async (processInstance) => {
        console.log(`Negotiating with lead: ${processInstance.variables.leadId}`);
        processInstance.variables.negotiationStartedAt = new Date().toISOString();
        processInstance.variables.score = 90; // High probability
      }
    },

    won: {
      name: 'Won',
      description: 'Lead converted to customer',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Lead won: ${processInstance.variables.leadId}`);
        processInstance.variables.closedDate = context.closedDate || new Date().toISOString();
        processInstance.variables.dealValue = context.dealValue;
        processInstance.variables.score = 100;

        // Calculate conversion time
        if (processInstance.variables.createdAt) {
          const created = new Date(processInstance.variables.createdAt);
          const closed = new Date(processInstance.variables.closedDate);
          processInstance.variables.conversionTime = closed - created;
        }

        // TODO: Create customer record
        // TODO: Create sales order
      }
    },

    lost: {
      name: 'Lost',
      description: 'Lead was lost',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Lead lost: ${processInstance.variables.leadId}`);
        processInstance.variables.lossReason = context.lossReason || context.reason;
        processInstance.variables.closedDate = new Date().toISOString();
        processInstance.variables.score = 0;
      }
    },

    disqualified: {
      name: 'Disqualified',
      description: 'Lead disqualified',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Lead disqualified: ${processInstance.variables.leadId}`);
        processInstance.variables.disqualificationReason = context.reason || context.disqualificationReason;
        processInstance.variables.disqualifiedAt = new Date().toISOString();
        processInstance.variables.score = 0;
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.MARKETING,
    tags: ['lead', 'sales', 'marketing', 'crm'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'sales', 'marketing', 'manager', 'admin', 'owner'],
      transition: {
        new_to_contacted: ['sales', 'member', 'admin', 'owner'],
        contacted_to_qualified: ['sales', 'member', 'admin', 'owner'],
        qualified_to_proposal: ['sales', 'member', 'admin', 'owner'],
        proposal_to_negotiation: ['sales', 'member', 'admin', 'owner'],
        negotiation_to_won: ['sales', 'manager', 'admin', 'owner'],
        any_to_lost: ['sales', 'manager', 'admin', 'owner'],
        any_to_disqualified: ['sales', 'manager', 'admin', 'owner']
      }
    },
    icon: 'trending-up-outline',
    color: '#f59e0b' // amber
  }
};

export default leadManagementDefinition;
