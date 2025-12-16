/**
 * Service Request Process Definition
 * Customer service request and resolution workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

export const serviceRequestDefinition = {
  id: 'service_request_v1',
  name: 'Service Request',
  description: 'Customer service request and resolution workflow',
  type: PROCESS_TYPES.OPS_SERVICE_REQUEST,
  version: '1.0.0',
  initialState: 'submitted',

  variables: {
    // Request details
    requestNumber: { type: 'string', required: true },
    subject: { type: 'string', required: true },
    description: { type: 'string', required: true },
    category: {
      type: 'string',
      required: true,
      enum: ['information', 'installation', 'configuration', 'training', 'consultation', 'other']
    },

    // Customer details
    customerId: { type: 'string', required: true },
    customerName: { type: 'string', required: true },
    customerEmail: { type: 'string', required: false },
    customerPhone: { type: 'string', required: false },

    // Priority
    priority: {
      type: 'string',
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },

    // Assignment
    assignedTo: { type: 'string', required: false },
    assignedToName: { type: 'string', required: false },
    assignedAt: { type: 'date', required: false },

    // SLA
    slaDeadline: { type: 'date', required: false },
    responseTime: { type: 'number', required: false }, // minutes
    resolutionTime: { type: 'number', required: false }, // minutes

    // Resolution
    resolution: { type: 'string', required: false },
    resolvedBy: { type: 'string', required: false },
    resolvedByName: { type: 'string', required: false },

    // Customer satisfaction
    satisfactionRating: { type: 'number', required: false, min: 1, max: 5 },
    satisfactionComments: { type: 'string', required: false },

    // Escalation
    escalated: { type: 'boolean', required: false, default: false },
    escalationReason: { type: 'string', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] }
  },

  states: {
    submitted: {
      name: 'Submitted',
      description: 'Service request submitted',
      transitions: ['assigned', 'escalated'],
      onEnter: async (processInstance) => {
        console.log(`Service request ${processInstance.variables.requestNumber} submitted`);
        processInstance.variables.submittedAt = new Date().toISOString();

        // Calculate SLA
        const priority = processInstance.variables.priority;
        const slaDays = { low: 5, medium: 3, high: 1, critical: 0.5 };
        const slaMs = (slaDays[priority] || 3) * 24 * 60 * 60 * 1000;
        processInstance.variables.slaDeadline = new Date(Date.now() + slaMs).toISOString();
      },
      autoTransition: {
        conditions: [{
          type: 'condition',
          toState: 'escalated',
          conditions: [{ type: 'variable', field: 'priority', operator: 'eq', value: 'critical' }],
          reason: 'Critical priority - auto-escalated'
        }]
      }
    },

    assigned: {
      name: 'Assigned',
      description: 'Request assigned to agent',
      transitions: ['in_progress', 'escalated'],
      onEnter: async (processInstance, context) => {
        console.log(`Service request ${processInstance.variables.requestNumber} assigned`);
        processInstance.variables.assignedTo = context.assignedTo;
        processInstance.variables.assignedToName = context.assignedToName;
        processInstance.variables.assignedAt = new Date().toISOString();
      }
    },

    in_progress: {
      name: 'In Progress',
      description: 'Agent is working on the request',
      transitions: ['pending_customer', 'resolved', 'escalated'],
      onEnter: async (processInstance) => {
        console.log(`Service request ${processInstance.variables.requestNumber} in progress`);
        processInstance.variables.startedAt = new Date().toISOString();
      }
    },

    pending_customer: {
      name: 'Pending Customer',
      description: 'Waiting for customer response',
      transitions: ['in_progress', 'resolved'],
      onEnter: async (processInstance) => {
        console.log(`Service request ${processInstance.variables.requestNumber} pending customer`);
        processInstance.variables.pendingCustomerAt = new Date().toISOString();
      },
      autoTransition: {
        conditions: [{
          type: 'timer',
          duration: 7 * 24 * 60 * 60 * 1000, // 7 days
          toState: 'resolved',
          reason: 'Auto-resolved - no customer response for 7 days'
        }]
      }
    },

    resolved: {
      name: 'Resolved',
      description: 'Request has been resolved',
      transitions: ['closed', 'in_progress'],
      onEnter: async (processInstance, context) => {
        console.log(`Service request ${processInstance.variables.requestNumber} resolved`);
        processInstance.variables.resolvedBy = context.resolvedBy;
        processInstance.variables.resolvedByName = context.resolvedByName;
        processInstance.variables.resolution = context.resolution;
        processInstance.variables.resolvedAt = new Date().toISOString();

        // Calculate resolution time
        if (processInstance.variables.submittedAt) {
          const submitted = new Date(processInstance.variables.submittedAt);
          const resolved = new Date(processInstance.variables.resolvedAt);
          processInstance.variables.resolutionTime = Math.floor((resolved - submitted) / (1000 * 60));
        }
      },
      autoTransition: {
        conditions: [{
          type: 'timer',
          duration: 48 * 60 * 60 * 1000, // 48 hours
          toState: 'closed',
          reason: 'Auto-closed after 48 hours'
        }]
      }
    },

    closed: {
      name: 'Closed',
      description: 'Request closed',
      transitions: [],
      onEnter: async (processInstance, context) => {
        console.log(`Service request ${processInstance.variables.requestNumber} closed`);
        processInstance.variables.closedAt = new Date().toISOString();
        if (context.satisfactionRating) {
          processInstance.variables.satisfactionRating = context.satisfactionRating;
        }
      }
    },

    escalated: {
      name: 'Escalated',
      description: 'Request has been escalated',
      transitions: ['assigned', 'in_progress', 'resolved'],
      onEnter: async (processInstance, context) => {
        console.log(`Service request ${processInstance.variables.requestNumber} escalated`);
        processInstance.variables.escalated = true;
        processInstance.variables.escalationReason = context.escalationReason || context.reason;
        processInstance.variables.escalatedAt = new Date().toISOString();
      }
    }
  },

  metadata: {
    category: PROCESS_CATEGORIES.OPERATIONS,
    tags: ['service', 'customer', 'support', 'request'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'customer', 'assignee', 'member', 'manager', 'admin', 'owner'],
      transition: {
        submitted_to_assigned: ['member', 'admin', 'owner'],
        submitted_to_escalated: ['system', 'manager', 'owner'],
        assigned_to_in_progress: ['assignee', 'member', 'admin', 'owner'],
        in_progress_to_resolved: ['assignee', 'member', 'admin', 'owner'],
        resolved_to_closed: ['system', 'assignee', 'member', 'admin', 'owner']
      }
    },
    icon: 'headset-outline',
    color: '#06b6d4' // cyan
  }
};

export default serviceRequestDefinition;
