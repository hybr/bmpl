/**
 * Task Service
 * Manages user tasks and approvals within business processes
 */

import { processState } from '../../state/process-state.js';
import { processService } from './process-service.js';
import { conditionEvaluator } from './condition-evaluator.js';
import { eventBus } from '../../utils/events.js';
import { hasPermission } from '../../utils/helpers.js';
import { EVENTS, DOC_TYPES } from '../../config/constants.js';

class TaskService {
  constructor() {
    this.tasks = new Map(); // taskId -> task
  }

  /**
   * Get tasks for a process
   */
  getProcessTasks(processId) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    // Get state machine
    const stateMachine = processService.getStateMachine(processInstance.definitionId);
    const stateConfig = stateMachine.getStateConfig(processInstance.currentState);

    if (!stateConfig.requiredActions) {
      return [];
    }

    // Generate tasks from required actions
    return stateConfig.requiredActions.map((action, index) => {
      const taskId = `${processId}_${processInstance.currentState}_${index}`;

      return {
        id: taskId,
        processId: processId,
        processType: processInstance.processType,
        definitionId: processInstance.definitionId,
        currentState: processInstance.currentState,
        type: action.type,
        role: action.role,
        message: action.message,
        actionLabel: action.actionLabel || 'Complete',
        metadata: action.metadata || {},
        createdAt: processInstance.updatedAt,
        status: 'pending'
      };
    });
  }

  /**
   * Get all pending tasks for a user
   */
  getUserTasks(userId, userRole = null) {
    const allProcesses = processState.getActiveProcesses();
    const userTasks = [];

    for (const processInstance of allProcesses) {
      // Check if process belongs to user or user has role to access
      const canAccess = this.canUserAccessProcess(processInstance, userId, userRole);

      if (!canAccess) {
        continue;
      }

      // Get tasks for this process
      const processTasks = this.getProcessTasks(processInstance._id);

      // Filter tasks by user role
      const filteredTasks = processTasks.filter(task => {
        if (!task.role) {
          return true; // No role restriction
        }

        if (!userRole) {
          return false; // User has no role
        }

        // Check if user has required permission
        return hasPermission(userRole, task.role);
      });

      userTasks.push(...filteredTasks);
    }

    return userTasks;
  }

  /**
   * Get tasks by type
   */
  getTasksByType(taskType) {
    const allProcesses = processState.getActiveProcesses();
    const tasks = [];

    for (const processInstance of allProcesses) {
      const processTasks = this.getProcessTasks(processInstance._id);

      const filteredTasks = processTasks.filter(task => task.type === taskType);

      tasks.push(...filteredTasks);
    }

    return tasks;
  }

  /**
   * Get a specific task
   */
  getTask(taskId) {
    // Parse task ID to get process ID
    const parts = taskId.split('_');
    if (parts.length < 3) {
      throw new Error(`Invalid task ID: ${taskId}`);
    }

    const processId = parts.slice(0, -2).join('_');
    const processTasks = this.getProcessTasks(processId);

    return processTasks.find(task => task.id === taskId);
  }

  /**
   * Complete a task
   */
  async completeTask(taskId, userId, userRole, data = {}) {
    try {
      // Get task
      const task = this.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Verify user has permission
      if (task.role && userRole) {
        const hasPermissionToComplete = hasPermission(userRole, task.role);
        if (!hasPermissionToComplete) {
          throw new Error(`User does not have permission to complete this task`);
        }
      }

      // Get process instance
      const processInstance = processState.getProcess(task.processId);
      if (!processInstance) {
        throw new Error(`Process not found: ${task.processId}`);
      }

      // Execute task based on type
      let result;

      switch (task.type) {
        case 'approval':
          result = await this.handleApprovalTask(task, processInstance, userId, data);
          break;

        case 'manual':
          result = await this.handleManualTask(task, processInstance, userId, data);
          break;

        case 'form':
          result = await this.handleFormTask(task, processInstance, userId, data);
          break;

        case 'review':
          result = await this.handleReviewTask(task, processInstance, userId, data);
          break;

        default:
          result = await this.handleGenericTask(task, processInstance, userId, data);
      }

      // Emit task completed event
      eventBus.emit(EVENTS.PROCESS_UPDATED, {
        processId: task.processId,
        taskId: taskId,
        taskType: task.type,
        completedBy: userId,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  /**
   * Handle approval task
   */
  async handleApprovalTask(task, processInstance, userId, data) {
    const { approved, reason } = data;

    if (approved === undefined) {
      throw new Error('Approval task requires "approved" field');
    }

    // Update process variables
    processService.updateProcessVariables(processInstance._id, {
      [`${task.currentState}_approved`]: approved,
      [`${task.currentState}_approvedBy`]: userId,
      [`${task.currentState}_approvalReason`]: reason || '',
      [`${task.currentState}_approvedAt`]: new Date().toISOString()
    });

    // Determine next state based on approval
    const stateMachine = processService.getStateMachine(processInstance.definitionId);
    const availableTransitions = stateMachine.getAvailableTransitions(processInstance.currentState);

    if (approved) {
      // Find approved transition (usually the first non-cancelled transition)
      const approvedTransition = availableTransitions.find(
        t => t.targetState !== 'cancelled'
      );

      if (approvedTransition) {
        await processService.transitionState(
          processInstance._id,
          approvedTransition.targetState,
          {
            approvedBy: userId,
            approved: true,
            reason: reason
          }
        );
      }
    } else {
      // Find rejected/cancelled transition
      const rejectedTransition = availableTransitions.find(
        t => t.targetState === 'cancelled' || t.targetState === 'rejected'
      );

      if (rejectedTransition) {
        await processService.transitionState(
          processInstance._id,
          rejectedTransition.targetState,
          {
            rejectedBy: userId,
            approved: false,
            reason: reason
          }
        );
      }
    }

    return {
      success: true,
      approved: approved,
      message: approved ? 'Approved successfully' : 'Rejected'
    };
  }

  /**
   * Handle manual task
   */
  async handleManualTask(task, processInstance, userId, data) {
    // Update process variables with task completion data
    processService.updateProcessVariables(processInstance._id, {
      [`${task.currentState}_completed`]: true,
      [`${task.currentState}_completedBy`]: userId,
      [`${task.currentState}_completedAt`]: new Date().toISOString(),
      ...data
    });

    // Transition to next state
    const stateMachine = processService.getStateMachine(processInstance.definitionId);
    const availableTransitions = stateMachine.getAvailableTransitions(processInstance.currentState);

    if (availableTransitions.length > 0) {
      // Take first available transition
      const nextTransition = availableTransitions[0];

      await processService.transitionState(
        processInstance._id,
        nextTransition.targetState,
        {
          completedBy: userId,
          ...data
        }
      );
    }

    return {
      success: true,
      message: 'Task completed successfully'
    };
  }

  /**
   * Handle form task
   */
  async handleFormTask(task, processInstance, userId, data) {
    // Validate form data if validation rules exist
    if (task.metadata && task.metadata.validation) {
      const validationResult = this.validateFormData(data, task.metadata.validation);

      if (!validationResult.valid) {
        throw new Error(`Form validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    // Update process variables with form data
    processService.updateProcessVariables(processInstance._id, {
      [`${task.currentState}_formData`]: data,
      [`${task.currentState}_submittedBy`]: userId,
      [`${task.currentState}_submittedAt`]: new Date().toISOString()
    });

    // Transition to next state
    const stateMachine = processService.getStateMachine(processInstance.definitionId);
    const availableTransitions = stateMachine.getAvailableTransitions(processInstance.currentState);

    if (availableTransitions.length > 0) {
      await processService.transitionState(
        processInstance._id,
        availableTransitions[0].targetState,
        {
          submittedBy: userId,
          formData: data
        }
      );
    }

    return {
      success: true,
      message: 'Form submitted successfully'
    };
  }

  /**
   * Handle review task
   */
  async handleReviewTask(task, processInstance, userId, data) {
    const { decision, comments } = data;

    if (!decision) {
      throw new Error('Review task requires "decision" field');
    }

    // Update process variables
    processService.updateProcessVariables(processInstance._id, {
      [`${task.currentState}_decision`]: decision,
      [`${task.currentState}_comments`]: comments || '',
      [`${task.currentState}_reviewedBy`]: userId,
      [`${task.currentState}_reviewedAt`]: new Date().toISOString()
    });

    // Determine next state based on decision
    const stateMachine = processService.getStateMachine(processInstance.definitionId);
    const availableTransitions = stateMachine.getAvailableTransitions(processInstance.currentState);

    // Find matching transition based on decision
    const transition = availableTransitions.find(t =>
      t.targetState.toLowerCase().includes(decision.toLowerCase())
    ) || availableTransitions[0];

    if (transition) {
      await processService.transitionState(
        processInstance._id,
        transition.targetState,
        {
          reviewedBy: userId,
          decision: decision,
          comments: comments
        }
      );
    }

    return {
      success: true,
      decision: decision,
      message: 'Review completed successfully'
    };
  }

  /**
   * Handle generic task
   */
  async handleGenericTask(task, processInstance, userId, data) {
    // Simply update variables and transition
    processService.updateProcessVariables(processInstance._id, {
      [`${task.currentState}_data`]: data,
      [`${task.currentState}_completedBy`]: userId,
      [`${task.currentState}_completedAt`]: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Task completed'
    };
  }

  /**
   * Validate form data
   */
  validateFormData(data, validationRules) {
    const errors = [];

    for (const [field, rules] of Object.entries(validationRules)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (rules.type && value !== undefined) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }
      }

      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }

      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push(`${field} has invalid format`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Check if user can access process
   */
  canUserAccessProcess(processInstance, userId, userRole) {
    // Check if process variables contain user references
    const { buyerId, sellerId, assignedTo, createdBy } = processInstance.variables;

    if (buyerId === userId || sellerId === userId || assignedTo === userId || createdBy === userId) {
      return true;
    }

    // Check metadata
    if (processInstance.metadata && processInstance.metadata.createdBy === userId) {
      return true;
    }

    // Check if user has admin/owner role
    if (userRole && (userRole === 'owner' || userRole === 'admin')) {
      return true;
    }

    return false;
  }

  /**
   * Get task statistics
   */
  getTaskStatistics(userId = null, userRole = null) {
    const tasks = userId
      ? this.getUserTasks(userId, userRole)
      : this.getAllTasks();

    const stats = {
      total: tasks.length,
      byType: {},
      byProcess: {}
    };

    tasks.forEach(task => {
      // Count by type
      stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;

      // Count by process type
      stats.byProcess[task.processType] = (stats.byProcess[task.processType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get all tasks (across all processes)
   */
  getAllTasks() {
    const allProcesses = processState.getActiveProcesses();
    const allTasks = [];

    for (const processInstance of allProcesses) {
      const processTasks = this.getProcessTasks(processInstance._id);
      allTasks.push(...processTasks);
    }

    return allTasks;
  }
}

// Create singleton instance
export const taskService = new TaskService();

export default taskService;
