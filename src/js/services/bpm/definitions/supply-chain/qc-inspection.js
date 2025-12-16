/**
 * QC Inspection Process Definition
 * Quality control inspection workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const qcInspectionDefinition = {
  id: 'qc_inspection_v1',
  name: 'QC Inspection',
  description: 'Quality control inspection workflow',
  type: PROCESS_TYPES.SUPPLY_CHAIN_QC_INSPECTION,
  version: '1.0.0',
  initialState: 'scheduled',

  variables: {
    // Inspection details
    inspectionId: { type: 'string', required: false },
    inspectionTitle: { type: 'string', required: true },
    inspectionType: {
      type: 'string',
      required: true,
      enum: ['incoming', 'in_process', 'final', 'audit', 'vendor']
    },

    // Reference
    referenceType: {
      type: 'string',
      required: false,
      enum: ['purchase_order', 'work_order', 'production_batch', 'shipment', 'other']
    },
    referenceId: { type: 'string', required: false },
    referenceName: { type: 'string', required: false },

    // Item/Product details
    itemId: { type: 'string', required: false },
    itemName: { type: 'string', required: true },
    itemDescription: { type: 'string', required: false },
    quantity: { type: 'number', required: true, min: 0 },
    unit: { type: 'string', required: false, default: 'unit' },
    batchNumber: { type: 'string', required: false },
    lotNumber: { type: 'string', required: false },

    // Vendor/Supplier
    vendorId: { type: 'string', required: false },
    vendorName: { type: 'string', required: false },

    // Inspector
    inspectorId: { type: 'string', required: false },
    inspectorName: { type: 'string', required: false },

    // Schedule
    scheduledDate: { type: 'date', required: true },
    actualStartDate: { type: 'date', required: false },
    actualCompletionDate: { type: 'date', required: false },

    // Inspection criteria
    inspectionCriteria: { type: 'array', required: false, default: [] },
    checkpoints: { type: 'array', required: false, default: [] },

    // Results
    result: {
      type: 'string',
      required: false,
      enum: ['passed', 'failed', 'conditional', 'pending']
    },
    inspectedQuantity: { type: 'number', required: false, min: 0 },
    passedQuantity: { type: 'number', required: false, min: 0 },
    failedQuantity: { type: 'number', required: false, min: 0 },
    defectRate: { type: 'number', required: false, min: 0, max: 100 },

    // Findings
    findings: { type: 'array', required: false, default: [] },
    defects: { type: 'array', required: false, default: [] },
    defectCategories: { type: 'array', required: false, default: [] },
    notes: { type: 'string', required: false },

    // Corrective action
    correctiveActionRequired: { type: 'boolean', required: false, default: false },
    correctiveActions: { type: 'array', required: false, default: [] },
    correctiveActionNotes: { type: 'string', required: false },
    correctiveActionCompletedBy: { type: 'string', required: false },

    // Re-inspection
    reInspectionRequired: { type: 'boolean', required: false, default: false },
    reInspectionCount: { type: 'number', required: false, default: 0 },
    reInspectionNotes: { type: 'string', required: false },

    // Disposition
    disposition: {
      type: 'string',
      required: false,
      enum: ['accept', 'reject', 'rework', 'use_as_is', 'scrap', 'return_to_vendor']
    },
    dispositionNotes: { type: 'string', required: false },

    // Approval
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] },
    photos: { type: 'array', required: false, default: [] }
  },

  states: {
    scheduled: {
      name: 'Scheduled',
      description: 'Inspection scheduled',
      transitions: ['in_progress', 'cancelled'],
      onEnter: async (processInstance) => {
        console.log(`QC Inspection scheduled: ${processInstance.variables.inspectionTitle}`);
        if (!processInstance.variables.inspectionId) {
          processInstance.variables.inspectionId = `QC-${Date.now()}`;
        }
        processInstance.variables.scheduledAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Start inspection',
        actionLabel: 'Start Inspection'
      }]
    },

    in_progress: {
      name: 'In Progress',
      description: 'Inspection in progress',
      transitions: ['passed', 'failed'],
      onEnter: async (processInstance, context) => {
        console.log(`QC Inspection in progress: ${processInstance.variables.inspectionTitle}`);
        processInstance.variables.actualStartDate = context.actualStartDate || new Date().toISOString();
        processInstance.variables.inspectorId = context.inspectorId;
        processInstance.variables.inspectorName = context.inspectorName;
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete inspection and record results',
        actionLabel: 'Complete Inspection',
        metadata: {
          passLabel: 'Mark as Passed',
          failLabel: 'Mark as Failed'
        }
      }]
    },

    passed: {
      name: 'Passed',
      description: 'Inspection passed',
      transitions: ['completed'],
      onEnter: async (processInstance, context) => {
        console.log(`QC Inspection passed: ${processInstance.variables.inspectionTitle}`);
        processInstance.variables.result = 'passed';
        processInstance.variables.actualCompletionDate = new Date().toISOString();
        processInstance.variables.inspectedQuantity = context.inspectedQuantity;
        processInstance.variables.passedQuantity = context.passedQuantity || context.inspectedQuantity;
        processInstance.variables.failedQuantity = context.failedQuantity || 0;

        // Calculate defect rate
        if (processInstance.variables.inspectedQuantity > 0) {
          const failedQty = processInstance.variables.failedQuantity || 0;
          processInstance.variables.defectRate = (failedQty / processInstance.variables.inspectedQuantity) * 100;
        }

        processInstance.variables.findings = context.findings;
        processInstance.variables.notes = context.notes;
        processInstance.variables.disposition = context.disposition || 'accept';
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Approve inspection results',
        actionLabel: 'Approve Results'
      }]
    },

    failed: {
      name: 'Failed',
      description: 'Inspection failed',
      transitions: ['corrective_action', 'completed'],
      onEnter: async (processInstance, context) => {
        console.log(`QC Inspection failed: ${processInstance.variables.inspectionTitle}`);
        processInstance.variables.result = 'failed';
        processInstance.variables.actualCompletionDate = new Date().toISOString();
        processInstance.variables.inspectedQuantity = context.inspectedQuantity;
        processInstance.variables.passedQuantity = context.passedQuantity || 0;
        processInstance.variables.failedQuantity = context.failedQuantity;

        // Calculate defect rate
        if (processInstance.variables.inspectedQuantity > 0) {
          const failedQty = processInstance.variables.failedQuantity || 0;
          processInstance.variables.defectRate = (failedQty / processInstance.variables.inspectedQuantity) * 100;
        }

        processInstance.variables.findings = context.findings;
        processInstance.variables.defects = context.defects;
        processInstance.variables.defectCategories = context.defectCategories;
        processInstance.variables.notes = context.notes;
        processInstance.variables.disposition = context.disposition || 'reject';

        // Determine if corrective action is required
        const disposition = processInstance.variables.disposition;
        processInstance.variables.correctiveActionRequired = ['rework', 'use_as_is'].includes(disposition);
      },
      autoTransition: {
        conditions: [{
          type: 'condition',
          toState: 'corrective_action',
          conditions: [{
            type: 'variable',
            field: 'correctiveActionRequired',
            operator: 'eq',
            value: true
          }],
          reason: 'Corrective action required based on disposition'
        }]
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Review failed inspection and approve disposition',
        actionLabel: 'Approve Disposition'
      }]
    },

    corrective_action: {
      name: 'Corrective Action',
      description: 'Corrective action in progress',
      transitions: ['re_inspection', 'completed'],
      onEnter: async (processInstance, context) => {
        console.log(`Corrective action for: ${processInstance.variables.inspectionTitle}`);
        if (context.correctiveActions) {
          processInstance.variables.correctiveActions = context.correctiveActions;
        }
        if (context.correctiveActionNotes) {
          processInstance.variables.correctiveActionNotes = context.correctiveActionNotes;
        }
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete corrective actions',
        actionLabel: 'Complete Actions',
        metadata: {
          reInspectLabel: 'Request Re-inspection',
          completeLabel: 'Mark as Complete'
        }
      }]
    },

    re_inspection: {
      name: 'Re-inspection',
      description: 'Re-inspection scheduled',
      transitions: ['passed', 'failed'],
      onEnter: async (processInstance, context) => {
        console.log(`Re-inspection for: ${processInstance.variables.inspectionTitle}`);
        processInstance.variables.reInspectionRequired = true;
        processInstance.variables.reInspectionCount = (processInstance.variables.reInspectionCount || 0) + 1;
        processInstance.variables.correctiveActionCompletedBy = context.completedBy;
        processInstance.variables.reInspectionNotes = context.reInspectionNotes;
        processInstance.variables.reInspectionScheduledAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Perform re-inspection',
        actionLabel: 'Re-inspect',
        metadata: {
          passLabel: 'Passed',
          failLabel: 'Failed'
        }
      }]
    },

    completed: {
      name: 'Completed',
      description: 'Inspection completed',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`QC Inspection completed: ${processInstance.variables.inspectionTitle}`);

        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }
        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }

        processInstance.variables.completedAt = new Date().toISOString();

        // TODO: Update inventory/production status based on disposition
        // TODO: Update vendor quality score if applicable
        // TODO: Trigger notifications to stakeholders
      }
    },

    cancelled: {
      name: 'Cancelled',
      description: 'Inspection cancelled',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`QC Inspection cancelled: ${processInstance.variables.inspectionTitle}`);
        processInstance.variables.cancellationReason = context.reason;
        processInstance.variables.cancelledBy = context.cancelledBy;
        processInstance.variables.cancelledAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.SUPPLY_CHAIN,
    tags: ['quality', 'inspection', 'qc', 'supply-chain'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'inspector', 'quality_manager', 'manager', 'admin', 'owner'],
      transition: {
        scheduled_to_in_progress: ['inspector', 'member', 'admin', 'owner'],
        in_progress_to_passed: ['inspector', 'member', 'admin', 'owner'],
        in_progress_to_failed: ['inspector', 'member', 'admin', 'owner'],
        passed_to_completed: ['quality_manager', 'manager', 'owner'],
        failed_to_corrective_action: ['system', 'quality_manager', 'manager', 'owner'],
        failed_to_completed: ['quality_manager', 'manager', 'owner'],
        corrective_action_to_re_inspection: ['member', 'admin', 'owner'],
        corrective_action_to_completed: ['member', 'admin', 'owner'],
        re_inspection_to_passed: ['inspector', 'member', 'admin', 'owner'],
        re_inspection_to_failed: ['inspector', 'member', 'admin', 'owner'],
        any_to_cancelled: ['quality_manager', 'manager', 'owner']
      }
    },
    icon: 'checkmark-circle-outline',
    color: '#8b5cf6' // purple
  }
};

export default qcInspectionDefinition;
