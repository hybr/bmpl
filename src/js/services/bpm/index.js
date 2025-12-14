/**
 * BPM Services Index
 * Central export for all BPM-related services
 */

// Core services
export { StateMachine } from './state-machine.js';
export { processService } from './process-service.js';
export { processState } from '../../state/process-state.js';

// Process definitions
export { orderFulfillmentDefinition } from './definitions/order-fulfillment.js';

// Test utilities
export { testBPMFramework, testBPMEvents } from './test-bpm.js';

/**
 * Initialize BPM Framework
 * Registers all process definitions
 */
export function initializeBPM() {
  console.log('Initializing BPM Framework...');

  // Import and register process definitions
  import('./definitions/order-fulfillment.js').then(({ orderFulfillmentDefinition }) => {
    import('./process-service.js').then(({ processService }) => {
      processService.registerDefinition(orderFulfillmentDefinition);
      console.log('✓ BPM Framework initialized');
    });
  });
}

/**
 * Make BPM services available globally for testing
 */
export function exposeBPMGlobally() {
  if (typeof window !== 'undefined') {
    // Import services
    import('./process-service.js').then(({ processService }) => {
      window.BPM = {
        processService,
        // Import state
        get processState() {
          return import('../../state/process-state.js').then(m => m.processState);
        },
        // Test functions
        async test() {
          const { testBPMFramework } = await import('./test-bpm.js');
          return testBPMFramework();
        },
        async testEvents() {
          const { testBPMEvents } = await import('./test-bpm.js');
          return testBPMEvents();
        }
      };

      console.log('BPM services available at window.BPM');
      console.log('Run window.BPM.test() to test the framework');
    });
  }
}

export default {
  initializeBPM,
  exposeBPMGlobally
};
