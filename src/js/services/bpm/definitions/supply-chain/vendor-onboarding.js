/**
 * Vendor Onboarding Process Definition
 * New vendor verification and onboarding workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const vendorOnboardingDefinition = {
  id: 'vendor_onboarding_v1',
  name: 'Vendor Onboarding',
  description: 'New vendor verification and onboarding workflow',
  type: PROCESS_TYPES.SC_VENDOR_ONBOARDING,
  version: '1.0.0',
  initialState: 'application',

  variables: {
    // Vendor details
    vendorId: { type: 'string', required: false },
    vendorName: { type: 'string', required: true },
    legalBusinessName: { type: 'string', required: false },
    taxId: { type: 'string', required: false },
    businessType: {
      type: 'string',
      required: false,
      enum: ['sole_proprietor', 'partnership', 'llc', 'corporation']
    },

    // Contact information
    primaryContactName: { type: 'string', required: true },
    primaryContactEmail: { type: 'string', required: true },
    primaryContactPhone: { type: 'string', required: true },

    // Address
    businessAddress: {
      type: 'object',
      required: true,
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' }
      }
    },

    // Products/Services
    productsServices: { type: 'string', required: true },
    categories: { type: 'array', required: false, default: [] },

    // Financial
    paymentTerms: {
      type: 'string',
      required: false,
      enum: ['net_15', 'net_30', 'net_60', 'net_90', 'immediate'],
      default: 'net_30'
    },
    bankingDetails: {
      type: 'object',
      required: false,
      properties: {
        bankName: { type: 'string' },
        accountNumber: { type: 'string' },
        routingNumber: { type: 'string' }
      }
    },

    // Verification
    verificationStatus: {
      type: 'string',
      required: false,
      enum: ['pending', 'verified', 'failed']
    },
    verifiedBy: { type: 'string', required: false },

    // Compliance
    complianceCheckStatus: {
      type: 'string',
      required: false,
      enum: ['pending', 'passed', 'failed']
    },
    complianceNotes: { type: 'string', required: false },
    insuranceCertificate: { type: 'boolean', required: false, default: false },
    w9Form: { type: 'boolean', required: false, default: false },

    // Approval
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Contract
    contractSigned: { type: 'boolean', required: false, default: false },
    contractDate: { type: 'date', required: false },
    contractExpiryDate: { type: 'date', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    application: {
      name: 'Application',
      description: 'Vendor application submitted',
      transitions: ['review'],
      onEnter: async (processInstance) => {
        console.log(`Vendor onboarding application for ${processInstance.variables.vendorName}`);
        processInstance.variables.applicationDate = new Date().toISOString();
        if (!processInstance.variables.vendorId) {
          processInstance.variables.vendorId = `VEND-${Date.now()}`;
        }
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'review' }]
      }
    },

    review: {
      name: 'Review',
      description: 'Application under review',
      transitions: ['compliance_check', 'rejected'],
      onEnter: async (processInstance) => {
        console.log(`Reviewing vendor application for ${processInstance.variables.vendorName}`);
        processInstance.variables.verificationStatus = 'pending';
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Review vendor application and documents',
        actionLabel: 'Complete Review'
      }],
      autoTransition: {
        conditions: [{
          type: 'timer',
          duration: 14 * 24 * 60 * 60 * 1000, // 14 days
          toState: 'rejected',
          reason: 'Review not completed within 14 days'
        }]
      }
    },

    compliance_check: {
      name: 'Compliance Check',
      description: 'Compliance verification in progress',
      transitions: ['approved', 'rejected', 'review'],
      onEnter: async (processInstance, context) => {
        console.log(`Compliance check for vendor ${processInstance.variables.vendorName}`);
        processInstance.variables.verificationStatus = 'verified';
        processInstance.variables.verifiedBy = context.verifiedBy;
        processInstance.variables.complianceCheckStatus = 'pending';

        // TODO: Run compliance checks
        // - Credit check
        // - Background check
        // - Insurance verification
        // - References verification
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Review compliance check results',
        actionLabel: 'Approve Vendor'
      }]
    },

    approved: {
      name: 'Approved',
      description: 'Vendor approved',
      transitions: ['contract_signed'],
      onEnter: async (processInstance, context) => {
        console.log(`Vendor ${processInstance.variables.vendorName} approved`);
        processInstance.variables.approvedBy = context.approvedBy;
        processInstance.variables.approvalNotes = context.approvalNotes;
        processInstance.variables.approvedAt = new Date().toISOString();
        processInstance.variables.complianceCheckStatus = 'passed';

        // TODO: Send approval notification
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Send contract to vendor for signature',
        actionLabel: 'Send Contract'
      }]
    },

    contract_signed: {
      name: 'Contract Signed',
      description: 'Contract has been signed',
      transitions: ['active'],
      onEnter: async (processInstance, context) => {
        console.log(`Contract signed for vendor ${processInstance.variables.vendorName}`);
        processInstance.variables.contractSigned = true;
        processInstance.variables.contractDate = context.contractDate || new Date().toISOString();

        // Set contract expiry (default 1 year)
        if (!processInstance.variables.contractExpiryDate) {
          const expiry = new Date();
          expiry.setFullYear(expiry.getFullYear() + 1);
          processInstance.variables.contractExpiryDate = expiry.toISOString();
        }
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'active' }]
      }
    },

    active: {
      name: 'Active',
      description: 'Vendor is active',
      transitions: [],
      onEnter: async (processInstance) => {
        console.log(`Vendor ${processInstance.variables.vendorName} is now active`);
        processInstance.variables.activeAt = new Date().toISOString();

        // Calculate onboarding duration
        if (processInstance.variables.applicationDate) {
          const start = new Date(processInstance.variables.applicationDate);
          const end = new Date(processInstance.variables.activeAt);
          processInstance.variables.onboardingDuration = end - start;
        }

        // TODO: Create vendor record in ERP
        // TODO: Setup vendor portal access
        // TODO: Send welcome email
      }
    },

    rejected: {
      name: 'Rejected',
      description: 'Vendor application rejected',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Vendor ${processInstance.variables.vendorName} rejected`);
        processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        processInstance.variables.rejectedAt = new Date().toISOString();

        // TODO: Send rejection notification
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.SUPPLY_CHAIN,
    tags: ['vendor', 'supplier', 'procurement', 'onboarding'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'procurement', 'manager', 'admin', 'owner'],
      transition: {
        application_to_review: ['system'],
        review_to_compliance_check: ['member', 'admin', 'owner'],
        review_to_rejected: ['manager', 'admin', 'owner'],
        compliance_check_to_approved: ['manager', 'admin', 'owner'],
        compliance_check_to_rejected: ['manager', 'admin', 'owner'],
        approved_to_contract_signed: ['member', 'vendor', 'admin', 'owner'],
        contract_signed_to_active: ['system']
      }
    },
    icon: 'people-outline',
    color: '#8b5cf6' // purple
  }
};

export default vendorOnboardingDefinition;
