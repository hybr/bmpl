/**
 * Task Workflow Process Definition
 * Simple workflow for managing tasks with assignment, review, and completion
 */

import { PROCESS_TYPES } from '../../../config/constants.js';

/**
 * Task Workflow Process
 *
 * State Flow:
 * created → assigned → in_progress → review → completed
 *        ↘ cancelled ↙
 */
export const taskWorkflowDefinition = {
  id: 'task_workflow_v1',
  name: 'Task Workflow',
  description: 'Simple task management workflow',
  type: PROCESS_TYPES.TASK,
  version: '1.0.0',
  initialState: 'created',

  // Process variables schema
  variables: {
    taskId: { type: 'string', required: true },
    title: { type: 'string', required: true },
    description: { type: 'string', required: false },
    creatorId: { type: 'string', required: true },
    assigneeId: { type: 'string', required: false },
    priority: { type: 'string', required: false, default: 'medium' }, // low, medium, high
    dueDate: { type: 'string', required: false },
    estimatedHours: { type: 'number', required: false },
    actualHours: { type: 'number', required: false },
    tags: { type: 'array', required: false },
    attachments: { type: 'array', required: false },
    result: { type: 'string', required: false },
    reviewNotes: { type: 'string', required: false }
  },

  // State definitions
  states: {
    // Task created
    created: {
      name: 'Task Created',
      description: 'Task has been created and is pending assignment',
      transitions: ['assigned', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Task created: ${processInstance.variables.title}`);

        // TODO: Notify team members of new task
      },

      requiredActions: [
        {
          type: 'manual',
          role: 'admin',
          message: 'Assign this task to a team member',
          actionLabel: 'Assign Task'
        }
      ],

      // Auto-cancel if not assigned within 7 days
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'cancelled',
            reason: 'Task not assigned within 7 days'
          }
        ]
      }
    },

    // Task assigned
    assigned: {
      name: 'Task Assigned',
      description: 'Task has been assigned to a team member',
      transitions: ['in_progress', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Task assigned to ${processInstance.variables.assigneeId}`);

        if (context.assigneeId) {
          processInstance.variables.assigneeId = context.assigneeId;
        }

        if (context.dueDate) {
          processInstance.variables.dueDate = context.dueDate;
        }

        // TODO: Notify assignee
        // await notificationService.send({
        //   userId: processInstance.variables.assigneeId,
        //   type: 'task_assigned',
        //   data: {
        //     taskId: processInstance.variables.taskId,
        //     title: processInstance.variables.title,
        //     dueDate: processInstance.variables.dueDate
        //   }
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: 'member',
          message: 'Start working on this task',
          actionLabel: 'Start Task'
        }
      ]
    },

    // Task in progress
    in_progress: {
      name: 'In Progress',
      description: 'Task is currently being worked on',
      transitions: ['review', 'assigned', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Task in progress: ${processInstance.variables.title}`);

        processInstance.variables.startedAt = new Date().toISOString();
        processInstance.variables.startedBy = context.userId || processInstance.variables.assigneeId;

        // TODO: Update task status in project board
      },

      requiredActions: [
        {
          type: 'form',
          role: 'member',
          message: 'Complete the task and submit for review',
          actionLabel: 'Submit for Review',
          metadata: {
            validation: {
              result: { required: true, type: 'string' },
              actualHours: { required: false, type: 'number', min: 0 }
            }
          }
        }
      ],

      // Warn if task is overdue
      autoTransition: {
        conditions: [
          {
            type: 'time',
            field: 'variables.dueDate',
            operator: 'lt',
            value: 0,
            unit: 'milliseconds',
            toState: 'in_progress', // Stay in same state, just trigger warning
            reason: 'Task is overdue'
          }
        ]
      }
    },

    // Under review
    review: {
      name: 'Under Review',
      description: 'Task is being reviewed',
      transitions: ['completed', 'in_progress', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Task under review: ${processInstance.variables.title}`);

        processInstance.variables.submittedForReviewAt = new Date().toISOString();

        if (context.result) {
          processInstance.variables.result = context.result;
        }

        if (context.actualHours) {
          processInstance.variables.actualHours = context.actualHours;
        }

        // TODO: Notify reviewer (task creator or admin)
        // await notificationService.send({
        //   userId: processInstance.variables.creatorId,
        //   type: 'task_review_needed',
        //   data: {
        //     taskId: processInstance.variables.taskId,
        //     title: processInstance.variables.title
        //   }
        // });
      },

      requiredActions: [
        {
          type: 'review',
          role: 'admin',
          message: 'Review the completed task',
          actionLabel: 'Review Task',
          metadata: {
            approveLabel: 'Approve & Complete',
            rejectLabel: 'Request Changes'
          }
        }
      ]
    },

    // Terminal state: Task completed
    completed: {
      name: 'Completed',
      description: 'Task has been completed successfully',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Task completed: ${processInstance.variables.title}`);

        processInstance.variables.completedAt = new Date().toISOString();
        processInstance.variables.reviewedBy = context.reviewedBy;

        if (context.reviewNotes) {
          processInstance.variables.reviewNotes = context.reviewNotes;
        }

        // TODO: Notify assignee of completion
        // await notificationService.send({
        //   userId: processInstance.variables.assigneeId,
        //   type: 'task_completed',
        //   data: {
        //     taskId: processInstance.variables.taskId,
        //     title: processInstance.variables.title
        //   }
        // });

        // TODO: Update project metrics
        // TODO: Archive task
      }
    },

    // Terminal state: Task cancelled
    cancelled: {
      name: 'Cancelled',
      description: 'Task has been cancelled',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Task cancelled: ${processInstance.variables.title}`);

        processInstance.variables.cancelledAt = new Date().toISOString();
        processInstance.variables.cancelledBy = context.userId;
        processInstance.variables.cancellationReason = context.reason || 'Not specified';

        // TODO: Notify relevant parties
      }
    }
  },

  // Metadata
  metadata: {
    category: 'project-management',
    tags: ['task', 'workflow', 'project'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'assignee', 'admin', 'owner'],
      transition: {
        created_to_assigned: ['admin', 'owner'],
        assigned_to_in_progress: ['assignee', 'admin', 'owner'],
        in_progress_to_review: ['assignee', 'admin', 'owner'],
        review_to_completed: ['admin', 'owner'],
        review_to_in_progress: ['admin', 'owner'],
        any_to_cancelled: ['creator', 'admin', 'owner']
      }
    }
  }
};

export default taskWorkflowDefinition;
