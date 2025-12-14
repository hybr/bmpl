/**
 * Process Service
 * Main API for Business Process Management
 */

import { StateMachine } from './state-machine.js';
import { processState } from '../../state/process-state.js';
import { eventBus } from '../../utils/events.js';
import {
  EVENTS,
  PROCESS_STATUS,
  PROCESS_SYNC_STATUS,
  DOC_TYPES
} from '../../config/constants.js';

class ProcessService {
  constructor() {
    this.processDefinitions = new Map(); // definitionId -> definition
    this.stateMachines = new Map(); // definitionId -> StateMachine instance
  }

  /**
   * Register a process definition
   */
  registerDefinition(definition) {
    if (!definition || !definition.id) {
      throw new Error('Invalid process definition');
    }

    // Create and validate state machine
    const stateMachine = new StateMachine(definition);

    // Store definition and state machine
    this.processDefinitions.set(definition.id, definition);
    this.stateMachines.set(definition.id, stateMachine);

    console.log(`Process definition registered: ${definition.id} (${definition.name})`);

    return definition;
  }

  /**
   * Get a process definition
   */
  getDefinition(definitionId) {
    return this.processDefinitions.get(definitionId);
  }

  /**
   * Get all registered definitions
   */
  getAllDefinitions() {
    return Array.from(this.processDefinitions.values());
  }

  /**
   * Get state machine for a definition
   */
  getStateMachine(definitionId) {
    const stateMachine = this.stateMachines.get(definitionId);

    if (!stateMachine) {
      throw new Error(`No state machine found for definition: ${definitionId}`);
    }

    return stateMachine;
  }

  /**
   * Create a new process instance
   */
  async createProcess({ definitionId, type, variables = {}, metadata = {} }) {
    // Get definition and state machine
    const definition = this.getDefinition(definitionId);
    if (!definition) {
      throw new Error(`Process definition not found: ${definitionId}`);
    }

    const stateMachine = this.getStateMachine(definitionId);

    // Generate unique process ID
    const processId = this.generateProcessId(type, definitionId);

    // Create process instance
    const processInstance = {
      _id: processId,
      type: DOC_TYPES.PROCESS_INSTANCE,
      definitionId,
      processType: type,
      currentState: stateMachine.getInitialState(),
      status: PROCESS_STATUS.ACTIVE,
      variables: { ...variables },
      metadata: { ...metadata },
      stateHistory: [],
      auditLog: [],
      syncStatus: PROCESS_SYNC_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add initial audit entry
    stateMachine.addAuditEntry(processInstance, 'process_created', {
      definitionId,
      type,
      initialState: processInstance.currentState
    });

    // Execute onEnter hook for initial state
    const initialStateConfig = stateMachine.getStateConfig(processInstance.currentState);
    if (initialStateConfig.onEnter && typeof initialStateConfig.onEnter === 'function') {
      try {
        await initialStateConfig.onEnter(processInstance, variables);
      } catch (error) {
        console.error('Error executing onEnter hook for initial state:', error);
        stateMachine.addAuditEntry(processInstance, 'initial_state_hook_error', {
          error: error.message
        });
      }
    }

    // Store in state
    processState.addProcess(processInstance);

    console.log(`Process created: ${processId} (${definition.name})`);

    return processInstance;
  }

  /**
   * Transition a process to a new state
   */
  async transitionState(processId, targetState, context = {}) {
    // Get process instance
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    // Get state machine
    const stateMachine = this.getStateMachine(processInstance.definitionId);

    // Execute transition
    const updatedInstance = await stateMachine.executeTransition(
      processInstance,
      targetState,
      context
    );

    // Update state
    processState.updateProcess(processId, updatedInstance);

    console.log(`Process ${processId} transitioned: ${processInstance.currentState} -> ${targetState}`);

    return updatedInstance;
  }

  /**
   * Update process variables
   */
  updateProcessVariables(processId, variables) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    const updatedVariables = {
      ...processInstance.variables,
      ...variables
    };

    const updated = processState.updateProcess(processId, {
      variables: updatedVariables,
      syncStatus: PROCESS_SYNC_STATUS.PENDING
    });

    // Get state machine and add audit entry
    const stateMachine = this.getStateMachine(processInstance.definitionId);
    stateMachine.addAuditEntry(updated, 'variables_updated', {
      updates: variables
    });

    processState.updateProcess(processId, updated);

    return updated;
  }

  /**
   * Update process metadata
   */
  updateProcessMetadata(processId, metadata) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    const updatedMetadata = {
      ...processInstance.metadata,
      ...metadata
    };

    const updated = processState.updateProcess(processId, {
      metadata: updatedMetadata,
      syncStatus: PROCESS_SYNC_STATUS.PENDING
    });

    return updated;
  }

  /**
   * Cancel a process
   */
  async cancelProcess(processId, reason = 'Cancelled by user') {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    // Check if process is already in a terminal state
    const stateMachine = this.getStateMachine(processInstance.definitionId);
    if (stateMachine.isTerminalState(processInstance.currentState)) {
      throw new Error(`Process ${processId} is already in terminal state: ${processInstance.currentState}`);
    }

    // Try to transition to cancelled state
    try {
      await this.transitionState(processId, 'cancelled', { reason });
    } catch (error) {
      // If transition not allowed, force cancel
      const updated = processState.updateProcess(processId, {
        status: PROCESS_STATUS.CANCELLED,
        currentState: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        syncStatus: PROCESS_SYNC_STATUS.PENDING
      });

      stateMachine.addAuditEntry(updated, 'force_cancelled', { reason });
      processState.updateProcess(processId, updated);

      eventBus.emit(EVENTS.PROCESS_CANCELLED, {
        processId,
        definitionId: processInstance.definitionId,
        reason,
        timestamp: updated.cancelledAt
      });

      return updated;
    }

    return processState.getProcess(processId);
  }

  /**
   * Suspend a process
   */
  suspendProcess(processId, reason = '') {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    if (processInstance.status !== PROCESS_STATUS.ACTIVE) {
      throw new Error(`Cannot suspend process in ${processInstance.status} status`);
    }

    const updated = processState.updateProcess(processId, {
      status: PROCESS_STATUS.SUSPENDED,
      suspendedAt: new Date().toISOString(),
      suspensionReason: reason,
      syncStatus: PROCESS_SYNC_STATUS.PENDING
    });

    const stateMachine = this.getStateMachine(processInstance.definitionId);
    stateMachine.addAuditEntry(updated, 'suspended', { reason });
    processState.updateProcess(processId, updated);

    return updated;
  }

  /**
   * Resume a suspended process
   */
  resumeProcess(processId) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    if (processInstance.status !== PROCESS_STATUS.SUSPENDED) {
      throw new Error(`Process is not suspended`);
    }

    const updated = processState.updateProcess(processId, {
      status: PROCESS_STATUS.ACTIVE,
      resumedAt: new Date().toISOString(),
      syncStatus: PROCESS_SYNC_STATUS.PENDING
    });

    const stateMachine = this.getStateMachine(processInstance.definitionId);
    stateMachine.addAuditEntry(updated, 'resumed', {});
    processState.updateProcess(processId, updated);

    return updated;
  }

  /**
   * Get process by ID
   */
  getProcess(processId) {
    return processState.getProcess(processId);
  }

  /**
   * Get all processes
   */
  getAllProcesses() {
    return processState.getAllProcesses();
  }

  /**
   * Get processes by type
   */
  getProcessesByType(type) {
    return processState.getProcessesByType(type);
  }

  /**
   * Get processes by status
   */
  getProcessesByStatus(status) {
    return processState.getProcessesByStatus(status);
  }

  /**
   * Get available transitions for a process
   */
  getAvailableTransitions(processId) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    const stateMachine = this.getStateMachine(processInstance.definitionId);
    return stateMachine.getAvailableTransitions(processInstance.currentState);
  }

  /**
   * Get process history
   */
  getProcessHistory(processId) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    const stateMachine = this.getStateMachine(processInstance.definitionId);
    return stateMachine.getStateHistory(processInstance);
  }

  /**
   * Get process audit log
   */
  getProcessAuditLog(processId) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    const stateMachine = this.getStateMachine(processInstance.definitionId);
    return stateMachine.getAuditLog(processInstance);
  }

  /**
   * Get process statistics
   */
  getStatistics() {
    return processState.getStatistics();
  }

  /**
   * Generate unique process ID
   */
  generateProcessId(type, definitionId) {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 9);
    return `process_inst:${type}_${timestamp}_${random}`;
  }

  /**
   * Clear all processes (for testing/reset)
   */
  clearAll() {
    processState.clear();
  }
}

// Create singleton instance
export const processService = new ProcessService();

export default processService;
