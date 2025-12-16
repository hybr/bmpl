/**
 * IT Ticket Process Definition
 * IT service desk ticketing and resolution workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * IT Ticket Process
 *
 * State Flow:
 * submitted → assigned → in_progress → pending_user → resolved → closed | escalated
 *
 * SLA-based escalation and auto-assignment rules
 */
export const itTicketDefinition = {
  id: 'it_ticket_v1',
  name: 'IT Ticket',
  description: 'IT service desk ticketing and resolution workflow',
  type: PROCESS_TYPES.IT_TICKET,
  version: '1.0.0',
  initialState: 'submitted',

  // Variable schema
  variables: {
    // Ticket details
    ticketNumber: { type: 'string', required: true },
    subject: { type: 'string', required: true },
    description: { type: 'string', required: true },
    category: {
      type: 'string',
      required: true,
      enum: [
        'hardware',
        'software',
        'network',
        'access',
        'email',
        'printing',
        'phone',
        'application',
        'security',
        'other'
      ]
    },
    subcategory: { type: 'string', required: false },

    // Priority and impact
    priority: {
      type: 'string',
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    impact: {
      type: 'string',
      required: false,
      enum: ['individual', 'department', 'organization'],
      default: 'individual'
    },
    urgency: {
      type: 'string',
      required: false,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },

    // Requester information
    requesterId: { type: 'string', required: true },
    requesterName: { type: 'string', required: true },
    requesterEmail: { type: 'string', required: true },
    requesterPhone: { type: 'string', required: false },
    requesterLocation: { type: 'string', required: false },
    requesterDepartment: { type: 'string', required: false },

    // Assignment
    assignedTo: { type: 'string', required: false },
    assignedToName: { type: 'string', required: false },
    assignedAt: { type: 'date', required: false },
    assignmentGroup: {
      type: 'string',
      required: false,
      enum: ['helpdesk', 'desktop_support', 'network', 'security', 'applications', 'infrastructure']
    },

    // SLA tracking
    slaDeadline: { type: 'date', required: false },
    slaStatus: {
      type: 'string',
      required: false,
      enum: ['on_track', 'at_risk', 'breached'],
      default: 'on_track'
    },
    responseDeadline: { type: 'date', required: false },
    resolutionDeadline: { type: 'date', required: false },
    responseTime: { type: 'number', required: false }, // in minutes
    resolutionTime: { type: 'number', required: false }, // in minutes

    // Resolution
    resolution: { type: 'string', required: false },
    resolutionNotes: { type: 'string', required: false },
    resolvedBy: { type: 'string', required: false },
    resolvedByName: { type: 'string', required: false },
    rootCause: { type: 'string', required: false },

    // Escalation
    escalated: { type: 'boolean', required: false, default: false },
    escalationLevel: { type: 'number', required: false, min: 0, default: 0 },
    escalationReason: { type: 'string', required: false },
    escalatedTo: { type: 'string', required: false },
    escalatedAt: { type: 'date', required: false },

    // Communication
    lastUpdatedBy: { type: 'string', required: false },
    lastContactedAt: { type: 'date', required: false },
    reopenCount: { type: 'number', required: false, min: 0, default: 0 },

    // Related items
    relatedTickets: { type: 'array', required: false, default: [] },
    knowledgeBaseArticles: { type: 'array', required: false, default: [] },
    affectedAssets: { type: 'array', required: false, default: [] },

    // Satisfaction
    satisfactionRating: { type: 'number', required: false, min: 1, max: 5 },
    satisfactionComments: { type: 'string', required: false },

    // Documents and attachments
    documents: { type: 'array', required: false, default: [] },
    screenshots: { type: 'array', required: false, default: [] },

    // Additional fields
    tags: { type: 'array', required: false, default: [] },
    workNotes: { type: 'string', required: false },
    estimatedEffort: { type: 'number', required: false }, // in hours
    actualEffort: { type: 'number', required: false } // in hours
  },

  // State definitions
  states: {
    // Submitted - Ticket submitted
    submitted: {
      name: 'Submitted',
      description: 'IT ticket has been submitted',
      transitions: ['assigned', 'escalated'],

      onEnter: async (processInstance, context) => {
        console.log(`IT ticket ${processInstance.variables.ticketNumber} submitted`);

        processInstance.variables.submittedAt = new Date().toISOString();

        // Generate ticket number if not provided
        if (!processInstance.variables.ticketNumber) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 10000);
          processInstance.variables.ticketNumber = `IT-${timestamp}-${random}`;
        }

        // Calculate SLA deadlines based on priority
        const now = new Date();
        const priority = processInstance.variables.priority || 'medium';

        // Response time SLAs (in minutes)
        const responseSLA = {
          'critical': 15,    // 15 minutes
          'high': 60,        // 1 hour
          'medium': 240,     // 4 hours
          'low': 480         // 8 hours
        };

        // Resolution time SLAs (in hours)
        const resolutionSLA = {
          'critical': 4,     // 4 hours
          'high': 8,         // 8 hours
          'medium': 24,      // 1 day
          'low': 72          // 3 days
        };

        const responseMinutes = responseSLA[priority] || 240;
        const resolutionHours = resolutionSLA[priority] || 24;

        const responseDeadline = new Date(now.getTime() + responseMinutes * 60 * 1000);
        const resolutionDeadline = new Date(now.getTime() + resolutionHours * 60 * 60 * 1000);

        processInstance.variables.responseDeadline = responseDeadline.toISOString();
        processInstance.variables.resolutionDeadline = resolutionDeadline.toISOString();
        processInstance.variables.slaDeadline = resolutionDeadline.toISOString();

        // TODO: Send acknowledgment to requester
        // await notificationService.send({
        //   to: processInstance.variables.requesterEmail,
        //   type: 'ticket_submitted',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   slaDeadline: processInstance.variables.slaDeadline
        // });

        // TODO: Notify helpdesk team
        // await notificationService.send({
        //   to: 'helpdesk_team',
        //   type: 'new_ticket',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   priority: processInstance.variables.priority,
        //   category: processInstance.variables.category
        // });
      },

      // Auto-assign based on category or escalate if critical
      autoTransition: {
        conditions: [
          {
            type: 'condition',
            toState: 'escalated',
            conditions: [
              {
                type: 'variable',
                field: 'priority',
                operator: 'eq',
                value: 'critical'
              }
            ],
            reason: 'Critical priority - auto-escalated'
          },
          {
            type: 'timer',
            duration: 30 * 60 * 1000, // 30 minutes
            toState: 'assigned',
            reason: 'Auto-assigned to helpdesk'
          }
        ]
      }
    },

    // Assigned - Ticket assigned to technician
    assigned: {
      name: 'Assigned',
      description: 'Ticket assigned to IT technician',
      transitions: ['in_progress', 'escalated', 'submitted'],

      onEnter: async (processInstance, context) => {
        console.log(`IT ticket ${processInstance.variables.ticketNumber} assigned`);

        // Record assignment
        if (context.assignedTo) {
          processInstance.variables.assignedTo = context.assignedTo;
        }

        if (context.assignedToName) {
          processInstance.variables.assignedToName = context.assignedToName;
        }

        if (context.assignmentGroup) {
          processInstance.variables.assignmentGroup = context.assignmentGroup;
        }

        processInstance.variables.assignedAt = new Date().toISOString();

        // Calculate response time
        if (processInstance.variables.submittedAt && processInstance.variables.assignedAt) {
          const submitted = new Date(processInstance.variables.submittedAt);
          const assigned = new Date(processInstance.variables.assignedAt);
          const responseMs = assigned.getTime() - submitted.getTime();
          processInstance.variables.responseTime = Math.floor(responseMs / (1000 * 60)); // minutes
        }

        // TODO: Notify assigned technician
        // await notificationService.send({
        //   to: processInstance.variables.assignedTo,
        //   type: 'ticket_assigned',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   priority: processInstance.variables.priority,
        //   slaDeadline: processInstance.variables.slaDeadline
        // });

        // TODO: Update requester
        // await notificationService.send({
        //   to: processInstance.variables.requesterEmail,
        //   type: 'ticket_assigned_notification',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   assignedToName: processInstance.variables.assignedToName
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Start working on this ticket',
          actionLabel: 'Start Work'
        }
      ],

      // Escalate if not started within response SLA
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 2 * 60 * 60 * 1000, // 2 hours
            toState: 'escalated',
            reason: 'Not started within 2 hours - escalated'
          }
        ]
      }
    },

    // In Progress - Work in progress
    in_progress: {
      name: 'In Progress',
      description: 'Technician is working on the ticket',
      transitions: ['pending_user', 'resolved', 'escalated', 'assigned'],

      onEnter: async (processInstance, context) => {
        console.log(`IT ticket ${processInstance.variables.ticketNumber} in progress`);

        processInstance.variables.startedAt = new Date().toISOString();

        // TODO: Update requester
        // await notificationService.send({
        //   to: processInstance.variables.requesterEmail,
        //   type: 'ticket_in_progress',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   assignedToName: processInstance.variables.assignedToName
        // });
      },

      // Check SLA status
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 4 * 60 * 60 * 1000, // 4 hours
            toState: 'escalated',
            reason: 'SLA at risk - escalated for attention',
            conditions: [
              {
                type: 'variable',
                field: 'priority',
                operator: 'in',
                value: ['high', 'critical']
              }
            ]
          }
        ]
      }
    },

    // Pending User - Waiting for user response
    pending_user: {
      name: 'Pending User',
      description: 'Waiting for response from user',
      transitions: ['in_progress', 'resolved', 'escalated'],

      onEnter: async (processInstance, context) => {
        console.log(`IT ticket ${processInstance.variables.ticketNumber} pending user response`);

        processInstance.variables.pendingUserAt = new Date().toISOString();

        // TODO: Send request to user
        // await notificationService.send({
        //   to: processInstance.variables.requesterEmail,
        //   type: 'ticket_needs_info',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   message: context.message || 'Additional information needed'
        // });
      },

      // Auto-close if no response within 7 days
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'resolved',
            reason: 'Auto-resolved - no user response for 7 days'
          }
        ]
      }
    },

    // Resolved - Issue resolved
    resolved: {
      name: 'Resolved',
      description: 'Issue has been resolved',
      transitions: ['closed', 'in_progress'],

      onEnter: async (processInstance, context) => {
        console.log(`IT ticket ${processInstance.variables.ticketNumber} resolved`);

        // Record resolution
        if (context.resolvedBy) {
          processInstance.variables.resolvedBy = context.resolvedBy;
        }

        if (context.resolvedByName) {
          processInstance.variables.resolvedByName = context.resolvedByName;
        }

        if (context.resolution) {
          processInstance.variables.resolution = context.resolution;
        }

        if (context.resolutionNotes) {
          processInstance.variables.resolutionNotes = context.resolutionNotes;
        }

        if (context.rootCause) {
          processInstance.variables.rootCause = context.rootCause;
        }

        processInstance.variables.resolvedAt = new Date().toISOString();

        // Calculate resolution time
        if (processInstance.variables.submittedAt && processInstance.variables.resolvedAt) {
          const submitted = new Date(processInstance.variables.submittedAt);
          const resolved = new Date(processInstance.variables.resolvedAt);
          const resolutionMs = resolved.getTime() - submitted.getTime();
          processInstance.variables.resolutionTime = Math.floor(resolutionMs / (1000 * 60)); // minutes
        }

        // Check SLA status
        if (processInstance.variables.slaDeadline && processInstance.variables.resolvedAt) {
          const deadline = new Date(processInstance.variables.slaDeadline);
          const resolved = new Date(processInstance.variables.resolvedAt);

          if (resolved > deadline) {
            processInstance.variables.slaStatus = 'breached';
          } else {
            processInstance.variables.slaStatus = 'on_track';
          }
        }

        // TODO: Send resolution notification to requester
        // await notificationService.send({
        //   to: processInstance.variables.requesterEmail,
        //   type: 'ticket_resolved',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   resolution: processInstance.variables.resolution,
        //   satisfactionSurveyLink: `survey/${processInstance._id}`
        // });
      },

      // Auto-close after 48 hours if no feedback
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 48 * 60 * 60 * 1000, // 48 hours
            toState: 'closed',
            reason: 'Auto-closed after 48 hours with no feedback'
          }
        ]
      }
    },

    // Closed - Ticket closed (terminal state)
    closed: {
      name: 'Closed',
      description: 'Ticket has been closed',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`IT ticket ${processInstance.variables.ticketNumber} closed`);

        processInstance.variables.closedAt = new Date().toISOString();

        // Record satisfaction rating if provided
        if (context.satisfactionRating) {
          processInstance.variables.satisfactionRating = context.satisfactionRating;
        }

        if (context.satisfactionComments) {
          processInstance.variables.satisfactionComments = context.satisfactionComments;
        }

        // TODO: Update knowledge base if applicable
        // if (processInstance.variables.resolution && processInstance.variables.rootCause) {
        //   await knowledgeBaseService.suggest({
        //     category: processInstance.variables.category,
        //     issue: processInstance.variables.subject,
        //     resolution: processInstance.variables.resolution,
        //     rootCause: processInstance.variables.rootCause
        //   });
        // }

        // TODO: Send closure notification
        // await notificationService.send({
        //   to: processInstance.variables.requesterEmail,
        //   type: 'ticket_closed',
        //   ticketNumber: processInstance.variables.ticketNumber
        // });
      }
    },

    // Escalated - Ticket escalated (can transition back)
    escalated: {
      name: 'Escalated',
      description: 'Ticket has been escalated',
      transitions: ['assigned', 'in_progress', 'resolved'],

      onEnter: async (processInstance, context) => {
        console.log(`IT ticket ${processInstance.variables.ticketNumber} escalated`);

        processInstance.variables.escalated = true;
        processInstance.variables.escalationLevel = (processInstance.variables.escalationLevel || 0) + 1;

        if (context.escalationReason) {
          processInstance.variables.escalationReason = context.escalationReason;
        }

        if (context.escalatedTo) {
          processInstance.variables.escalatedTo = context.escalatedTo;
        }

        processInstance.variables.escalatedAt = new Date().toISOString();

        // Update SLA status
        processInstance.variables.slaStatus = 'at_risk';

        // TODO: Notify escalation contact
        // await notificationService.send({
        //   to: processInstance.variables.escalatedTo || 'it_manager',
        //   type: 'ticket_escalated',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   priority: processInstance.variables.priority,
        //   escalationLevel: processInstance.variables.escalationLevel,
        //   escalationReason: processInstance.variables.escalationReason
        // });

        // TODO: Notify requester
        // await notificationService.send({
        //   to: processInstance.variables.requesterEmail,
        //   type: 'ticket_escalated_notification',
        //   ticketNumber: processInstance.variables.ticketNumber,
        //   escalationLevel: processInstance.variables.escalationLevel
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Review escalated ticket and take action',
          actionLabel: 'Handle Escalation',
          metadata: {
            requiresManagerAction: true
          }
        }
      ]
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.IT,
    tags: ['it', 'support', 'ticket', 'helpdesk', 'service_desk'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'assignee', 'member', 'manager', 'admin', 'owner'],
      transition: {
        submitted_to_assigned: ['member', 'admin', 'owner'],
        submitted_to_escalated: ['system', 'manager', 'admin', 'owner'],
        assigned_to_in_progress: ['assignee', 'member', 'admin', 'owner'],
        assigned_to_escalated: ['system', 'assignee', 'manager', 'owner'],
        in_progress_to_pending_user: ['assignee', 'member', 'admin', 'owner'],
        in_progress_to_resolved: ['assignee', 'member', 'admin', 'owner'],
        in_progress_to_escalated: ['system', 'assignee', 'manager', 'owner'],
        pending_user_to_in_progress: ['assignee', 'member', 'admin', 'owner'],
        pending_user_to_resolved: ['system', 'assignee', 'member', 'owner'],
        resolved_to_closed: ['system', 'creator', 'assignee', 'member', 'admin', 'owner'],
        resolved_to_in_progress: ['creator', 'assignee', 'member', 'admin', 'owner'],
        escalated_to_assigned: ['manager', 'admin', 'owner'],
        escalated_to_in_progress: ['manager', 'admin', 'owner'],
        escalated_to_resolved: ['manager', 'admin', 'owner']
      }
    },
    icon: 'construct',
    color: '#ef4444' // red
  }
};

export default itTicketDefinition;
