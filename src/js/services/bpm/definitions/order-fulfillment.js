/**
 * Order Fulfillment Process Definition
 * Complete workflow for processing orders from creation to completion
 */

import { PROCESS_TYPES } from '../../../config/constants.js';

/**
 * Order Fulfillment Process
 *
 * State Flow:
 * pending → confirmed → processing → shipped → delivered → completed
 *        ↘ cancelled ↙
 */
export const orderFulfillmentDefinition = {
  id: 'order_fulfillment_v1',
  name: 'Order Fulfillment',
  description: 'Standard order processing workflow',
  type: PROCESS_TYPES.ORDER,
  version: '1.0.0',
  initialState: 'pending',

  // Process variables schema (documentation)
  variables: {
    orderId: { type: 'string', required: true },
    buyerId: { type: 'string', required: true },
    sellerId: { type: 'string', required: true },
    productId: { type: 'string', required: true },
    productName: { type: 'string', required: false },
    quantity: { type: 'number', required: true },
    amount: { type: 'number', required: true },
    currency: { type: 'string', required: false, default: 'USD' },
    shippingAddress: { type: 'object', required: false },
    trackingNumber: { type: 'string', required: false },
    estimatedDeliveryDate: { type: 'string', required: false },
    actualDeliveryDate: { type: 'string', required: false }
  },

  // State definitions
  states: {
    // Initial state - Order created but not confirmed by seller
    pending: {
      name: 'Pending Confirmation',
      description: 'Waiting for seller to confirm the order',
      transitions: ['confirmed', 'cancelled'],

      // Hook: When entering this state
      onEnter: async (processInstance, context) => {
        console.log(`Order ${processInstance.variables.orderId} is pending confirmation`);

        // TODO: Send notification to seller
        // await notificationService.send({
        //   userId: processInstance.variables.sellerId,
        //   type: 'order_received',
        //   data: { orderId: processInstance.variables.orderId }
        // });
      },

      // Hook: When exiting this state
      onExit: async (processInstance, context) => {
        console.log(`Order ${processInstance.variables.orderId} leaving pending state`);
      },

      // Auto-transition configuration
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 24 * 60 * 60 * 1000, // 24 hours
            toState: 'cancelled',
            reason: 'No confirmation within 24 hours'
          }
        ]
      },

      // Required actions (for UI/approval workflows)
      requiredActions: [
        {
          type: 'approval',
          role: 'owner', // Must be owner of the organization
          message: 'Please confirm the order details',
          actionLabel: 'Confirm Order'
        }
      ]
    },

    // Order confirmed by seller
    confirmed: {
      name: 'Order Confirmed',
      description: 'Seller has confirmed the order',
      transitions: ['processing', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Order ${processInstance.variables.orderId} confirmed`);

        // TODO: Send notification to buyer
        // await notificationService.send({
        //   userId: processInstance.variables.buyerId,
        //   type: 'order_confirmed',
        //   data: { orderId: processInstance.variables.orderId }
        // });
      },

      // Auto-transition to processing after confirmation
      autoTransition: {
        conditions: [
          {
            type: 'immediate', // Transition immediately
            toState: 'processing'
          }
        ]
      }
    },

    // Order is being prepared/processed
    processing: {
      name: 'Processing',
      description: 'Order is being prepared for shipment',
      transitions: ['shipped', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Order ${processInstance.variables.orderId} is being processed`);
      },

      requiredActions: [
        {
          type: 'manual',
          role: 'admin',
          message: 'Prepare order for shipment',
          actionLabel: 'Mark as Shipped'
        }
      ]
    },

    // Order has been shipped
    shipped: {
      name: 'Shipped',
      description: 'Order has been shipped to customer',
      transitions: ['delivered', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Order ${processInstance.variables.orderId} has been shipped`);

        // Update tracking number if provided in context
        if (context.trackingNumber) {
          processInstance.variables.trackingNumber = context.trackingNumber;
        }

        // TODO: Send notification to buyer
        // await notificationService.send({
        //   userId: processInstance.variables.buyerId,
        //   type: 'order_shipped',
        //   data: {
        //     orderId: processInstance.variables.orderId,
        //     trackingNumber: processInstance.variables.trackingNumber
        //   }
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: 'buyer',
          message: 'Confirm delivery when received',
          actionLabel: 'Confirm Delivery'
        }
      ]
    },

    // Order has been delivered
    delivered: {
      name: 'Delivered',
      description: 'Order has been delivered to customer',
      transitions: ['completed'],

      onEnter: async (processInstance, context) => {
        console.log(`Order ${processInstance.variables.orderId} has been delivered`);

        // Record delivery date
        processInstance.variables.actualDeliveryDate = new Date().toISOString();

        // TODO: Send notification to seller
        // await notificationService.send({
        //   userId: processInstance.variables.sellerId,
        //   type: 'order_delivered',
        //   data: { orderId: processInstance.variables.orderId }
        // });
      },

      // Auto-complete after 7 days if not disputed
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'completed',
            reason: 'Auto-completed after 7 days'
          }
        ]
      }
    },

    // Terminal state: Order completed successfully
    completed: {
      name: 'Completed',
      description: 'Order has been completed successfully',
      transitions: [], // Terminal state - no further transitions

      onEnter: async (processInstance, context) => {
        console.log(`Order ${processInstance.variables.orderId} completed successfully`);

        // TODO: Update order status in database
        // TODO: Process payment to seller
        // TODO: Send completion notifications
      }
    },

    // Terminal state: Order cancelled
    cancelled: {
      name: 'Cancelled',
      description: 'Order has been cancelled',
      transitions: [], // Terminal state - no further transitions

      onEnter: async (processInstance, context) => {
        console.log(`Order ${processInstance.variables.orderId} cancelled`);

        // Record cancellation reason
        processInstance.variables.cancellationReason = context.reason || 'No reason provided';

        // TODO: Process refund if payment was made
        // TODO: Send cancellation notifications
      }
    }
  },

  // Metadata
  metadata: {
    category: 'commerce',
    tags: ['order', 'fulfillment', 'e-commerce'],
    permissions: {
      create: ['authenticated'], // Any authenticated user can create
      view: ['buyer', 'seller', 'admin'],
      transition: {
        pending_to_confirmed: ['seller', 'admin'],
        confirmed_to_processing: ['seller', 'admin'],
        processing_to_shipped: ['seller', 'admin'],
        shipped_to_delivered: ['buyer', 'seller', 'admin'],
        delivered_to_completed: ['buyer', 'seller', 'admin'],
        any_to_cancelled: ['buyer', 'seller', 'admin']
      }
    }
  }
};

export default orderFulfillmentDefinition;
