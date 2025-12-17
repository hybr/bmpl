/**
 * Customer Onboarding Process Definition
 * New customer verification and account setup workflow
 *
 * Field Principles:
 * - Auto-generated IDs are system fields (not shown in forms)
 * - User references use userLookup with verify button
 * - Fields are assigned to specific steps/states
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Customer Onboarding Process
 *
 * State Flow:
 * application → verification → credit_check → approved → account_setup → active | rejected
 */
export const customerOnboardingDefinition = {
  id: 'customer_onboarding_v1',
  name: 'Customer Onboarding',
  description: 'New customer verification and account setup',
  type: PROCESS_TYPES.CUSTOMER_ONBOARDING,
  version: '1.0.0',
  initialState: 'application',

  // Variable schema
  variables: {
    // === SYSTEM FIELDS (auto-generated) ===
    applicationId: {
      type: 'string',
      required: false,
      step: 'system',
      description: 'Auto-generated application ID'
    },
    customerId: {
      type: 'string',
      required: false,
      step: 'system',
      description: 'Auto-generated customer ID'
    },
    accountNumber: {
      type: 'string',
      required: false,
      step: 'system',
      description: 'Auto-generated account number'
    },

    // === CREATE/APPLICATION STEP FIELDS ===

    // Customer details
    customerName: {
      type: 'string',
      required: true,
      step: 'create',
      placeholder: 'Customer/Company name'
    },

    legalBusinessName: {
      type: 'string',
      required: false,
      step: 'create',
      placeholder: 'Legal business name (if different)'
    },

    businessType: {
      type: 'string',
      required: true,
      step: 'create',
      foreignKey: {
        options: [
          { value: 'individual', label: 'Individual' },
          { value: 'sole_proprietor', label: 'Sole Proprietor' },
          { value: 'partnership', label: 'Partnership' },
          { value: 'llc', label: 'LLC' },
          { value: 'corporation', label: 'Corporation' },
          { value: 'non_profit', label: 'Non-Profit' },
          { value: 'government', label: 'Government' }
        ]
      }
    },

    industry: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'industries',
        searchFields: ['name', 'code'],
        displayTemplate: '{name}',
        placeholder: 'Select industry'
      }
    },

    // Primary contact - User lookup or new entry
    primaryContactEmail: {
      type: 'string',
      required: true,
      step: 'create',
      placeholder: 'Primary contact email'
    },

    primaryContactPhone: {
      type: 'string',
      required: true,
      step: 'create',
      placeholder: 'Primary contact phone'
    },

    // Address
    businessStreet: {
      type: 'string',
      required: true,
      step: 'create',
      placeholder: 'Street address'
    },

    businessCity: {
      type: 'string',
      required: true,
      step: 'create',
      placeholder: 'City'
    },

    businessState: {
      type: 'string',
      required: true,
      step: 'create',
      placeholder: 'State/Province'
    },

    businessPostalCode: {
      type: 'string',
      required: true,
      step: 'create',
      placeholder: 'Postal code'
    },

    businessCountry: {
      type: 'string',
      required: true,
      step: 'create',
      default: 'USA',
      foreignKey: {
        options: ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Other']
      }
    },

    // Account type
    accountType: {
      type: 'string',
      required: false,
      step: 'create',
      default: 'standard',
      foreignKey: {
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
          { value: 'enterprise', label: 'Enterprise' }
        ]
      }
    },

    // Credit limit request
    requestedCreditLimit: {
      type: 'number',
      required: false,
      step: 'create',
      min: 0,
      placeholder: 'Requested credit limit ($)'
    },

    // Lead source
    source: {
      type: 'string',
      required: false,
      step: 'create',
      foreignKey: {
        options: [
          { value: 'website', label: 'Website' },
          { value: 'referral', label: 'Referral' },
          { value: 'sales_team', label: 'Sales Team' },
          { value: 'partner', label: 'Partner' },
          { value: 'trade_show', label: 'Trade Show' },
          { value: 'other', label: 'Other' }
        ]
      }
    },

    // Sales rep - User lookup
    salesRepId: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name'],
        displayFields: ['name', 'department'],
        placeholder: 'Assign sales representative'
      }
    },

    // Notes
    applicationNotes: {
      type: 'string',
      required: false,
      step: 'create',
      multiline: true,
      rows: 2,
      placeholder: 'Additional notes'
    },

    // === VERIFICATION STEP FIELDS ===
    taxId: {
      type: 'string',
      required: false,
      step: 'verification',
      placeholder: 'Tax ID / EIN'
    },

    registrationNumber: {
      type: 'string',
      required: false,
      step: 'verification',
      placeholder: 'Business registration number'
    },

    verificationNotes: {
      type: 'string',
      required: false,
      step: 'verification',
      multiline: true,
      rows: 2,
      placeholder: 'Verification notes'
    },

    // === CREDIT_CHECK STEP FIELDS ===
    creditCheckNotes: {
      type: 'string',
      required: false,
      step: 'credit_check',
      multiline: true,
      rows: 2,
      placeholder: 'Credit check notes'
    },

    approvedCreditLimit: {
      type: 'number',
      required: false,
      step: 'credit_check',
      min: 0,
      placeholder: 'Approved credit limit ($)'
    },

    paymentTerms: {
      type: 'string',
      required: false,
      step: 'credit_check',
      default: 'net_30',
      foreignKey: {
        options: [
          { value: 'net_15', label: 'Net 15' },
          { value: 'net_30', label: 'Net 30' },
          { value: 'net_60', label: 'Net 60' },
          { value: 'net_90', label: 'Net 90' },
          { value: 'immediate', label: 'Due on Receipt' },
          { value: 'prepaid', label: 'Prepaid' }
        ]
      }
    },

    approvalNotes: {
      type: 'string',
      required: false,
      step: 'credit_check',
      multiline: true,
      rows: 2,
      placeholder: 'Approval notes'
    },

    // === ACCOUNT_SETUP STEP FIELDS ===
    accountManagerId: {
      type: 'string',
      required: false,
      step: 'account_setup',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name'],
        displayFields: ['name', 'department'],
        placeholder: 'Assign account manager'
      }
    },

    setupNotes: {
      type: 'string',
      required: false,
      step: 'account_setup',
      multiline: true,
      rows: 2,
      placeholder: 'Account setup notes'
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

    // === SYSTEM TRACKING FIELDS ===
    businessAddress: { type: 'object', required: false, step: 'system' },
    billingAddress: { type: 'object', required: false, step: 'system' },
    primaryContactName: { type: 'string', required: false, step: 'system' },
    primaryContactTitle: { type: 'string', required: false, step: 'system' },
    verificationStatus: { type: 'string', required: false, step: 'system', enum: ['pending', 'verified', 'failed'] },
    verifiedBy: { type: 'string', required: false, step: 'system' },
    verifiedAt: { type: 'date', required: false, step: 'system' },
    creditCheckStatus: { type: 'string', required: false, step: 'system', enum: ['pending', 'approved', 'declined', 'manual_review'] },
    creditScore: { type: 'number', required: false, step: 'system', min: 0, max: 850 },
    creditCheckProvider: { type: 'string', required: false, step: 'system' },
    creditCheckedAt: { type: 'date', required: false, step: 'system' },
    approvedBy: { type: 'string', required: false, step: 'system' },
    setupCompletedBy: { type: 'string', required: false, step: 'system' },
    portalAccessEnabled: { type: 'boolean', required: false, step: 'system', default: false },
    welcomeEmailSent: { type: 'boolean', required: false, step: 'system', default: false },
    bankingDetails: { type: 'object', required: false, step: 'system' },
    businessReferences: { type: 'array', required: false, step: 'system', default: [] },
    documents: { type: 'array', required: false, step: 'system', default: [] },
    expectedMonthlyVolume: { type: 'number', required: false, step: 'system', min: 0 },
    applicationDate: { type: 'date', required: false, step: 'system' },
    approvedAt: { type: 'date', required: false, step: 'system' },
    activatedAt: { type: 'date', required: false, step: 'system' },
    rejectedAt: { type: 'date', required: false, step: 'system' },
    onboardingDuration: { type: 'number', required: false, step: 'system' }
  },

  // State definitions
  states: {
    // Application
    application: {
      name: 'Application',
      description: 'Customer application submitted',
      transitions: ['verification', 'rejected'],

      onEnter: async (processInstance, context) => {
        // Generate application ID
        if (!processInstance.variables.applicationId) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          processInstance.variables.applicationId = `CAPP-${timestamp}-${random}`;
        }

        processInstance.variables.applicationDate = new Date().toISOString();

        console.log(`Customer onboarding application ${processInstance.variables.applicationId}`);
      },

      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'verification'
          }
        ]
      }
    },

    // Verification
    verification: {
      name: 'Verification',
      description: 'Customer information is being verified',
      transitions: ['credit_check', 'rejected', 'application'],

      onEnter: async (processInstance, context) => {
        console.log(`Verifying customer ${processInstance.variables.customerName}`);
        processInstance.variables.verificationStatus = 'pending';
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Verify customer information and documents',
          actionLabel: 'Complete Verification'
        }
      ],

      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 14 * 24 * 60 * 60 * 1000, // 14 days
            toState: 'rejected',
            reason: 'Verification not completed within 14 days'
          }
        ]
      }
    },

    // Credit Check
    credit_check: {
      name: 'Credit Check',
      description: 'Credit assessment in progress',
      transitions: ['approved', 'rejected', 'verification'],

      onEnter: async (processInstance, context) => {
        console.log(`Running credit check for ${processInstance.variables.customerName}`);

        if (context.verifiedBy) {
          processInstance.variables.verifiedBy = context.verifiedBy;
        }
        processInstance.variables.verificationStatus = 'verified';
        processInstance.variables.verifiedAt = new Date().toISOString();
        processInstance.variables.creditCheckStatus = 'pending';

        // Auto-approve government entities
        if (processInstance.variables.businessType === 'government') {
          processInstance.variables.creditCheckStatus = 'approved';
          processInstance.variables.creditCheckNotes = 'Government entity - auto-approved';
        }
      },

      autoTransition: {
        conditions: [
          {
            type: 'condition',
            toState: 'approved',
            conditions: [
              {
                type: 'variable',
                field: 'creditCheckStatus',
                operator: 'eq',
                value: 'approved'
              }
            ],
            reason: 'Credit check passed automatically'
          },
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'rejected',
            reason: 'Credit check not completed within 7 days'
          }
        ]
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Review credit check results and approve customer',
          actionLabel: 'Review Credit Check',
          metadata: {
            approveLabel: 'Approve Customer',
            rejectLabel: 'Decline'
          }
        }
      ]
    },

    // Approved
    approved: {
      name: 'Approved',
      description: 'Customer has been approved',
      transitions: ['account_setup'],

      onEnter: async (processInstance, context) => {
        console.log(`Customer ${processInstance.variables.customerName} approved`);

        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }
        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }
        if (context.approvedCreditLimit) {
          processInstance.variables.approvedCreditLimit = context.approvedCreditLimit;
        } else if (processInstance.variables.requestedCreditLimit) {
          processInstance.variables.approvedCreditLimit = processInstance.variables.requestedCreditLimit;
        }

        processInstance.variables.approvedAt = new Date().toISOString();
      },

      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'account_setup'
          }
        ]
      }
    },

    // Account Setup
    account_setup: {
      name: 'Account Setup',
      description: 'Customer account is being set up',
      transitions: ['active'],

      onEnter: async (processInstance, context) => {
        console.log(`Setting up account for ${processInstance.variables.customerName}`);

        // Generate customer ID and account number
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);

        if (!processInstance.variables.customerId) {
          processInstance.variables.customerId = `CUST-${timestamp}-${random}`;
        }
        if (!processInstance.variables.accountNumber) {
          processInstance.variables.accountNumber = `ACC-${timestamp}-${random}`;
        }
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Complete account setup and enable portal access',
          actionLabel: 'Complete Setup'
        }
      ]
    },

    // Active (terminal state)
    active: {
      name: 'Active',
      description: 'Customer account is active',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Customer ${processInstance.variables.customerName} is now active`);

        if (context.setupCompletedBy) {
          processInstance.variables.setupCompletedBy = context.setupCompletedBy;
        }

        processInstance.variables.activatedAt = new Date().toISOString();
        processInstance.variables.portalAccessEnabled = true;
        processInstance.variables.welcomeEmailSent = true;

        // Calculate onboarding duration
        if (processInstance.variables.applicationDate && processInstance.variables.activatedAt) {
          const appDate = new Date(processInstance.variables.applicationDate);
          const activeDate = new Date(processInstance.variables.activatedAt);
          processInstance.variables.onboardingDuration = activeDate.getTime() - appDate.getTime();
        }
      }
    },

    // Rejected (terminal state)
    rejected: {
      name: 'Rejected',
      description: 'Customer application has been rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Customer application rejected for ${processInstance.variables.customerName}`);

        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }

        processInstance.variables.rejectedAt = new Date().toISOString();
      }
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.CUSTOMER,
    tags: ['customer', 'onboarding', 'verification', 'credit_check'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'sales_rep', 'manager', 'admin', 'owner'],
      transition: {
        application_to_verification: ['system'],
        verification_to_credit_check: ['member', 'admin', 'owner'],
        verification_to_application: ['member', 'admin', 'owner'],
        credit_check_to_approved: ['manager', 'admin', 'owner'],
        credit_check_to_verification: ['member', 'admin', 'owner'],
        approved_to_account_setup: ['system'],
        account_setup_to_active: ['member', 'admin', 'owner'],
        any_to_rejected: ['manager', 'admin', 'owner']
      }
    },
    icon: 'person-add',
    color: '#8b5cf6' // purple
  }
};

export default customerOnboardingDefinition;
