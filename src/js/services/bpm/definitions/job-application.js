/**
 * Job Application Process Definition
 * Workflow for managing job applications from submission to hiring decision
 *
 * Field Principles:
 * - Auto-generated IDs are system fields (not shown in forms)
 * - User references use userLookup with verify button
 * - Entity references use entityLookup with search
 * - Redundant fields derived from lookups are removed
 * - Fields are assigned to specific steps/states
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../config/constants.js';

/**
 * Job Application Process
 *
 * State Flow:
 * submitted → screening → interview_scheduled → interviewed →
 *           → decision_pending → offer_made → accepted/rejected
 *        ↘ rejected ↙
 */
export const jobApplicationDefinition = {
  id: 'job_application_v1',
  name: 'Job Application Workflow',
  description: 'Manages the complete job application process',
  type: PROCESS_TYPES.JOB_APPLICATION,
  version: '1.0.0',
  initialState: 'submitted',

  // Process variables schema
  variables: {
    // === SYSTEM FIELDS (auto-generated, not shown in forms) ===
    applicationId: {
      type: 'string',
      required: false,
      step: 'system',
      description: 'Auto-generated application ID'
    },

    // === CREATE STEP FIELDS (when starting the process) ===

    // Applicant - User lookup with verification
    applicantId: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'userLookup',
      lookup: {
        service: 'users',
        searchFields: ['email', 'username', 'phone'],
        displayFields: ['name', 'email'],
        placeholder: 'Enter applicant email or phone to verify'
      },
      description: 'Verified applicant user ID'
    },

    // Job Position - Entity lookup
    jobId: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'jobPositions',
        searchFields: ['title', 'department', 'team'],
        displayTemplate: '{title} - {department}',
        placeholder: 'Search for job position'
      },
      description: 'Job position being applied for'
    },

    // Resume/CV upload
    resume: {
      type: 'object',
      required: false,
      step: 'create',
      description: 'Uploaded resume/CV document'
    },

    // Cover letter
    coverLetter: {
      type: 'string',
      required: false,
      step: 'create',
      multiline: true,
      rows: 5,
      placeholder: 'Optional cover letter or additional information'
    },

    // === SCREENING STEP FIELDS ===
    screeningNotes: {
      type: 'string',
      required: false,
      step: 'screening',
      multiline: true,
      rows: 3,
      placeholder: 'Notes from initial screening'
    },

    meetsRequirements: {
      type: 'boolean',
      required: false,
      step: 'screening',
      default: false,
      toggleLabel: 'Meets basic requirements'
    },

    // === INTERVIEW_SCHEDULED STEP FIELDS ===
    interviewDate: {
      type: 'date',
      required: false,
      step: 'interview_scheduled',
      description: 'Scheduled interview date and time'
    },

    interviewType: {
      type: 'string',
      required: false,
      step: 'interview_scheduled',
      foreignKey: {
        options: [
          { value: 'phone', label: 'Phone Screen' },
          { value: 'video', label: 'Video Call' },
          { value: 'onsite', label: 'On-site Interview' },
          { value: 'panel', label: 'Panel Interview' }
        ]
      }
    },

    // Interviewer assignment - User lookup
    interviewerId: {
      type: 'string',
      required: false,
      step: 'interview_scheduled',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name'],
        displayFields: ['name', 'department'],
        placeholder: 'Search for interviewer'
      }
    },

    interviewLocation: {
      type: 'string',
      required: false,
      step: 'interview_scheduled',
      placeholder: 'Interview location or meeting link'
    },

    // === INTERVIEWED STEP FIELDS ===
    interviewNotes: {
      type: 'string',
      required: false,
      step: 'interviewed',
      multiline: true,
      rows: 4,
      placeholder: 'Interview feedback and observations'
    },

    interviewRating: {
      type: 'string',
      required: false,
      step: 'interviewed',
      foreignKey: {
        options: [
          { value: 'excellent', label: 'Excellent - Strong Hire' },
          { value: 'good', label: 'Good - Hire' },
          { value: 'average', label: 'Average - Maybe' },
          { value: 'poor', label: 'Poor - No Hire' }
        ]
      }
    },

    technicalScore: {
      type: 'number',
      required: false,
      step: 'interviewed',
      min: 1,
      max: 10,
      placeholder: 'Technical skills score (1-10)'
    },

    cultureFitScore: {
      type: 'number',
      required: false,
      step: 'interviewed',
      min: 1,
      max: 10,
      placeholder: 'Culture fit score (1-10)'
    },

    // === DECISION_PENDING STEP FIELDS ===
    decisionNotes: {
      type: 'string',
      required: false,
      step: 'decision_pending',
      multiline: true,
      rows: 3,
      placeholder: 'Notes for hiring decision'
    },

    // === OFFER_MADE STEP FIELDS ===
    offerAmount: {
      type: 'number',
      required: false,
      step: 'offer_made',
      min: 0,
      placeholder: 'Annual salary offer'
    },

    offerCurrency: {
      type: 'string',
      required: false,
      step: 'offer_made',
      default: 'USD',
      foreignKey: {
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
      }
    },

    startDateProposed: {
      type: 'date',
      required: false,
      step: 'offer_made',
      description: 'Proposed start date'
    },

    offerDetails: {
      type: 'string',
      required: false,
      step: 'offer_made',
      multiline: true,
      rows: 3,
      placeholder: 'Additional offer details (benefits, bonuses, etc.)'
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

    // === INTERNAL SYSTEM FIELDS ===
    // These are set by the system during state transitions
    submittedAt: { type: 'date', required: false, step: 'system' },
    screenedAt: { type: 'date', required: false, step: 'system' },
    interviewedAt: { type: 'date', required: false, step: 'system' },
    decisionMadeAt: { type: 'date', required: false, step: 'system' },
    offerSentAt: { type: 'date', required: false, step: 'system' },
    acceptedAt: { type: 'date', required: false, step: 'system' },
    rejectedAt: { type: 'date', required: false, step: 'system' }
  },

  // State definitions
  states: {
    // Application submitted
    submitted: {
      name: 'Application Submitted',
      description: 'Application has been received',
      transitions: ['screening', 'rejected'],

      onEnter: async (processInstance, context) => {
        // Generate application ID
        if (!processInstance.variables.applicationId) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          processInstance.variables.applicationId = `APP-${timestamp}-${random}`;
        }

        processInstance.variables.submittedAt = new Date().toISOString();

        console.log(`Job application ${processInstance.variables.applicationId} submitted`);

        // TODO: Send confirmation email to applicant
        // const applicant = await userService.getById(processInstance.variables.applicantId);
        // await emailService.send({
        //   to: applicant.email,
        //   template: 'application_received',
        //   data: { applicationId: processInstance.variables.applicationId }
        // });
      },

      requiredActions: [
        {
          type: 'review',
          role: APPROVAL_LEVELS.ADMIN,
          message: 'Review application for initial screening',
          actionLabel: 'Start Screening'
        }
      ]
    },

    // Initial screening
    screening: {
      name: 'Screening',
      description: 'Initial review of application',
      transitions: ['interview_scheduled', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Screening application ${processInstance.variables.applicationId}`);
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.ADMIN,
          message: 'Does this applicant meet the basic requirements?',
          actionLabel: 'Screen Application',
          metadata: {
            approveLabel: 'Schedule Interview',
            rejectLabel: 'Reject Application'
          }
        }
      ]
    },

    // Interview scheduled
    interview_scheduled: {
      name: 'Interview Scheduled',
      description: 'Interview has been scheduled with the applicant',
      transitions: ['interviewed', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Interview scheduled for application ${processInstance.variables.applicationId}`);

        processInstance.variables.screenedAt = new Date().toISOString();

        // Copy context values to variables
        if (context.interviewDate) {
          processInstance.variables.interviewDate = context.interviewDate;
        }
        if (context.interviewType) {
          processInstance.variables.interviewType = context.interviewType;
        }
        if (context.interviewerId) {
          processInstance.variables.interviewerId = context.interviewerId;
        }

        // TODO: Send interview invitation email
        // const applicant = await userService.getById(processInstance.variables.applicantId);
        // await emailService.send({
        //   to: applicant.email,
        //   template: 'interview_scheduled',
        //   data: {
        //     interviewDate: processInstance.variables.interviewDate,
        //     interviewType: processInstance.variables.interviewType
        //   }
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.ADMIN,
          message: 'Conduct interview and mark as completed',
          actionLabel: 'Complete Interview'
        }
      ]
    },

    // Interview completed
    interviewed: {
      name: 'Interview Completed',
      description: 'Applicant has been interviewed',
      transitions: ['decision_pending'],

      onEnter: async (processInstance, context) => {
        console.log(`Interview completed for application ${processInstance.variables.applicationId}`);

        processInstance.variables.interviewedAt = new Date().toISOString();

        // Copy interview feedback from context
        if (context.interviewNotes) {
          processInstance.variables.interviewNotes = context.interviewNotes;
        }
        if (context.interviewRating) {
          processInstance.variables.interviewRating = context.interviewRating;
        }
        if (context.technicalScore) {
          processInstance.variables.technicalScore = context.technicalScore;
        }
        if (context.cultureFitScore) {
          processInstance.variables.cultureFitScore = context.cultureFitScore;
        }
      },

      // Auto-transition to decision pending
      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'decision_pending'
          }
        ]
      }
    },

    // Pending hiring decision
    decision_pending: {
      name: 'Decision Pending',
      description: 'Waiting for hiring decision',
      transitions: ['offer_made', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Hiring decision pending for application ${processInstance.variables.applicationId}`);
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.OWNER,
          message: 'Make final hiring decision',
          actionLabel: 'Make Decision',
          metadata: {
            approveLabel: 'Make Offer',
            rejectLabel: 'Reject Application'
          }
        }
      ],

      // Auto-reject after 30 days if no decision
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 30 * 24 * 60 * 60 * 1000, // 30 days
            toState: 'rejected',
            reason: 'No decision made within 30 days'
          }
        ]
      }
    },

    // Offer made to candidate
    offer_made: {
      name: 'Offer Made',
      description: 'Job offer has been extended to applicant',
      transitions: ['accepted', 'offer_declined'],

      onEnter: async (processInstance, context) => {
        console.log(`Offer made for application ${processInstance.variables.applicationId}`);

        processInstance.variables.decisionMadeAt = new Date().toISOString();
        processInstance.variables.offerSentAt = new Date().toISOString();

        // Copy offer details from context
        if (context.offerAmount) {
          processInstance.variables.offerAmount = context.offerAmount;
        }
        if (context.offerCurrency) {
          processInstance.variables.offerCurrency = context.offerCurrency;
        }
        if (context.startDateProposed) {
          processInstance.variables.startDateProposed = context.startDateProposed;
        }

        // TODO: Send offer email
        // const applicant = await userService.getById(processInstance.variables.applicantId);
        // await emailService.send({
        //   to: applicant.email,
        //   template: 'job_offer',
        //   data: {
        //     offerAmount: processInstance.variables.offerAmount,
        //     startDateProposed: processInstance.variables.startDateProposed
        //   }
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.ADMIN,
          message: 'Waiting for applicant response to offer',
          actionLabel: 'Update Offer Status'
        }
      ],

      // Auto-expire offer after 7 days
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'offer_declined',
            reason: 'Offer expired - no response within 7 days'
          }
        ]
      }
    },

    // Terminal state: Offer accepted
    accepted: {
      name: 'Offer Accepted',
      description: 'Applicant accepted the job offer',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Offer accepted for application ${processInstance.variables.applicationId}`);

        processInstance.variables.acceptedAt = new Date().toISOString();

        // TODO: Send welcome email and start onboarding
        // TODO: Trigger onboarding process
        // await processService.createProcess({
        //   definitionId: 'employee_onboarding_v1',
        //   variables: {
        //     userId: processInstance.variables.applicantId,
        //     jobId: processInstance.variables.jobId,
        //     startDate: processInstance.variables.startDateProposed
        //   }
        // });
      }
    },

    // Terminal state: Offer declined
    offer_declined: {
      name: 'Offer Declined',
      description: 'Applicant declined the job offer',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Offer declined for application ${processInstance.variables.applicationId}`);

        processInstance.variables.rejectedAt = new Date().toISOString();
        processInstance.variables.rejectionReason = context.reason || 'Offer declined or expired';
      }
    },

    // Terminal state: Application rejected
    rejected: {
      name: 'Application Rejected',
      description: 'Application was rejected',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Application ${processInstance.variables.applicationId} rejected`);

        processInstance.variables.rejectedAt = new Date().toISOString();
        processInstance.variables.rejectionReason = context.reason || context.rejectionReason || 'Not specified';

        // TODO: Send rejection email
        // const applicant = await userService.getById(processInstance.variables.applicantId);
        // await emailService.send({
        //   to: applicant.email,
        //   template: 'application_rejected',
        //   data: { applicationId: processInstance.variables.applicationId }
        // });
      }
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.HR,
    tags: ['hiring', 'recruitment', 'job-application'],
    permissions: {
      create: ['authenticated'],
      view: ['applicant', 'admin', 'owner'],
      transition: {
        submitted_to_screening: ['admin', 'owner'],
        screening_to_interview_scheduled: ['admin', 'owner'],
        screening_to_rejected: ['admin', 'owner'],
        interview_scheduled_to_interviewed: ['admin', 'owner'],
        interview_scheduled_to_rejected: ['admin', 'owner'],
        interviewed_to_decision_pending: ['system'],
        decision_pending_to_offer_made: ['owner'],
        decision_pending_to_rejected: ['owner'],
        offer_made_to_accepted: ['applicant', 'admin', 'owner'],
        offer_made_to_offer_declined: ['applicant', 'admin', 'owner'],
        any_to_rejected: ['admin', 'owner']
      }
    },
    icon: 'briefcase-outline',
    color: '#3b82f6' // blue
  }
};

export default jobApplicationDefinition;
