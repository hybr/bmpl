/**
 * Customer Onboarding Process Definition
 * New customer verification and account setup workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Customer Onboarding Process
 *
 * State Flow:
 * application → verification → credit_check → approved → account_setup → active | rejected
 *
 * Purpose: Onboard new customers with proper verification and account setup
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
    // Customer details
    customerName: { type: 'string', required: true },
    legalBusinessName: { type: 'string', required: false },
    businessType: {
      type: 'string',
      required: true,
      enum: ['individual', 'sole_proprietor', 'partnership', 'llc', 'corporation', 'non_profit', 'government']
    },
    industry: { type: 'string', required: false },
    taxId: { type: 'string', required: false },
    registrationNumber: { type: 'string', required: false },

    // Contact information
    primaryContactName: { type: 'string', required: true },
    primaryContactTitle: { type: 'string', required: false },
    primaryContactEmail: { type: 'string', required: true },
    primaryContactPhone: { type: 'string', required: true },

    // Business address
    businessAddress: {
      type: 'object',
      required: true,
      properties: {
        street: { type: 'string', required: true },
        street2: { type: 'string', required: false },
        city: { type: 'string', required: true },
        state: { type: 'string', required: true },
        postalCode: { type: 'string', required: true },
        country: { type: 'string', required: true }
      }
    },

    // Billing address (if different)
    billingAddress: {
      type: 'object',
      required: false,
      properties: {
        street: { type: 'string' },
        street2: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' }
      }
    },

    // Account details
    accountType: {
      type: 'string',
      required: false,
      enum: ['standard', 'premium', 'enterprise'],
      default: 'standard'
    },
    requestedCreditLimit: { type: 'number', required: false, min: 0 },
    approvedCreditLimit: { type: 'number', required: false, min: 0 },
    paymentTerms: {
      type: 'string',
      required: false,
      enum: ['net_15', 'net_30', 'net_60', 'net_90', 'immediate', 'prepaid'],
      default: 'net_30'
    },

    // Verification details
    verificationStatus: {
      type: 'string',
      required: false,
      enum: ['pending', 'verified', 'failed']
    },
    verificationNotes: { type: 'string', required: false },
    verifiedBy: { type: 'string', required: false },
    verifiedAt: { type: 'date', required: false },

    // Credit check
    creditCheckStatus: {
      type: 'string',
      required: false,
      enum: ['pending', 'approved', 'declined', 'manual_review']
    },
    creditScore: { type: 'number', required: false, min: 0, max: 850 },
    creditCheckProvider: { type: 'string', required: false },
    creditCheckNotes: { type: 'string', required: false },
    creditCheckedAt: { type: 'date', required: false },

    // Account setup
    accountNumber: { type: 'string', required: false },
    customerId: { type: 'string', required: false },
    salesRepId: { type: 'string', required: false },
    salesRepName: { type: 'string', required: false },
    accountManagerId: { type: 'string', required: false },
    accountManagerName: { type: 'string', required: false },

    // Banking information
    bankingDetails: {
      type: 'object',
      required: false,
      properties: {
        bankName: { type: 'string' },
        accountNumber: { type: 'string' },
        routingNumber: { type: 'string' },
        accountType: { type: 'string', enum: ['checking', 'savings'] }
      }
    },

    // References
    businessReferences: {
      type: 'array',
      required: false,
      items: {
        type: 'object',
        properties: {
          companyName: { type: 'string' },
          contactName: { type: 'string' },
          contactEmail: { type: 'string' },
          contactPhone: { type: 'string' },
          relationship: { type: 'string' }
        }
      }
    },

    // Approval workflow
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Account setup details
    setupCompletedBy: { type: 'string', required: false },
    portalAccessEnabled: { type: 'boolean', required: false, default: false },
    welcomeEmailSent: { type: 'boolean', required: false, default: false },

    // Documents
    documents: { type: 'array', required: false, default: [] },

    // Additional information
    notes: { type: 'string', required: false },
    source: {
      type: 'string',
      required: false,
      enum: ['website', 'referral', 'sales_team', 'partner', 'trade_show', 'other']
    },
    expectedMonthlyVolume: { type: 'number', required: false, min: 0 }
  },

  // State definitions
  states: {
    // Application - Customer application submitted
    application: {
      name: 'Application',
      description: 'Customer application submitted',
      transitions: ['verification', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Customer onboarding application for ${processInstance.variables.customerName}`);

        processInstance.variables.applicationDate = new Date().toISOString();

        // Generate temporary application ID if needed
        if (!processInstance.variables.applicationId) {
          const timestamp = Date.now();
          processInstance.variables.applicationId = `APP-${timestamp}`;
        }

        // TODO: Send acknowledgment email to customer
        // await notificationService.send({
        //   to: processInstance.variables.primaryContactEmail,
        //   type: 'onboarding_application_received',
        //   customerName: processInstance.variables.customerName
        // });

        // TODO: Notify onboarding team
        // await notificationService.send({
        //   to: 'onboarding_team',
        //   type: 'new_customer_application',
        //   customerName: processInstance.variables.customerName,
        //   businessType: processInstance.variables.businessType
        // });
      },

      // Auto-transition to verification
      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'verification'
          }
        ]
      }
    },

    // Verification - Verifying customer information
    verification: {
      name: 'Verification',
      description: 'Customer information is being verified',
      transitions: ['credit_check', 'rejected', 'application'],

      onEnter: async (processInstance, context) => {
        console.log(`Verifying customer information for ${processInstance.variables.customerName}`);

        processInstance.variables.verificationStatus = 'pending';

        // TODO: Integrate with verification services
        // - Verify tax ID / business registration
        // - Check business address
        // - Validate contact information
        // - Review business references
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Verify customer information and documents',
          actionLabel: 'Complete Verification',
          metadata: {
            requiresDocuments: true,
            checklist: [
              'Business registration verified',
              'Tax ID validated',
              'Contact information confirmed',
              'Required documents received'
            ]
          }
        }
      ],

      // Auto-reject after 14 days if no action
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

    // Credit Check - Running credit assessment
    credit_check: {
      name: 'Credit Check',
      description: 'Credit assessment in progress',
      transitions: ['approved', 'rejected', 'verification'],

      onEnter: async (processInstance, context) => {
        console.log(`Running credit check for ${processInstance.variables.customerName}`);

        // Record verification completion
        if (context.verifiedBy) {
          processInstance.variables.verifiedBy = context.verifiedBy;
        }
        processInstance.variables.verificationStatus = 'verified';
        processInstance.variables.verifiedAt = new Date().toISOString();

        processInstance.variables.creditCheckStatus = 'pending';

        // TODO: Integrate with credit check service
        // const creditResult = await creditService.check({
        //   businessName: processInstance.variables.legalBusinessName || processInstance.variables.customerName,
        //   taxId: processInstance.variables.taxId,
        //   address: processInstance.variables.businessAddress
        // });
        //
        // processInstance.variables.creditScore = creditResult.score;
        // processInstance.variables.creditCheckProvider = creditResult.provider;
        // processInstance.variables.creditCheckStatus = creditResult.status;
        // processInstance.variables.creditCheckedAt = new Date().toISOString();

        // For businesses, credit check might be auto-approved for certain types
        if (processInstance.variables.businessType === 'government') {
          processInstance.variables.creditCheckStatus = 'approved';
          processInstance.variables.creditCheckNotes = 'Government entity - auto-approved';
        }
      },

      // Auto-transition based on credit check
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
            rejectLabel: 'Decline',
            requiresCreditReview: true
          }
        }
      ]
    },

    // Approved - Customer approved
    approved: {
      name: 'Approved',
      description: 'Customer has been approved',
      transitions: ['account_setup'],

      onEnter: async (processInstance, context) => {
        console.log(`Customer ${processInstance.variables.customerName} approved`);

        // Record approver
        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }

        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }

        // Set approved credit limit
        if (context.approvedCreditLimit) {
          processInstance.variables.approvedCreditLimit = context.approvedCreditLimit;
        } else if (processInstance.variables.requestedCreditLimit) {
          // Default to requested limit if not specified
          processInstance.variables.approvedCreditLimit = processInstance.variables.requestedCreditLimit;
        }

        processInstance.variables.approvedAt = new Date().toISOString();

        // TODO: Send approval notification to customer
        // await notificationService.send({
        //   to: processInstance.variables.primaryContactEmail,
        //   type: 'customer_approved',
        //   customerName: processInstance.variables.customerName,
        //   creditLimit: processInstance.variables.approvedCreditLimit
        // });
      },

      // Auto-transition to account setup
      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'account_setup'
          }
        ]
      }
    },

    // Account Setup - Setting up customer account
    account_setup: {
      name: 'Account Setup',
      description: 'Customer account is being set up',
      transitions: ['active'],

      onEnter: async (processInstance, context) => {
        console.log(`Setting up account for ${processInstance.variables.customerName}`);

        // Generate customer ID and account number
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);

        if (!processInstance.variables.customerId) {
          processInstance.variables.customerId = `CUST-${timestamp}-${random}`;
        }

        if (!processInstance.variables.accountNumber) {
          processInstance.variables.accountNumber = `ACC-${timestamp}-${random}`;
        }

        // TODO: Create customer record in CRM
        // await crmService.createCustomer({
        //   customerId: processInstance.variables.customerId,
        //   name: processInstance.variables.customerName,
        //   ...processInstance.variables
        // });

        // TODO: Create account in billing system
        // await billingService.createAccount({
        //   accountNumber: processInstance.variables.accountNumber,
        //   customerId: processInstance.variables.customerId,
        //   creditLimit: processInstance.variables.approvedCreditLimit,
        //   paymentTerms: processInstance.variables.paymentTerms
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Complete account setup and enable portal access',
          actionLabel: 'Complete Setup',
          metadata: {
            checklist: [
              'Customer record created in CRM',
              'Account created in billing system',
              'Portal access enabled',
              'Welcome email sent',
              'Account manager assigned'
            ]
          }
        }
      ]
    },

    // Active - Customer account active (terminal state)
    active: {
      name: 'Active',
      description: 'Customer account is active',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Customer ${processInstance.variables.customerName} is now active`);

        // Record setup completion
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
          const durationMs = activeDate.getTime() - appDate.getTime();
          processInstance.variables.onboardingDuration = durationMs;
        }

        // TODO: Send welcome email with login credentials
        // await notificationService.send({
        //   to: processInstance.variables.primaryContactEmail,
        //   type: 'customer_welcome',
        //   customerName: processInstance.variables.customerName,
        //   accountNumber: processInstance.variables.accountNumber,
        //   customerId: processInstance.variables.customerId,
        //   accountManager: processInstance.variables.accountManagerName
        // });

        // TODO: Notify sales rep
        // if (processInstance.variables.salesRepId) {
        //   await notificationService.send({
        //     to: processInstance.variables.salesRepId,
        //     type: 'customer_activated',
        //     customerName: processInstance.variables.customerName,
        //     customerId: processInstance.variables.customerId
        //   });
        // }

        // TODO: Create initial sales order or quote if needed
      }
    },

    // Rejected - Application rejected (terminal state)
    rejected: {
      name: 'Rejected',
      description: 'Customer application has been rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Customer application rejected for ${processInstance.variables.customerName}`);

        // Record rejection reason
        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }

        processInstance.variables.rejectedAt = new Date().toISOString();

        // TODO: Send rejection notification with reason (if appropriate)
        // await notificationService.send({
        //   to: processInstance.variables.primaryContactEmail,
        //   type: 'customer_application_rejected',
        //   customerName: processInstance.variables.customerName,
        //   reason: processInstance.variables.rejectionReason
        // });

        // TODO: Notify sales rep
        // if (processInstance.variables.salesRepId) {
        //   await notificationService.send({
        //     to: processInstance.variables.salesRepId,
        //     type: 'customer_application_rejected',
        //     customerName: processInstance.variables.customerName,
        //     reason: processInstance.variables.rejectionReason
        //   });
        // }
      }
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.CUSTOMER,
    tags: ['customer', 'onboarding', 'verification', 'credit_check', 'account_setup'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'sales_rep', 'manager', 'admin', 'owner'],
      transition: {
        application_to_verification: ['system'], // Auto-transition
        verification_to_credit_check: ['member', 'admin', 'owner'],
        verification_to_application: ['member', 'admin', 'owner'],
        credit_check_to_approved: ['manager', 'admin', 'owner'],
        credit_check_to_verification: ['member', 'admin', 'owner'],
        approved_to_account_setup: ['system'], // Auto-transition
        account_setup_to_active: ['member', 'admin', 'owner'],
        any_to_rejected: ['manager', 'admin', 'owner']
      }
    },
    icon: 'person-add',
    color: '#8b5cf6' // purple
  }
};

export default customerOnboardingDefinition;
