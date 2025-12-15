/**
 * BPM Services Index
 * Central export for all BPM-related services
 */

// Core services
export { StateMachine } from './state-machine.js';
export { processService } from './process-service.js';
export { processState } from '../../state/process-state.js';

// Phase 2 services
export { processPersistence } from './process-persistence.js';
export { processSync } from './process-sync.js';
export { conditionEvaluator } from './condition-evaluator.js';
export { transitionEngine } from './transition-engine.js';
export { taskService } from './task-service.js';

// Process definitions
export { orderFulfillmentDefinition } from './definitions/order-fulfillment.js';
export { jobApplicationDefinition } from './definitions/job-application.js';
export { taskWorkflowDefinition } from './definitions/task-workflow.js';

// Test utilities
export { testBPMFramework, testBPMEvents } from './test-bpm.js';

/**
 * Initialize BPM Framework
 * Registers all process definitions and initializes engines
 */
export async function initializeBPM(options = {}) {
  console.log('Initializing BPM Framework...');

  try {
    // Import all services
    const { processService } = await import('./process-service.js');
    const { transitionEngine } = await import('./transition-engine.js');

    // Register process definitions
    const { orderFulfillmentDefinition } = await import('./definitions/order-fulfillment.js');
    const { jobApplicationDefinition } = await import('./definitions/job-application.js');
    const { taskWorkflowDefinition } = await import('./definitions/task-workflow.js');

    processService.registerDefinition(orderFulfillmentDefinition);
    processService.registerDefinition(jobApplicationDefinition);
    processService.registerDefinition(taskWorkflowDefinition);

    console.log('✓ Process definitions registered');

    // Initialize transition engine
    if (options.enableAutoTransitions !== false) {
      transitionEngine.initialize();
      console.log('✓ Transition engine initialized');
    }

    // Initialize sync if organization is provided
    if (options.orgId) {
      const { processSync } = await import('./process-sync.js');
      await processSync.initialize(
        options.orgId,
        options.remoteUrl,
        options.credentials
      );
      console.log('✓ Process sync initialized');
    }

    console.log('✓ BPM Framework initialized successfully');

    return {
      success: true,
      message: 'BPM Framework initialized'
    };
  } catch (error) {
    console.error('Failed to initialize BPM Framework:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Make BPM services available globally for testing
 */
export function exposeBPMGlobally() {
  if (typeof window !== 'undefined') {
    // Import services
    import('./process-service.js').then(async ({ processService }) => {
      const { processState } = await import('../../state/process-state.js');
      const { processSync } = await import('./process-sync.js');
      const { transitionEngine } = await import('./transition-engine.js');
      const { taskService } = await import('./task-service.js');
      const { conditionEvaluator } = await import('./condition-evaluator.js');

      window.BPM = {
        // Services
        processService,
        processState,
        processSync,
        transitionEngine,
        taskService,
        conditionEvaluator,

        // Initialization
        async init(options) {
          return initializeBPM(options);
        },

        // Test functions
        async test() {
          const { testBPMFramework } = await import('./test-bpm.js');
          return testBPMFramework();
        },
        async testEvents() {
          const { testBPMEvents } = await import('./test-bpm.js');
          return testBPMEvents();
        },

        // Utility functions
        async createOrder(orderData) {
          return processService.createProcess({
            definitionId: 'order_fulfillment_v1',
            type: 'order',
            variables: orderData
          });
        },

        async createJobApplication(applicationData) {
          return processService.createProcess({
            definitionId: 'job_application_v1',
            type: 'job_application',
            variables: applicationData
          });
        },

        async createTask(taskData) {
          return processService.createProcess({
            definitionId: 'task_workflow_v1',
            type: 'task',
            variables: taskData
          });
        }
      };

      console.log('BPM services available at window.BPM');
      console.log('Commands:');
      console.log('  window.BPM.init(options) - Initialize framework');
      console.log('  window.BPM.test() - Run tests');
      console.log('  window.BPM.createOrder(data) - Create order process');
      console.log('  window.BPM.createJobApplication(data) - Create job application');
      console.log('  window.BPM.createTask(data) - Create task');
    });
  }
}

export default {
  initializeBPM,
  exposeBPMGlobally
};
