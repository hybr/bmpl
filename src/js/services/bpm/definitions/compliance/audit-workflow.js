/**
 * Audit Workflow Process Definition
 * Internal/external audit management workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const auditWorkflowDefinition = {
  id: 'audit_workflow_v1',
  name: 'Audit Workflow',
  description: 'Internal/external audit management workflow',
  type: PROCESS_TYPES.COMPLIANCE_AUDIT,
  version: '1.0.0',
  initialState: 'scheduled',

  variables: {
    auditId: { type: 'string', required: false },
    auditTitle: { type: 'string', required: true },
    auditType: {
      type: 'string',
      required: true,
      enum: ['internal', 'external', 'financial', 'compliance', 'operational', 'it']
    },
    auditScope: { type: 'string', required: true },
    auditorId: { type: 'string', required: false },
    auditorName: { type: 'string', required: false },
    auditTeam: { type: 'array', required: false, default: [] },
    scheduledDate: { type: 'date', required: true },
    completionDeadline: { type: 'date', required: false },
    auditeeIds: { type: 'array', required: false, default: [] },
    findings: { type: 'array', required: false, default: [] },
    recommendations: { type: 'array', required: false, default: [] },
    managementResponse: { type: 'string', required: false },
    correctiveActions: { type: 'array', required: false, default: [] },
    draftReportDate: { type: 'date', required: false },
    finalReportDate: { type: 'date', required: false },
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    scheduled: {
      name: 'Scheduled',
      description: 'Audit scheduled',
      transitions: ['preparation'],
      onEnter: async (processInstance) => {
        console.log(`Audit scheduled: ${processInstance.variables.auditTitle}`);
        if (!processInstance.variables.auditId) {
          processInstance.variables.auditId = `AUD-${Date.now()}`;
        }
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'preparation' }]
      }
    },

    preparation: {
      name: 'Preparation',
      description: 'Audit preparation phase',
      transitions: ['fieldwork'],
      onEnter: async (processInstance) => {
        console.log(`Audit preparation: ${processInstance.variables.auditTitle}`);
        processInstance.variables.preparationStartedAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete audit preparation',
        actionLabel: 'Start Fieldwork'
      }]
    },

    fieldwork: {
      name: 'Fieldwork',
      description: 'Conducting audit fieldwork',
      transitions: ['findings'],
      onEnter: async (processInstance) => {
        console.log(`Audit fieldwork: ${processInstance.variables.auditTitle}`);
        processInstance.variables.fieldworkStartedAt = new Date().toISOString();
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MEMBER,
        message: 'Complete fieldwork and document findings',
        actionLabel: 'Complete Fieldwork'
      }]
    },

    findings: {
      name: 'Findings',
      description: 'Documenting audit findings',
      transitions: ['management_response'],
      onEnter: async (processInstance, context) => {
        console.log(`Documenting findings: ${processInstance.variables.auditTitle}`);
        processInstance.variables.findings = context.findings;
        processInstance.variables.recommendations = context.recommendations;
        processInstance.variables.findingsDocumentedAt = new Date().toISOString();
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'management_response' }]
      }
    },

    management_response: {
      name: 'Management Response',
      description: 'Awaiting management response',
      transitions: ['report_draft'],
      onEnter: async (processInstance) => {
        console.log(`Awaiting management response: ${processInstance.variables.auditTitle}`);
      },
      requiredActions: [{
        type: 'manual',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Provide management response to findings',
        actionLabel: 'Submit Response'
      }]
    },

    report_draft: {
      name: 'Report Draft',
      description: 'Draft report prepared',
      transitions: ['final_report'],
      onEnter: async (processInstance, context) => {
        console.log(`Draft report: ${processInstance.variables.auditTitle}`);
        processInstance.variables.managementResponse = context.managementResponse;
        processInstance.variables.correctiveActions = context.correctiveActions;
        processInstance.variables.draftReportDate = new Date().toISOString();
      },
      requiredActions: [{
        type: 'approval',
        role: APPROVAL_LEVELS.MANAGER,
        message: 'Review and approve draft report',
        actionLabel: 'Approve Draft'
      }]
    },

    final_report: {
      name: 'Final Report',
      description: 'Final report issued',
      transitions: ['closed'],
      onEnter: async (processInstance) => {
        console.log(`Final report: ${processInstance.variables.auditTitle}`);
        processInstance.variables.finalReportDate = new Date().toISOString();
      },
      autoTransition: {
        conditions: [{ type: 'immediate', toState: 'closed' }]
      }
    },

    closed: {
      name: 'Closed',
      description: 'Audit closed',
      transitions: [],
      onEnter: async (processInstance) => {
        console.log(`Audit closed: ${processInstance.variables.auditTitle}`);
        processInstance.variables.closedAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.COMPLIANCE,
    tags: ['audit', 'compliance', 'review', 'findings'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'auditor', 'auditee', 'manager', 'admin', 'owner'],
      transition: {
        scheduled_to_preparation: ['system'],
        preparation_to_fieldwork: ['auditor', 'member', 'admin', 'owner'],
        fieldwork_to_findings: ['auditor', 'member', 'admin', 'owner'],
        findings_to_management_response: ['system'],
        management_response_to_report_draft: ['auditee', 'manager', 'owner'],
        report_draft_to_final_report: ['auditor', 'manager', 'admin', 'owner'],
        final_report_to_closed: ['system']
      }
    },
    icon: 'shield-checkmark-outline',
    color: '#ef4444' // red
  }
};

export default auditWorkflowDefinition;
