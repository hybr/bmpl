/**
 * State Machine
 * Core engine for managing process states and transitions
 */

import { eventBus } from '../../utils/events.js';
import { EVENTS, PROCESS_STATUS } from '../../config/constants.js';

export class StateMachine {
  constructor(processDefinition) {
    if (!processDefinition) {
      throw new Error('Process definition is required');
    }

    this.definition = processDefinition;
    this.validateDefinition();
  }

  /**
   * Validate process definition structure
   */
  validateDefinition() {
    const { id, name, type, initialState, states } = this.definition;

    if (!id || !name || !type) {
      throw new Error('Process definition must have id, name, and type');
    }

    if (!initialState) {
      throw new Error('Process definition must have an initialState');
    }

    if (!states || typeof states !== 'object') {
      throw new Error('Process definition must have states object');
    }

    if (!states[initialState]) {
      throw new Error(`Initial state "${initialState}" not found in states definition`);
    }

    // Validate each state
    Object.entries(states).forEach(([stateName, stateConfig]) => {
      this.validateState(stateName, stateConfig);
    });
  }

  /**
   * Validate individual state configuration
   */
  validateState(stateName, stateConfig) {
    if (!stateConfig.transitions || !Array.isArray(stateConfig.transitions)) {
      throw new Error(`State "${stateName}" must have a transitions array`);
    }

    // Validate that each transition target exists
    stateConfig.transitions.forEach(targetState => {
      if (!this.definition.states[targetState]) {
        throw new Error(`State "${stateName}" has invalid transition to "${targetState}"`);
      }
    });
  }

  /**
   * Check if transition is valid
   */
  canTransition(currentState, targetState) {
    const state = this.definition.states[currentState];

    if (!state) {
      return {
        valid: false,
        reason: `Current state "${currentState}" does not exist`
      };
    }

    if (!state.transitions.includes(targetState)) {
      return {
        valid: false,
        reason: `Transition from "${currentState}" to "${targetState}" is not allowed`
      };
    }

    return { valid: true };
  }

  /**
   * Execute state transition
   */
  async executeTransition(processInstance, targetState, context = {}) {
    const currentState = processInstance.currentState;

    // Validate transition
    const validation = this.canTransition(currentState, targetState);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const currentStateConfig = this.definition.states[currentState];
    const targetStateConfig = this.definition.states[targetState];

    try {
      // Execute onExit hook for current state
      if (currentStateConfig.onExit && typeof currentStateConfig.onExit === 'function') {
        await currentStateConfig.onExit(processInstance, context);
      }

      // Record transition in history
      const transition = {
        from: currentState,
        to: targetState,
        timestamp: new Date().toISOString(),
        context: context
      };

      // Update process instance
      const previousState = processInstance.currentState;
      processInstance.currentState = targetState;
      processInstance.stateHistory = processInstance.stateHistory || [];
      processInstance.stateHistory.push(transition);
      processInstance.updatedAt = new Date().toISOString();

      // Execute onEnter hook for target state
      if (targetStateConfig.onEnter && typeof targetStateConfig.onEnter === 'function') {
        await targetStateConfig.onEnter(processInstance, context);
      }

      // Emit state changed event
      eventBus.emit(EVENTS.PROCESS_STATE_CHANGED, {
        processId: processInstance._id,
        definitionId: processInstance.definitionId,
        from: previousState,
        to: targetState,
        timestamp: transition.timestamp,
        context: context
      });

      // Check if this is a terminal state (completed, cancelled, failed)
      const terminalStates = ['completed', 'cancelled', 'failed'];
      if (terminalStates.includes(targetState)) {
        processInstance.status = targetState;
        processInstance.completedAt = new Date().toISOString();

        // Emit completion event
        const eventMap = {
          completed: EVENTS.PROCESS_COMPLETED,
          cancelled: EVENTS.PROCESS_CANCELLED,
          failed: EVENTS.PROCESS_FAILED
        };

        if (eventMap[targetState]) {
          eventBus.emit(eventMap[targetState], {
            processId: processInstance._id,
            definitionId: processInstance.definitionId,
            timestamp: processInstance.completedAt
          });
        }
      }

      // Check for auto-transitions
      await this.checkAutoTransitions(processInstance, context);

      return processInstance;
    } catch (error) {
      // Record error in audit log
      processInstance.auditLog = processInstance.auditLog || [];
      processInstance.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'transition_error',
        from: currentState,
        to: targetState,
        error: error.message,
        context: context
      });

      throw error;
    }
  }

  /**
   * Check and execute auto-transitions if configured
   */
  async checkAutoTransitions(processInstance, context = {}) {
    const currentState = processInstance.currentState;
    const stateConfig = this.definition.states[currentState];

    if (!stateConfig.autoTransition) {
      return;
    }

    const { conditions } = stateConfig.autoTransition;

    if (!conditions || !Array.isArray(conditions)) {
      return;
    }

    // For now, we'll just log auto-transition conditions
    // Full implementation will be in TransitionEngine (Phase 2)
    console.log(`Auto-transition conditions found for state "${currentState}":`, conditions);

    // TODO: Implement in Phase 2 with ConditionEvaluator
    // - Timer-based transitions
    // - Condition-based transitions
    // - Event-driven transitions
  }

  /**
   * Get available transitions from current state
   */
  getAvailableTransitions(currentState) {
    const state = this.definition.states[currentState];

    if (!state) {
      return [];
    }

    return state.transitions.map(targetState => ({
      targetState,
      targetStateConfig: this.definition.states[targetState]
    }));
  }

  /**
   * Get state configuration
   */
  getStateConfig(stateName) {
    return this.definition.states[stateName];
  }

  /**
   * Get initial state
   */
  getInitialState() {
    return this.definition.initialState;
  }

  /**
   * Get process definition
   */
  getDefinition() {
    return this.definition;
  }

  /**
   * Check if state is terminal (process complete)
   */
  isTerminalState(stateName) {
    const terminalStates = ['completed', 'cancelled', 'failed'];
    return terminalStates.includes(stateName);
  }

  /**
   * Get state history for a process instance
   */
  getStateHistory(processInstance) {
    return processInstance.stateHistory || [];
  }

  /**
   * Get audit log for a process instance
   */
  getAuditLog(processInstance) {
    return processInstance.auditLog || [];
  }

  /**
   * Add audit log entry
   */
  addAuditEntry(processInstance, action, details = {}) {
    processInstance.auditLog = processInstance.auditLog || [];
    processInstance.auditLog.push({
      timestamp: new Date().toISOString(),
      action,
      ...details
    });

    return processInstance;
  }
}

export default StateMachine;
