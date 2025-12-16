/**
 * Sales Order Processing Definition
 * Customer sales order processing and fulfillment workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Sales Order Processing
 *
 * State Flow:
 * draft → submitted → approved → fulfilled → invoiced → paid → closed | cancelled
 *
 * Approval Rules:
 * - < $5,000: Auto-approve
 * - $5,000 - $24,999: Manager approval
 * - $25,000+: Director approval
 */
export const salesOrderDefinition = {
  id: 'sales_order_v1',
  name: 'Sales Order',
  description: 'Customer sales order processing and fulfillment',
  type: PROCESS_TYPES.OPERATIONS_SALES_ORDER,
  version: '1.0.0',
  initialState: 'draft',

  // Variable schema
  variables: {
    // Customer details
    customerId: { type: 'string', required: true },
    customerName: { type: 'string', required: true },
    customerEmail: { type: 'string', required: false },
    customerPhone: { type: 'string', required: false },

    // Order details
    orderNumber: { type: 'string', required: true },
    orderDate: { type: 'date', required: true },
    requestedDeliveryDate: { type: 'date', required: false },
    actualDeliveryDate: { type: 'date', required: false },

    // Sales information
    salesRepId: { type: 'string', required: false },
    salesRepName: { type: 'string', required: false },
    region: { type: 'string', required: false },
    channel: {
      type: 'string',
      required: false,
      enum: ['direct', 'partner', 'online', 'retail']
    },

    // Line items
    items: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        properties: {
          sku: { type: 'string', required: true },
          productName: { type: 'string', required: true },
          description: { type: 'string', required: false },
          quantity: { type: 'number', required: true, min: 1 },
          unitPrice: { type: 'number', required: true, min: 0 },
          discount: { type: 'number', required: false, min: 0, max: 100 },
          totalPrice: { type: 'number', required: true, min: 0 }
        }
      }
    },

    // Financial details
    subtotal: { type: 'number', required: true, min: 0 },
    taxAmount: { type: 'number', required: false, min: 0, default: 0 },
    shippingCost: { type: 'number', required: false, min: 0, default: 0 },
    discount: { type: 'number', required: false, min: 0, default: 0 },
    totalAmount: { type: 'number', required: true, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },

    // Payment details
    paymentTerms: {
      type: 'string',
      required: false,
      enum: ['net_15', 'net_30', 'net_60', 'net_90', 'immediate', 'cod', 'prepaid']
    },
    paymentMethod: {
      type: 'string',
      required: false,
      enum: ['credit_card', 'bank_transfer', 'check', 'cash', 'financing']
    },
    paymentStatus: {
      type: 'string',
      required: false,
      enum: ['pending', 'partial', 'paid', 'overdue']
    },

    // Shipping details
    shippingAddress: {
      type: 'object',
      required: false,
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' }
      }
    },
    shippingMethod: { type: 'string', required: false },
    trackingNumber: { type: 'string', required: false },

    // Approval workflow
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    cancellationReason: { type: 'string', required: false },

    // Fulfillment tracking
    fulfillmentStartedAt: { type: 'date', required: false },
    fulfilledBy: { type: 'string', required: false },
    fulfillmentNotes: { type: 'string', required: false },

    // Invoice details
    invoiceNumber: { type: 'string', required: false },
    invoiceDate: { type: 'date', required: false },
    invoiceDueDate: { type: 'date', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] },

    // Additional notes
    notes: { type: 'string', required: false },
    internalNotes: { type: 'string', required: false }
  },

  // State definitions
  states: {
    // Draft - Order being prepared
    draft: {
      name: 'Draft',
      description: 'Sales order is being prepared',
      transitions: ['submitted', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Sales order ${processInstance.variables.orderNumber} in draft`);

        // Set order date if not provided
        if (!processInstance.variables.orderDate) {
          processInstance.variables.orderDate = new Date().toISOString();
        }
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Complete order details and submit',
          actionLabel: 'Submit Order'
        }
      ]
    },

    // Submitted - Awaiting approval
    submitted: {
      name: 'Submitted',
      description: 'Sales order submitted for approval',
      transitions: ['approved', 'draft', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Sales order ${processInstance.variables.orderNumber} submitted`);

        processInstance.variables.submittedAt = new Date().toISOString();

        // TODO: Send notification to approvers
        // const amount = processInstance.variables.totalAmount || 0;
        // const requiredRole = amount >= 25000 ? APPROVAL_LEVELS.DIRECTOR : APPROVAL_LEVELS.MANAGER;
        // await notificationService.send({
        //   type: 'sales_order_submitted',
        //   orderNumber: processInstance.variables.orderNumber,
        //   amount: processInstance.variables.totalAmount,
        //   requiredRole
        // });
      },

      // Auto-transition based on amount
      autoTransition: {
        conditions: [
          {
            type: 'condition',
            toState: 'approved',
            conditions: [
              {
                type: 'variable',
                field: 'totalAmount',
                operator: 'lt',
                value: 5000
              }
            ],
            reason: 'Auto-approved (amount < $5,000)'
          },
          {
            type: 'timer',
            duration: 48 * 60 * 60 * 1000, // 48 hours
            toState: 'cancelled',
            reason: 'No approval action within 48 hours'
          }
        ]
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Review and approve this sales order',
          actionLabel: 'Review Order',
          metadata: {
            approveLabel: 'Approve',
            rejectLabel: 'Send Back',
            requiresAmount: true,
            amountThreshold: 25000,
            escalateTo: APPROVAL_LEVELS.DIRECTOR
          }
        }
      ]
    },

    // Approved - Order approved, ready for fulfillment
    approved: {
      name: 'Approved',
      description: 'Sales order approved for fulfillment',
      transitions: ['fulfilled', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Sales order ${processInstance.variables.orderNumber} approved`);

        // Record approver
        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }

        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }

        processInstance.variables.approvedAt = new Date().toISOString();

        // TODO: Send notification to sales rep and fulfillment team
        // await notificationService.send({
        //   to: [processInstance.variables.salesRepId, 'fulfillment_team'],
        //   type: 'sales_order_approved',
        //   orderNumber: processInstance.variables.orderNumber,
        //   totalAmount: processInstance.variables.totalAmount
        // });

        // TODO: Reserve inventory
        // await inventoryService.reserve(processInstance.variables.items);
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Begin fulfilling this order',
          actionLabel: 'Start Fulfillment'
        }
      ]
    },

    // Fulfilled - Order shipped/delivered
    fulfilled: {
      name: 'Fulfilled',
      description: 'Order has been fulfilled and shipped',
      transitions: ['invoiced'],

      onEnter: async (processInstance, context) => {
        console.log(`Sales order ${processInstance.variables.orderNumber} fulfilled`);

        processInstance.variables.fulfillmentStartedAt = new Date().toISOString();

        // Record fulfillment details
        if (context.fulfilledBy) {
          processInstance.variables.fulfilledBy = context.fulfilledBy;
        }

        if (context.trackingNumber) {
          processInstance.variables.trackingNumber = context.trackingNumber;
        }

        if (context.actualDeliveryDate) {
          processInstance.variables.actualDeliveryDate = context.actualDeliveryDate;
        } else {
          processInstance.variables.actualDeliveryDate = new Date().toISOString();
        }

        // TODO: Send shipping notification to customer
        // await notificationService.send({
        //   to: processInstance.variables.customerEmail,
        //   type: 'order_shipped',
        //   orderNumber: processInstance.variables.orderNumber,
        //   trackingNumber: processInstance.variables.trackingNumber
        // });

        // TODO: Update inventory
        // await inventoryService.fulfill(processInstance.variables.items);
      },

      // Auto-transition to invoiced
      autoTransition: {
        conditions: [
          {
            type: 'immediate',
            toState: 'invoiced'
          }
        ]
      }
    },

    // Invoiced - Invoice generated
    invoiced: {
      name: 'Invoiced',
      description: 'Invoice has been generated',
      transitions: ['paid'],

      onEnter: async (processInstance, context) => {
        console.log(`Sales order ${processInstance.variables.orderNumber} invoiced`);

        // Generate invoice number if not provided
        if (!processInstance.variables.invoiceNumber) {
          const timestamp = Date.now();
          processInstance.variables.invoiceNumber = `INV-${processInstance.variables.orderNumber}-${timestamp}`;
        }

        processInstance.variables.invoiceDate = new Date().toISOString();

        // Calculate due date based on payment terms
        const paymentTerms = processInstance.variables.paymentTerms || 'net_30';
        const daysMap = {
          'net_15': 15,
          'net_30': 30,
          'net_60': 60,
          'net_90': 90,
          'immediate': 0,
          'cod': 0,
          'prepaid': 0
        };

        const days = daysMap[paymentTerms] || 30;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);
        processInstance.variables.invoiceDueDate = dueDate.toISOString();

        // Set initial payment status
        if (paymentTerms === 'prepaid') {
          processInstance.variables.paymentStatus = 'paid';
        } else {
          processInstance.variables.paymentStatus = 'pending';
        }

        // TODO: Send invoice to customer
        // await invoiceService.generate(processInstance);
        // await notificationService.send({
        //   to: processInstance.variables.customerEmail,
        //   type: 'invoice_generated',
        //   invoiceNumber: processInstance.variables.invoiceNumber,
        //   dueDate: processInstance.variables.invoiceDueDate
        // });
      },

      // Auto-transition if prepaid
      autoTransition: {
        conditions: [
          {
            type: 'condition',
            toState: 'paid',
            conditions: [
              {
                type: 'variable',
                field: 'paymentTerms',
                operator: 'eq',
                value: 'prepaid'
              }
            ],
            reason: 'Order was prepaid'
          }
        ]
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Mark order as paid when payment is received',
          actionLabel: 'Mark as Paid'
        }
      ]
    },

    // Paid - Payment received
    paid: {
      name: 'Paid',
      description: 'Payment has been received',
      transitions: ['closed'],

      onEnter: async (processInstance, context) => {
        console.log(`Sales order ${processInstance.variables.orderNumber} paid`);

        processInstance.variables.paymentStatus = 'paid';
        processInstance.variables.paidAt = new Date().toISOString();

        // Record payment method if provided
        if (context.paymentMethod) {
          processInstance.variables.paymentMethod = context.paymentMethod;
        }

        // TODO: Update accounting system
        // await accountingService.recordPayment({
        //   invoiceNumber: processInstance.variables.invoiceNumber,
        //   amount: processInstance.variables.totalAmount,
        //   paymentMethod: processInstance.variables.paymentMethod
        // });

        // TODO: Send payment confirmation
        // await notificationService.send({
        //   to: processInstance.variables.customerEmail,
        //   type: 'payment_received',
        //   orderNumber: processInstance.variables.orderNumber
        // });
      },

      // Auto-close after 7 days
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'closed',
            reason: 'Auto-closed after 7 days of payment'
          }
        ]
      }
    },

    // Closed - Order completed (terminal state)
    closed: {
      name: 'Closed',
      description: 'Sales order completed',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Sales order ${processInstance.variables.orderNumber} closed`);

        processInstance.variables.closedAt = new Date().toISOString();

        // Calculate order metrics
        if (processInstance.variables.orderDate && processInstance.variables.closedAt) {
          const orderDate = new Date(processInstance.variables.orderDate);
          const closedDate = new Date(processInstance.variables.closedAt);
          const durationMs = closedDate.getTime() - orderDate.getTime();
          processInstance.variables.orderDuration = durationMs;
        }

        // TODO: Update sales analytics
        // TODO: Trigger customer satisfaction survey
        // await surveyService.send({
        //   to: processInstance.variables.customerEmail,
        //   type: 'order_satisfaction',
        //   orderNumber: processInstance.variables.orderNumber
        // });
      }
    },

    // Cancelled - Order cancelled (terminal state)
    cancelled: {
      name: 'Cancelled',
      description: 'Sales order has been cancelled',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Sales order ${processInstance.variables.orderNumber} cancelled`);

        // Record cancellation reason
        if (context.reason || context.cancellationReason) {
          processInstance.variables.cancellationReason = context.reason || context.cancellationReason;
        }

        processInstance.variables.cancelledAt = new Date().toISOString();

        // TODO: Release reserved inventory
        // if (processInstance.variables.approvedAt) {
        //   await inventoryService.release(processInstance.variables.items);
        // }

        // TODO: Send cancellation notification
        // await notificationService.send({
        //   to: [processInstance.variables.customerEmail, processInstance.variables.salesRepId],
        //   type: 'order_cancelled',
        //   orderNumber: processInstance.variables.orderNumber,
        //   reason: processInstance.variables.cancellationReason
        // });

        // TODO: Process refund if payment was made
        // if (processInstance.variables.paidAt) {
        //   await paymentService.initiateRefund(processInstance);
        // }
      }
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.OPERATIONS,
    tags: ['sales', 'order', 'fulfillment', 'invoice', 'payment'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'sales_rep', 'manager', 'admin', 'owner'],
      transition: {
        draft_to_submitted: ['creator', 'sales_rep', 'member', 'admin', 'owner'],
        submitted_to_approved: ['manager', 'director', 'owner'],
        submitted_to_draft: ['creator', 'sales_rep', 'manager', 'owner'],
        approved_to_fulfilled: ['member', 'admin', 'owner'],
        fulfilled_to_invoiced: ['system'], // Auto-transition
        invoiced_to_paid: ['member', 'admin', 'owner'],
        paid_to_closed: ['system', 'admin', 'owner'],
        any_to_cancelled: ['creator', 'sales_rep', 'manager', 'admin', 'owner']
      }
    },
    icon: 'cart',
    color: '#3b82f6' // blue
  }
};

export default salesOrderDefinition;
