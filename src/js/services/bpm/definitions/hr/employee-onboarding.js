/**
 * Employee Onboarding Process Definition
 * New employee onboarding and setup workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Employee Onboarding Process
 *
 * State Flow:
 * initiated → background_check → equipment_assigned → training_scheduled → training_complete → active | terminated
 */
export const employeeOnboardingDefinition = {
  id: 'employee_onboarding_v1',
  name: 'Employee Onboarding',
  description: 'New employee onboarding and setup workflow',
  type: PROCESS_TYPES.HR_ONBOARDING,
  version: '1.0.0',
  initialState: 'initiated',

  variables: {
    // Employee details
    employeeId: { type: 'string', required: false },
    firstName: { type: 'string', required: true },
    lastName: { type: 'string', required: true },
    email: { type: 'string', required: true },
    phone: { type: 'string', required: false },
    startDate: { type: 'date', required: true },

    // Position details
    jobTitle: { type: 'string', required: true },
    department: { type: 'string', required: true },
    managerId: { type: 'string', required: false },
    managerName: { type: 'string', required: false },
    location: { type: 'string', required: false },
    employmentType: {
      type: 'string',
      required: false,
      enum: ['full_time', 'part_time', 'contract', 'intern'],
      default: 'full_time'
    },

    // Compensation
    salary: { type: 'number', required: false, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },

    // Background check
    backgroundCheckStatus: {
      type: 'string',
      required: false,
      enum: ['pending', 'in_progress', 'passed', 'failed']
    },
    backgroundCheckProvider: { type: 'string', required: false },
    backgroundCheckCompletedAt: { type: 'date', required: false },

    // Equipment
    equipmentNeeded: { type: 'array', required: false, default: [] },
    equipmentAssigned: { type: 'boolean', required: false, default: false },
    equipmentList: { type: 'array', required: false, default: [] },

    // IT Setup
    emailAccountCreated: { type: 'boolean', required: false, default: false },
    systemAccessGranted: { type: 'boolean', required: false, default: false },
    accessRoles: { type: 'array', required: false, default: [] },

    // Training
    trainingScheduled: { type: 'boolean', required: false, default: false },
    trainingStartDate: { type: 'date', required: false },
    trainingCompleted: { type: 'boolean', required: false, default: false },
    trainingModules: { type: 'array', required: false, default: [] },

    // Onboarding checklist
    documentsSigned: { type: 'boolean', required: false, default: false },
    benefitsEnrolled: { type: 'boolean', required: false, default: false },
    workspaceSetup: { type: 'boolean', required: false, default: false },
    teamIntroduced: { type: 'boolean', required: false, default: false },

    // Documents
    documents: { type: 'array', required: false, default: [] },

    // Linked from job application
    jobApplicationId: { type: 'string', required: false },

    // Notes
    notes: { type: 'string', required: false }
  },

  states: {
    // Initiated - Onboarding started
    initiated: {
      name: 'Initiated',
      description: 'Employee onboarding initiated',
      transitions: ['background_check'],

      onEnter: async (processInstance, context) => {
        console.log(`Onboarding initiated for ${processInstance.variables.firstName} ${processInstance.variables.lastName}`);

        processInstance.variables.initiatedAt = new Date().toISOString();

        // Generate employee ID if not provided
        if (!processInstance.variables.employeeId) {
          const timestamp = Date.now();
          processInstance.variables.employeeId = `EMP-${timestamp}`;
        }

        // TODO: Send welcome email
        // TODO: Create employee record in HRIS
      },

      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'background_check'
          }
        ]
      }
    },

    // Background Check - Running background check
    background_check: {
      name: 'Background Check',
      description: 'Background check in progress',
      transitions: ['equipment_assigned', 'terminated'],

      onEnter: async (processInstance, context) => {
        console.log(`Running background check for ${processInstance.variables.firstName} ${processInstance.variables.lastName}`);

        processInstance.variables.backgroundCheckStatus = 'in_progress';

        // TODO: Initiate background check with provider
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.ADMIN,
          message: 'Complete background check verification',
          actionLabel: 'Mark Background Check Complete'
        }
      ],

      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 14 * 24 * 60 * 60 * 1000, // 14 days
            toState: 'terminated',
            reason: 'Background check not completed within 14 days'
          }
        ]
      }
    },

    // Equipment Assigned - IT equipment provided
    equipment_assigned: {
      name: 'Equipment Assigned',
      description: 'Equipment has been assigned',
      transitions: ['training_scheduled'],

      onEnter: async (processInstance, context) => {
        console.log(`Assigning equipment for ${processInstance.variables.firstName} ${processInstance.variables.lastName}`);

        if (context.backgroundCheckStatus === 'passed') {
          processInstance.variables.backgroundCheckStatus = 'passed';
          processInstance.variables.backgroundCheckCompletedAt = new Date().toISOString();
        }

        // TODO: Create IT tickets for equipment
        // TODO: Create email account
        // TODO: Grant system access
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Assign equipment and setup accounts',
          actionLabel: 'Mark Equipment Assigned'
        }
      ]
    },

    // Training Scheduled - Training arranged
    training_scheduled: {
      name: 'Training Scheduled',
      description: 'Training has been scheduled',
      transitions: ['training_complete'],

      onEnter: async (processInstance, context) => {
        console.log(`Scheduling training for ${processInstance.variables.firstName} ${processInstance.variables.lastName}`);

        processInstance.variables.trainingScheduled = true;

        if (context.equipmentAssigned) {
          processInstance.variables.equipmentAssigned = true;
        }

        // TODO: Schedule training sessions
        // TODO: Send training calendar invites
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Complete employee training',
          actionLabel: 'Mark Training Complete'
        }
      ]
    },

    // Training Complete - Training finished
    training_complete: {
      name: 'Training Complete',
      description: 'Employee training completed',
      transitions: ['active'],

      onEnter: async (processInstance, context) => {
        console.log(`Training completed for ${processInstance.variables.firstName} ${processInstance.variables.lastName}`);

        processInstance.variables.trainingCompleted = true;
        processInstance.variables.trainingCompletedAt = new Date().toISOString();

        // TODO: Send completion notification
      },

      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'active'
          }
        ]
      }
    },

    // Active - Employee active (terminal state)
    active: {
      name: 'Active',
      description: 'Employee is active',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`${processInstance.variables.firstName} ${processInstance.variables.lastName} is now active`);

        processInstance.variables.activeAt = new Date().toISOString();
        processInstance.variables.onboardingCompletedAt = new Date().toISOString();

        // Calculate onboarding duration
        if (processInstance.variables.initiatedAt && processInstance.variables.onboardingCompletedAt) {
          const start = new Date(processInstance.variables.initiatedAt);
          const end = new Date(processInstance.variables.onboardingCompletedAt);
          processInstance.variables.onboardingDuration = end.getTime() - start.getTime();
        }

        // TODO: Send congratulations email
        // TODO: Update HRIS status to active
      }
    },

    // Terminated - Onboarding terminated (terminal state)
    terminated: {
      name: 'Terminated',
      description: 'Onboarding terminated',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Onboarding terminated for ${processInstance.variables.firstName} ${processInstance.variables.lastName}`);

        processInstance.variables.terminatedAt = new Date().toISOString();
        processInstance.variables.terminationReason = context.reason || 'Background check failed';

        // TODO: Revoke access if granted
        // TODO: Retrieve equipment if assigned
        // TODO: Send termination notification
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.HR,
    tags: ['onboarding', 'employee', 'hr', 'hiring'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'manager', 'hr', 'admin', 'owner'],
      transition: {
        initiated_to_background_check: ['system'],
        background_check_to_equipment_assigned: ['hr', 'admin', 'owner'],
        background_check_to_terminated: ['hr', 'admin', 'owner'],
        equipment_assigned_to_training_scheduled: ['member', 'admin', 'owner'],
        training_scheduled_to_training_complete: ['manager', 'admin', 'owner'],
        training_complete_to_active: ['system']
      }
    },
    icon: 'person-add-outline',
    color: '#06b6d4' // cyan
  }
};

export default employeeOnboardingDefinition;
