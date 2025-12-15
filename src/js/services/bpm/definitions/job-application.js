/**
 * Job Application Process Definition
 * Workflow for managing job applications from submission to hiring decision
 */

import { PROCESS_TYPES } from '../../../config/constants.js';

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
    applicationId: { type: 'string', required: true },
    applicantId: { type: 'string', required: true },
    applicantName: { type: 'string', required: true },
    applicantEmail: { type: 'string', required: true },
    jobId: { type: 'string', required: true },
    jobTitle: { type: 'string', required: true },
    resume: { type: 'object', required: false },
    coverLetter: { type: 'string', required: false },
    interviewDate: { type: 'string', required: false },
    interviewNotes: { type: 'string', required: false },
    offerAmount: { type: 'number', required: false },
    rejectionReason: { type: 'string', required: false }
  },

  // State definitions
  states: {
    // Application submitted
    submitted: {
      name: 'Application Submitted',
      description: 'Application has been received',
      transitions: ['screening', 'rejected'],

      onEnter: async (processInstance, context) => {
        console.log(`Job application ${processInstance.variables.applicationId} submitted`);

        // TODO: Send confirmation email to applicant
        // await emailService.send({
        //   to: processInstance.variables.applicantEmail,
        //   template: 'application_received',
        //   data: { ...processInstance.variables }
        // });
      },

      requiredActions: [
        {
          type: 'review',
          role: 'admin',
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
          role: 'admin',
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
        console.log(`Interview scheduled for ${processInstance.variables.applicantName}`);

        if (context.interviewDate) {
          processInstance.variables.interviewDate = context.interviewDate;
        }

        // TODO: Send interview invitation email
        // await emailService.send({
        //   to: processInstance.variables.applicantEmail,
        //   template: 'interview_scheduled',
        //   data: {
        //     applicantName: processInstance.variables.applicantName,
        //     interviewDate: processInstance.variables.interviewDate,
        //     jobTitle: processInstance.variables.jobTitle
        //   }
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: 'admin',
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
        console.log(`Interview completed for ${processInstance.variables.applicantName}`);

        if (context.interviewNotes) {
          processInstance.variables.interviewNotes = context.interviewNotes;
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
        console.log(`Hiring decision pending for ${processInstance.variables.applicantName}`);
      },

      requiredActions: [
        {
          type: 'approval',
          role: 'owner',
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
        console.log(`Offer made to ${processInstance.variables.applicantName}`);

        if (context.offerAmount) {
          processInstance.variables.offerAmount = context.offerAmount;
        }

        // TODO: Send offer email
        // await emailService.send({
        //   to: processInstance.variables.applicantEmail,
        //   template: 'job_offer',
        //   data: {
        //     applicantName: processInstance.variables.applicantName,
        //     jobTitle: processInstance.variables.jobTitle,
        //     offerAmount: processInstance.variables.offerAmount
        //   }
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: 'admin',
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
        console.log(`${processInstance.variables.applicantName} accepted the offer!`);

        processInstance.variables.acceptedAt = new Date().toISOString();

        // TODO: Send welcome email and start onboarding
        // await emailService.send({
        //   to: processInstance.variables.applicantEmail,
        //   template: 'offer_accepted_confirmation',
        //   data: { ...processInstance.variables }
        // });

        // TODO: Trigger onboarding process
        // await processService.createProcess({
        //   definitionId: 'employee_onboarding_v1',
        //   type: 'onboarding',
        //   variables: {
        //     employeeId: processInstance.variables.applicantId,
        //     employeeName: processInstance.variables.applicantName,
        //     jobTitle: processInstance.variables.jobTitle,
        //     startDate: context.startDate
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
        console.log(`${processInstance.variables.applicantName} declined the offer`);

        processInstance.variables.declinedAt = new Date().toISOString();
        processInstance.variables.declineReason = context.reason || 'Not specified';

        // TODO: Send acknowledgment email
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
        processInstance.variables.rejectionReason = context.reason || 'Not specified';

        // TODO: Send rejection email
        // await emailService.send({
        //   to: processInstance.variables.applicantEmail,
        //   template: 'application_rejected',
        //   data: {
        //     applicantName: processInstance.variables.applicantName,
        //     jobTitle: processInstance.variables.jobTitle
        //   }
        // });
      }
    }
  },

  // Metadata
  metadata: {
    category: 'hr',
    tags: ['hiring', 'recruitment', 'job-application'],
    permissions: {
      create: ['authenticated'],
      view: ['applicant', 'admin', 'owner'],
      transition: {
        submitted_to_screening: ['admin', 'owner'],
        screening_to_interview: ['admin', 'owner'],
        interview_to_decision: ['admin', 'owner'],
        decision_to_offer: ['owner'],
        offer_to_accepted: ['applicant', 'admin', 'owner'],
        any_to_rejected: ['admin', 'owner']
      }
    }
  }
};

export default jobApplicationDefinition;
