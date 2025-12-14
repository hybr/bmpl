/**
 * BPM Framework Test
 * Test the basic functionality of the BPM framework
 */

import { processService } from './process-service.js';
import { processState } from '../../state/process-state.js';
import { orderFulfillmentDefinition } from './definitions/order-fulfillment.js';
import { eventBus } from '../../utils/events.js';
import { EVENTS, PROCESS_STATUS } from '../../config/constants.js';

/**
 * Test BPM Framework
 */
export async function testBPMFramework() {
  console.log('=== Testing BPM Framework ===\n');

  try {
    // Step 1: Register process definition
    console.log('1. Registering order fulfillment process definition...');
    processService.registerDefinition(orderFulfillmentDefinition);
    console.log('✓ Process definition registered\n');

    // Step 2: Create a new order process
    console.log('2. Creating new order process...');
    const orderProcess = await processService.createProcess({
      definitionId: 'order_fulfillment_v1',
      type: 'order',
      variables: {
        orderId: 'ORD-12345',
        buyerId: 'user_001',
        sellerId: 'user_002',
        productId: 'prod_456',
        productName: 'Handmade Pottery',
        quantity: 1,
        amount: 45.00,
        currency: 'USD'
      },
      metadata: {
        source: 'marketplace',
        createdBy: 'user_001'
      }
    });

    console.log(`✓ Order process created: ${orderProcess._id}`);
    console.log(`  Current state: ${orderProcess.currentState}`);
    console.log(`  Status: ${orderProcess.status}\n`);

    // Step 3: Get available transitions
    console.log('3. Getting available transitions...');
    const transitions = processService.getAvailableTransitions(orderProcess._id);
    console.log(`✓ Available transitions from "${orderProcess.currentState}":`);
    transitions.forEach(t => console.log(`  - ${t.targetState}`));
    console.log('');

    // Step 4: Transition to confirmed
    console.log('4. Transitioning to "confirmed" state...');
    await processService.transitionState(orderProcess._id, 'confirmed', {
      confirmedBy: 'user_002',
      confirmedAt: new Date().toISOString()
    });
    const confirmedProcess = processState.getProcess(orderProcess._id);
    console.log(`✓ State transitioned: ${confirmedProcess.currentState}`);
    console.log(`  History entries: ${confirmedProcess.stateHistory.length}\n`);

    // Step 5: Transition to processing
    console.log('5. Transitioning to "processing" state...');
    await processService.transitionState(orderProcess._id, 'processing', {
      processedBy: 'user_002'
    });
    const processingProcess = processState.getProcess(orderProcess._id);
    console.log(`✓ State transitioned: ${processingProcess.currentState}\n`);

    // Step 6: Update process variables
    console.log('6. Updating process variables...');
    processService.updateProcessVariables(orderProcess._id, {
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    const updatedProcess = processState.getProcess(orderProcess._id);
    console.log(`✓ Variables updated`);
    console.log(`  Estimated delivery: ${updatedProcess.variables.estimatedDeliveryDate}\n`);

    // Step 7: Transition to shipped
    console.log('7. Transitioning to "shipped" state...');
    await processService.transitionState(orderProcess._id, 'shipped', {
      trackingNumber: 'TRACK-123456789',
      shippedBy: 'user_002'
    });
    const shippedProcess = processState.getProcess(orderProcess._id);
    console.log(`✓ State transitioned: ${shippedProcess.currentState}`);
    console.log(`  Tracking: ${shippedProcess.variables.trackingNumber}\n`);

    // Step 8: Get process history
    console.log('8. Getting process history...');
    const history = processService.getProcessHistory(orderProcess._id);
    console.log(`✓ Process history (${history.length} transitions):`);
    history.forEach(h => {
      console.log(`  ${h.from} → ${h.to} at ${new Date(h.timestamp).toLocaleTimeString()}`);
    });
    console.log('');

    // Step 9: Get audit log
    console.log('9. Getting audit log...');
    const auditLog = processService.getProcessAuditLog(orderProcess._id);
    console.log(`✓ Audit log (${auditLog.length} entries):`);
    auditLog.forEach(entry => {
      console.log(`  [${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.action}`);
    });
    console.log('');

    // Step 10: Get statistics
    console.log('10. Getting process statistics...');
    const stats = processService.getStatistics();
    console.log(`✓ Statistics:`);
    console.log(`  Total processes: ${stats.total}`);
    console.log(`  Active: ${stats.active}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Cancelled: ${stats.cancelled}\n`);

    // Step 11: Get processes by type
    console.log('11. Getting processes by type...');
    const orderProcesses = processService.getProcessesByType('order');
    console.log(`✓ Found ${orderProcesses.length} order process(es)\n`);

    // Step 12: Test suspend/resume
    console.log('12. Testing suspend/resume...');
    processService.suspendProcess(orderProcess._id, 'Testing suspend functionality');
    const suspendedProcess = processState.getProcess(orderProcess._id);
    console.log(`✓ Process suspended: ${suspendedProcess.status}`);

    processService.resumeProcess(orderProcess._id);
    const resumedProcess = processState.getProcess(orderProcess._id);
    console.log(`✓ Process resumed: ${resumedProcess.status}\n`);

    // Step 13: Create another order to test cancellation
    console.log('13. Testing order cancellation...');
    const orderProcess2 = await processService.createProcess({
      definitionId: 'order_fulfillment_v1',
      type: 'order',
      variables: {
        orderId: 'ORD-12346',
        buyerId: 'user_003',
        sellerId: 'user_002',
        productId: 'prod_789',
        productName: 'Organic Honey',
        quantity: 2,
        amount: 24.00
      }
    });
    console.log(`✓ Second order created: ${orderProcess2._id}`);

    await processService.cancelProcess(orderProcess2._id, 'Customer requested cancellation');
    const cancelledProcess = processState.getProcess(orderProcess2._id);
    console.log(`✓ Order cancelled: ${cancelledProcess.currentState}`);
    console.log(`  Status: ${cancelledProcess.status}\n`);

    // Final statistics
    console.log('14. Final statistics...');
    const finalStats = processService.getStatistics();
    console.log(`✓ Final Statistics:`);
    console.log(`  Total processes: ${finalStats.total}`);
    console.log(`  Active: ${finalStats.active}`);
    console.log(`  Cancelled: ${finalStats.cancelled}\n`);

    console.log('=== BPM Framework Test Completed Successfully! ===\n');

    return {
      success: true,
      processes: [orderProcess, orderProcess2],
      stats: finalStats
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test event system
 */
export function testBPMEvents() {
  console.log('=== Testing BPM Event System ===\n');

  // Listen to process events
  const listeners = {
    created: eventBus.on(EVENTS.PROCESS_CREATED, (data) => {
      console.log(`EVENT: Process Created - ${data.processId}`);
    }),
    stateChanged: eventBus.on(EVENTS.PROCESS_STATE_CHANGED, (data) => {
      console.log(`EVENT: State Changed - ${data.from} → ${data.to}`);
    }),
    completed: eventBus.on(EVENTS.PROCESS_COMPLETED, (data) => {
      console.log(`EVENT: Process Completed - ${data.processId}`);
    }),
    cancelled: eventBus.on(EVENTS.PROCESS_CANCELLED, (data) => {
      console.log(`EVENT: Process Cancelled - ${data.processId}`);
    })
  };

  console.log('✓ Event listeners registered\n');

  return listeners;
}

// Export for use in other files
export default {
  testBPMFramework,
  testBPMEvents
};
