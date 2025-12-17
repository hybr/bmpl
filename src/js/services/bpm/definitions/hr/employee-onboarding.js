/**
 * Employee Onboarding Process Definition
 * New employee onboarding and setup workflow
 *
 * Field Principles:
 * - Auto-generated IDs are system fields (not shown in forms)
 * - User references use userLookup with verify button
 * - Entity references use entityLookup with search
 * - Fields are assigned to specific steps/states
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
    // === SYSTEM FIELDS (auto-generated) ===
    employeeId: {
      type: 'string',
      required: false,
      step: 'system',
      description: 'Auto-generated employee ID'
    },

    // === CREATE STEP FIELDS ===

    // New employee - User lookup (existing user becoming employee)
    userId: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'userLookup',
      lookup: {
        service: 'users',
        searchFields: ['email', 'name', 'phone'],
        displayFields: ['name', 'email'],
        placeholder: 'Search for new employee by email'
      },
      description: 'User being onboarded as employee'
    },

    // Start date
    startDate: {
      type: 'date',
      required: true,
      step: 'create',
      description: 'Employment start date'
    },

    // Job position - Entity lookup
    jobPositionId: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'jobPositions',
        searchFields: ['title', 'department'],
        displayTemplate: '{title} - {department}',
        placeholder: 'Search for job position'
      },
      description: 'Job position for the employee'
    },

    // Department - Entity lookup
    departmentId: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'departments',
        searchFields: ['name', 'code'],
        displayTemplate: '{name}',
        placeholder: 'Select department'
      }
    },

    // Manager - User lookup
    managerId: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name'],
        displayFields: ['name', 'department'],
        placeholder: 'Search for manager'
      },
      description: 'Direct manager'
    },

    // Location
    location: {
      type: 'string',
      required: false,
      step: 'create',
      foreignKey: {
        options: [
          { value: 'headquarters', label: 'Headquarters' },
          { value: 'branch_north', label: 'North Branch' },
          { value: 'branch_south', label: 'South Branch' },
          { value: 'remote', label: 'Remote' }
        ]
      }
    },

    // Employment type
    employmentType: {
      type: 'string',
      required: false,
      step: 'create',
      default: 'full_time',
      foreignKey: {
        options: [
          { value: 'full_time', label: 'Full Time' },
          { value: 'part_time', label: 'Part Time' },
          { value: 'contract', label: 'Contract' },
          { value: 'intern', label: 'Intern' }
        ]
      }
    },

    // Linked job application (optional)
    jobApplicationId: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'jobApplications',
        searchFields: ['applicationId', 'applicantName'],
        displayTemplate: '{applicationId}',
        placeholder: 'Link to job application (optional)'
      }
    },

    // === BACKGROUND_CHECK STEP FIELDS ===
    backgroundCheckProvider: {
      type: 'string',
      required: false,
      step: 'background_check',
      foreignKey: {
        options: [
          { value: 'checkr', label: 'Checkr' },
          { value: 'goodhire', label: 'GoodHire' },
          { value: 'sterling', label: 'Sterling' },
          { value: 'internal', label: 'Internal Check' }
        ]
      }
    },

    backgroundCheckNotes: {
      type: 'string',
      required: false,
      step: 'background_check',
      multiline: true,
      rows: 2,
      placeholder: 'Background check notes'
    },

    // === EQUIPMENT_ASSIGNED STEP FIELDS ===
    equipmentNeeded: {
      type: 'string',
      required: false,
      step: 'equipment_assigned',
      multiline: true,
      rows: 3,
      placeholder: 'List equipment needed (laptop, phone, desk, etc.)'
    },

    workstationLocation: {
      type: 'string',
      required: false,
      step: 'equipment_assigned',
      placeholder: 'Desk/office location'
    },

    itSetupNotes: {
      type: 'string',
      required: false,
      step: 'equipment_assigned',
      multiline: true,
      rows: 2,
      placeholder: 'IT setup notes (software, access, etc.)'
    },

    // === TRAINING_SCHEDULED STEP FIELDS ===
    trainingStartDate: {
      type: 'date',
      required: false,
      step: 'training_scheduled',
      description: 'Training start date'
    },

    trainingModules: {
      type: 'string',
      required: false,
      step: 'training_scheduled',
      multiline: true,
      rows: 3,
      placeholder: 'List of training modules to complete'
    },

    // Trainer/mentor assignment - User lookup
    trainerId: {
      type: 'string',
      required: false,
      step: 'training_scheduled',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name'],
        displayFields: ['name', 'department'],
        placeholder: 'Assign trainer/mentor'
      }
    },

    // === TRAINING_COMPLETE STEP FIELDS ===
    trainingCompletionNotes: {
      type: 'string',
      required: false,
      step: 'training_complete',
      multiline: true,
      rows: 2,
      placeholder: 'Training completion notes'
    },

    // === TERMINATED STEP FIELDS ===
    terminationReason: {
      type: 'string',
      required: false,
      step: 'terminated',
      multiline: true,
      rows: 2,
      placeholder: 'Reason for termination'
    },

    // === SYSTEM TRACKING FIELDS ===
    backgroundCheckStatus: {
      type: 'string',
      required: false,
      step: 'system',
      enum: ['pending', 'in_progress', 'passed', 'failed']
    },
    backgroundCheckCompletedAt: { type: 'date', required: false, step: 'system' },
    equipmentAssigned: { type: 'boolean', required: false, step: 'system', default: false },
    equipmentList: { type: 'array', required: false, step: 'system', default: [] },
    emailAccountCreated: { type: 'boolean', required: false, step: 'system', default: false },
    systemAccessGranted: { type: 'boolean', required: false, step: 'system', default: false },
    accessRoles: { type: 'array', required: false, step: 'system', default: [] },
    trainingScheduled: { type: 'boolean', required: false, step: 'system', default: false },
    trainingCompleted: { type: 'boolean', required: false, step: 'system', default: false },
    documentsSigned: { type: 'boolean', required: false, step: 'system', default: false },
    benefitsEnrolled: { type: 'boolean', required: false, step: 'system', default: false },
    workspaceSetup: { type: 'boolean', required: false, step: 'system', default: false },
    teamIntroduced: { type: 'boolean', required: false, step: 'system', default: false },
    documents: { type: 'array', required: false, step: 'system', default: [] },
    notes: { type: 'string', required: false, step: 'system' },
    salary: { type: 'number', required: false, step: 'system', min: 0 },
    currency: { type: 'string', required: false, step: 'system', default: 'USD' },
    initiatedAt: { type: 'date', required: false, step: 'system' },
    activeAt: { type: 'date', required: false, step: 'system' },
    terminatedAt: { type: 'date', required: false, step: 'system' },
    onboardingCompletedAt: { type: 'date', required: false, step: 'system' },
    onboardingDuration: { type: 'number', required: false, step: 'system' }
  },

  states: {
    // Initiated - Onboarding started
    initiated: {
      name: 'Initiated',
      description: 'Employee onboarding initiated',
      transitions: ['background_check'],

      onEnter: async (processInstance, context) => {
        // Generate employee ID
        if (!processInstance.variables.employeeId) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          processInstance.variables.employeeId = `EMP-${timestamp}-${random}`;
        }

        processInstance.variables.initiatedAt = new Date().toISOString();

        console.log(`Onboarding initiated for employee ${processInstance.variables.employeeId}`);
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

    // Background Check
    background_check: {
      name: 'Background Check',
      description: 'Background check in progress',
      transitions: ['equipment_assigned', 'terminated'],

      onEnter: async (processInstance, context) => {
        console.log(`Running background check for ${processInstance.variables.employeeId}`);
        processInstance.variables.backgroundCheckStatus = 'in_progress';
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

    // Equipment Assigned
    equipment_assigned: {
      name: 'Equipment Assigned',
      description: 'Equipment has been assigned',
      transitions: ['training_scheduled'],

      onEnter: async (processInstance, context) => {
        console.log(`Assigning equipment for ${processInstance.variables.employeeId}`);

        if (context.backgroundCheckStatus === 'passed') {
          processInstance.variables.backgroundCheckStatus = 'passed';
          processInstance.variables.backgroundCheckCompletedAt = new Date().toISOString();
        }
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

    // Training Scheduled
    training_scheduled: {
      name: 'Training Scheduled',
      description: 'Training has been scheduled',
      transitions: ['training_complete'],

      onEnter: async (processInstance, context) => {
        console.log(`Scheduling training for ${processInstance.variables.employeeId}`);

        processInstance.variables.trainingScheduled = true;

        if (context.equipmentAssigned) {
          processInstance.variables.equipmentAssigned = true;
        }
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

    // Training Complete
    training_complete: {
      name: 'Training Complete',
      description: 'Employee training completed',
      transitions: ['active'],

      onEnter: async (processInstance, context) => {
        console.log(`Training completed for ${processInstance.variables.employeeId}`);

        processInstance.variables.trainingCompleted = true;
        processInstance.variables.trainingCompletedAt = new Date().toISOString();
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

    // Active (terminal state)
    active: {
      name: 'Active',
      description: 'Employee is active',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Employee ${processInstance.variables.employeeId} is now active`);

        processInstance.variables.activeAt = new Date().toISOString();
        processInstance.variables.onboardingCompletedAt = new Date().toISOString();

        // Calculate onboarding duration
        if (processInstance.variables.initiatedAt && processInstance.variables.onboardingCompletedAt) {
          const start = new Date(processInstance.variables.initiatedAt);
          const end = new Date(processInstance.variables.onboardingCompletedAt);
          processInstance.variables.onboardingDuration = end.getTime() - start.getTime();
        }
      }
    },

    // Terminated (terminal state)
    terminated: {
      name: 'Terminated',
      description: 'Onboarding terminated',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Onboarding terminated for ${processInstance.variables.employeeId}`);

        processInstance.variables.terminatedAt = new Date().toISOString();
        processInstance.variables.terminationReason = context.reason || 'Background check failed';
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
