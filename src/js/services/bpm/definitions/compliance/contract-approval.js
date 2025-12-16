/**
 * Contract Approval Process Definition
 * Contract review and approval workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const contractApprovalDefinition = {
  id: 'contract_approval_v1',
  name: 'Contract Approval',
  description: 'Contract review and approval workflow',
  type: PROCESS_TYPES.LEGAL_CONTRACT,
  version: '1.0.0',
  initialState: 'draft',

  variables: {
    contractId: { type: 'string', required: false },
    contractTitle: { type: 'string', required: true },
    contractType: {
      type: 'string',
      required: true,
      enum: ['vendor', 'customer', 'employment', 'partnership', 'nda', 'other']
    },
    partyName: { type: 'string', required: true },
    contractValue: { type: 'number', required: false, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },
    startDate: { type: 'date', required: false },
    endDate: { type: 'date', required: false },
    autoRenew: { type: 'boolean', required: false, default: false },
    legalReviewedBy: { type: 'string', required: false },
    financeReviewedBy: { type: 'string', required: false },
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },
    signedBy: { type: 'string', required: false },
    signedDate: { type: 'date', required: false },
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    draft: {
      name: 'Draft',
      description: 'Contract being drafted',
      transitions: ['legal_review'],
      onEnter: async (processInstance) => {
        console.log(`Contract draft: ${processInstance.variables.contractTitle}`);
        if (!processInstance.variables.contractId) {
          processInstance.variables.contractId = `CTR-${Date.now()}`;
        }
      }
    },

    legal_review: {
      name: 'Legal Review',
      description: 'Under legal review',
      transitions: ['finance_review', 'executive_approval', 'draft', 'rejected'],
      onEnter: async (processInstance) => {
        console.log(`Legal review: ${processInstance.variables.contractTitle}`);
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.ADMIN,
        message: 'Review contract for legal compliance',
        actionLabel: 'Legal Review'
      }],
      autoTransition: {
        conditions: [{
          type: 'condition',
          toState: 'finance_review',
          conditions: [{
            type: 'variable',
            field: 'contractValue',
            operator: 'gt',
            value: 0
          }],
          reason: 'Finance review required for contracts with value'
        }]
      }
    },

    finance_review: {
      name: 'Finance Review',
      description: 'Under finance review',
      transitions: ['executive_approval', 'legal_review', 'rejected'],
      onEnter: async (processInstance, context) => {
        console.log(`Finance review: ${processInstance.variables.contractTitle}`);
        processInstance.variables.legalReviewedBy = context.legalReviewedBy;
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Review contract financials',
        actionLabel: 'Finance Review'
      }]
    },

    executive_approval: {
      name: 'Executive Approval',
      description: 'Awaiting executive approval',
      transitions: ['signed', 'rejected'],
      onEnter: async (processInstance, context) => {
        console.log(`Executive approval: ${processInstance.variables.contractTitle}`);
        if (context.financeReviewedBy) {
          processInstance.variables.financeReviewedBy = context.financeReviewedBy;
        }
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.DIRECTOR,
        message: 'Approve contract for signature',
        actionLabel: 'Approve'
      }]
    },

    signed: {
      name: 'Signed',
      description: 'Contract signed',
      transitions: ['active'],
      onEnter: async (processInstance, context) => {
        console.log(`Contract signed: ${processInstance.variables.contractTitle}`);
        processInstance.variables.approvedBy = context.approvedBy;
        processInstance.variables.signedBy = context.signedBy;
        processInstance.variables.signedDate = context.signedDate || new Date().toISOString();
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'active' }]
      }
    },

    active: {
      name: 'Active',
      description: 'Contract is active',
      transitions: ['expired'],
      onEnter: async (processInstance) => {
        console.log(`Contract active: ${processInstance.variables.contractTitle}`);
        processInstance.variables.activeAt = new Date().toISOString();
      }
    },

    expired: {
      name: 'Expired',
      description: 'Contract expired',
      transitions: [],
      onEnter: async (processInstance) => {
        console.log(`Contract expired: ${processInstance.variables.contractTitle}`);
        processInstance.variables.expiredAt = new Date().toISOString();
      }
    },

    rejected: {
      name: 'Rejected',
      description: 'Contract rejected',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Contract rejected: ${processInstance.variables.contractTitle}`);
        processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        processInstance.variables.rejectedAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.COMPLIANCE,
    tags: ['contract', 'legal', 'compliance', 'approval'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'legal', 'finance', 'manager', 'admin', 'owner'],
      transition: {
        draft_to_legal_review: ['creator', 'member', 'admin', 'owner'],
        legal_review_to_finance_review: ['system', 'admin', 'owner'],
        legal_review_to_executive_approval: ['admin', 'owner'],
        finance_review_to_executive_approval: ['manager', 'owner'],
        executive_approval_to_signed: ['director', 'owner'],
        signed_to_active: ['system'],
        any_to_rejected: ['admin', 'director', 'owner']
      }
    },
    icon: 'document-text-outline',
    color: '#6366f1' // indigo
  }
};

export default contractApprovalDefinition;
