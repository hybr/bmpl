/**
 * Transition Engine
 * Handles automatic transitions based on timers, events, and conditions
 */

import { processState } from '../../state/process-state.js';
import { processService } from './process-service.js';
import { conditionEvaluator } from './condition-evaluator.js';
import { eventBus } from '../../utils/events.js';
import { EVENTS } from '../../config/constants.js';

class TransitionEngine {
  constructor() {
    this.timers = new Map(); // processId -> timer info
    this.eventListeners = new Map(); // processId -> event listeners
    this.checkInterval = null;
    this.checkIntervalMs = 60000; // Check every minute
  }

  /**
   * Initialize transition engine
   */
  initialize() {
    // Start periodic check for auto-transitions
    this.startPeriodicCheck();

    // Listen to process state changes
    eventBus.on(EVENTS.PROCESS_STATE_CHANGED, (data) => {
      this.onProcessStateChanged(data);
    });

    console.log('Transition engine initialized');
  }

  /**
   * Handle process state change
   */
  async onProcessStateChanged(data) {
    const { processId, to } = data;

    try {
      // Cancel timers for old state
      this.cancelTimers(processId);
      this.removeEventListeners(processId);

      // Get process instance
      const processInstance = processState.getProcess(processId);
      if (!processInstance) {
        return;
      }

      // Get state machine
      const stateMachine = processService.getStateMachine(processInstance.definitionId);
      const stateConfig = stateMachine.getStateConfig(to);

      // Check if state has auto-transition config
      if (!stateConfig.autoTransition) {
        return;
      }

      // Setup auto-transitions for new state
      await this.setupAutoTransitions(processInstance, stateConfig.autoTransition);

    } catch (error) {
      console.error('Error handling process state change:', error);
    }
  }

  /**
   * Setup auto-transitions for a process state
   */
  async setupAutoTransitions(processInstance, autoTransitionConfig) {
    const { conditions } = autoTransitionConfig;

    if (!conditions || !Array.isArray(conditions)) {
      return;
    }

    for (const condition of conditions) {
      switch (condition.type) {
        case 'timer':
          this.setupTimerTransition(processInstance, condition);
          break;

        case 'immediate':
          await this.executeImmediateTransition(processInstance, condition);
          break;

        case 'event':
          this.setupEventTransition(processInstance, condition);
          break;

        case 'condition':
          // Condition-based transitions are checked periodically
          this.setupConditionTransition(processInstance, condition);
          break;

        default:
          console.warn(`Unknown auto-transition type: ${condition.type}`);
      }
    }
  }

  /**
   * Setup timer-based transition
   */
  setupTimerTransition(processInstance, condition) {
    const { duration, toState, reason } = condition;

    if (!duration || !toState) {
      console.warn('Timer transition requires duration and toState');
      return;
    }

    // Calculate when timer should fire
    const now = Date.now();
    const stateEnteredAt = processInstance.stateHistory.length > 0
      ? new Date(processInstance.stateHistory[processInstance.stateHistory.length - 1].timestamp).getTime()
      : new Date(processInstance.createdAt).getTime();

    const fireAt = stateEnteredAt + duration;
    const delay = fireAt - now;

    if (delay <= 0) {
      // Timer already expired, transition immediately
      this.executeTimerTransition(processInstance._id, toState, reason);
      return;
    }

    // Setup timer
    const timerId = setTimeout(() => {
      this.executeTimerTransition(processInstance._id, toState, reason);
    }, delay);

    // Store timer info
    const timerInfo = {
      timerId,
      processId: processInstance._id,
      toState,
      reason,
      fireAt,
      condition
    };

    this.timers.set(processInstance._id, timerInfo);

    console.log(
      `Timer set for process ${processInstance._id}: ` +
      `${toState} in ${Math.round(delay / 1000)}s`
    );
  }

  /**
   * Execute timer-based transition
   */
  async executeTimerTransition(processId, toState, reason) {
    try {
      console.log(`Executing timer transition: ${processId} -> ${toState}`);

      // Check if process still exists and is in correct state
      const processInstance = processState.getProcess(processId);
      if (!processInstance) {
        console.warn(`Process ${processId} not found, skipping timer transition`);
        return;
      }

      // Verify process is still in expected state
      const stateMachine = processService.getStateMachine(processInstance.definitionId);
      const canTransition = stateMachine.canTransition(processInstance.currentState, toState);

      if (!canTransition.valid) {
        console.warn(
          `Cannot execute timer transition for ${processId}: ${canTransition.reason}`
        );
        return;
      }

      // Execute transition
      await processService.transitionState(processId, toState, {
        trigger: 'timer',
        reason: reason || 'Auto-transition by timer'
      });

      console.log(`✓ Timer transition completed: ${processId} -> ${toState}`);

    } catch (error) {
      console.error('Error executing timer transition:', error);
    } finally {
      // Clean up timer
      this.timers.delete(processId);
    }
  }

  /**
   * Execute immediate transition
   */
  async executeImmediateTransition(processInstance, condition) {
    const { toState } = condition;

    if (!toState) {
      console.warn('Immediate transition requires toState');
      return;
    }

    try {
      // Use setTimeout to avoid blocking
      setTimeout(async () => {
        // Check if transition is still valid
        const currentProcess = processState.getProcess(processInstance._id);
        if (!currentProcess) {
          return;
        }

        const stateMachine = processService.getStateMachine(currentProcess.definitionId);
        const canTransition = stateMachine.canTransition(currentProcess.currentState, toState);

        if (canTransition.valid) {
          await processService.transitionState(currentProcess._id, toState, {
            trigger: 'immediate',
            reason: 'Auto-transition (immediate)'
          });
        }
      }, 100); // Small delay to avoid recursion
    } catch (error) {
      console.error('Error executing immediate transition:', error);
    }
  }

  /**
   * Setup event-based transition
   */
  setupEventTransition(processInstance, condition) {
    const { event, toState, conditions: eventConditions } = condition;

    if (!event || !toState) {
      console.warn('Event transition requires event and toState');
      return;
    }

    // Create event listener
    const listener = async (eventData) => {
      try {
        // Get current process state
        const currentProcess = processState.getProcess(processInstance._id);
        if (!currentProcess) {
          return;
        }

        // Check if event conditions match
        if (eventConditions && eventConditions.length > 0) {
          const conditionsMet = conditionEvaluator.evaluateConditions(
            eventConditions,
            currentProcess,
            eventData
          );

          if (!conditionsMet) {
            return;
          }
        }

        // Execute transition
        await processService.transitionState(currentProcess._id, toState, {
          trigger: 'event',
          event: event,
          eventData: eventData
        });

      } catch (error) {
        console.error('Error executing event transition:', error);
      }
    };

    // Register listener
    const unsubscribe = eventBus.on(event, listener);

    // Store listener info
    if (!this.eventListeners.has(processInstance._id)) {
      this.eventListeners.set(processInstance._id, []);
    }

    this.eventListeners.get(processInstance._id).push({
      event,
      listener,
      unsubscribe
    });

    console.log(`Event listener registered for process ${processInstance._id}: ${event}`);
  }

  /**
   * Setup condition-based transition
   */
  setupConditionTransition(processInstance, condition) {
    const { toState, conditions: transitionConditions, checkInterval } = condition;

    if (!toState || !transitionConditions) {
      console.warn('Condition transition requires toState and conditions');
      return;
    }

    // Conditions are checked during periodic check
    // Just log for now
    console.log(`Condition-based transition setup for process ${processInstance._id}`);
  }

  /**
   * Cancel timers for a process
   */
  cancelTimers(processId) {
    const timerInfo = this.timers.get(processId);
    if (timerInfo) {
      clearTimeout(timerInfo.timerId);
      this.timers.delete(processId);
      console.log(`Timer cancelled for process ${processId}`);
    }
  }

  /**
   * Remove event listeners for a process
   */
  removeEventListeners(processId) {
    const listeners = this.eventListeners.get(processId);
    if (listeners) {
      listeners.forEach(({ event, unsubscribe }) => {
        unsubscribe();
        console.log(`Event listener removed for process ${processId}: ${event}`);
      });
      this.eventListeners.delete(processId);
    }
  }

  /**
   * Start periodic check for condition-based transitions
   */
  startPeriodicCheck() {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(() => {
      this.checkConditionTransitions();
    }, this.checkIntervalMs);

    console.log(`Periodic condition check started (every ${this.checkIntervalMs}ms)`);
  }

  /**
   * Stop periodic check
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Periodic condition check stopped');
    }
  }

  /**
   * Check all processes for condition-based transitions
   */
  async checkConditionTransitions() {
    try {
      const activeProcesses = processState.getActiveProcesses();

      for (const processInstance of activeProcesses) {
        await this.checkProcessConditions(processInstance);
      }
    } catch (error) {
      console.error('Error checking condition transitions:', error);
    }
  }

  /**
   * Check conditions for a specific process
   */
  async checkProcessConditions(processInstance) {
    try {
      // Get state machine and current state config
      const stateMachine = processService.getStateMachine(processInstance.definitionId);
      const stateConfig = stateMachine.getStateConfig(processInstance.currentState);

      if (!stateConfig.autoTransition) {
        return;
      }

      // Find matching condition-based transition
      const match = conditionEvaluator.findMatchingAutoTransition(
        stateConfig.autoTransition,
        processInstance
      );

      if (match) {
        console.log(
          `Condition met for process ${processInstance._id}: transitioning to ${match.toState}`
        );

        await processService.transitionState(processInstance._id, match.toState, {
          trigger: 'condition',
          reason: 'Auto-transition by condition'
        });
      }
    } catch (error) {
      console.error('Error checking process conditions:', error);
    }
  }

  /**
   * Get active timers
   */
  getActiveTimers() {
    return Array.from(this.timers.values());
  }

  /**
   * Get active event listeners
   */
  getActiveEventListeners() {
    const result = [];

    this.eventListeners.forEach((listeners, processId) => {
      listeners.forEach(({ event }) => {
        result.push({ processId, event });
      });
    });

    return result;
  }

  /**
   * Cleanup - cancel all timers and listeners
   */
  cleanup() {
    // Cancel all timers
    this.timers.forEach((timerInfo) => {
      clearTimeout(timerInfo.timerId);
    });
    this.timers.clear();

    // Remove all event listeners
    this.eventListeners.forEach((listeners) => {
      listeners.forEach(({ unsubscribe }) => {
        unsubscribe();
      });
    });
    this.eventListeners.clear();

    // Stop periodic check
    this.stopPeriodicCheck();

    console.log('Transition engine cleanup completed');
  }

  /**
   * Set check interval
   */
  setCheckInterval(milliseconds) {
    this.checkIntervalMs = milliseconds;

    // Restart periodic check with new interval
    if (this.checkInterval) {
      this.stopPeriodicCheck();
      this.startPeriodicCheck();
    }

    console.log(`Condition check interval set to ${milliseconds}ms`);
  }
}

// Create singleton instance
export const transitionEngine = new TransitionEngine();

export default transitionEngine;
