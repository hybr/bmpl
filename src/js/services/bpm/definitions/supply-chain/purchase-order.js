/**
 * Purchase Order Process Definition
 * Vendor purchase order and procurement workflow
 */

import { PROCESS_TYPES, PROCESS_CATEGORIES, APPROVAL_LEVELS } from '../../../../config/constants.js';

/**
 * Purchase Order Process
 *
 * State Flow:
 * draft → submitted → approved → sent_to_vendor → acknowledged → shipped → received → invoiced → closed
 *
 * Approval Rules:
 * - < $1,000: Auto-approve
 * - $1,000 - $9,999: Manager approval
 * - $10,000+: Director approval
 */
export const purchaseOrderDefinition = {
  id: 'purchase_order_v1',
  name: 'Purchase Order',
  description: 'Vendor purchase order and procurement workflow',
  type: PROCESS_TYPES.SUPPLY_CHAIN_PURCHASE_ORDER,
  version: '1.0.0',
  initialState: 'draft',

  // Variable schema
  variables: {
    // PO details
    poNumber: { type: 'string', required: true },
    poDate: { type: 'date', required: true },
    requestedBy: { type: 'string', required: true },
    requestedByName: { type: 'string', required: false },
    department: { type: 'string', required: false },

    // Vendor details
    vendorId: { type: 'string', required: true },
    vendorName: { type: 'string', required: true },
    vendorContact: { type: 'string', required: false },
    vendorEmail: { type: 'string', required: false },
    vendorPhone: { type: 'string', required: false },

    // Line items
    items: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        properties: {
          itemNumber: { type: 'string' },
          description: { type: 'string', required: true },
          quantity: { type: 'number', required: true, min: 1 },
          unitOfMeasure: { type: 'string' },
          unitPrice: { type: 'number', required: true, min: 0 },
          totalPrice: { type: 'number', required: true, min: 0 },
          requestedDeliveryDate: { type: 'date' }
        }
      }
    },

    // Financial details
    subtotal: { type: 'number', required: true, min: 0 },
    taxAmount: { type: 'number', required: false, min: 0, default: 0 },
    shippingCost: { type: 'number', required: false, min: 0, default: 0 },
    totalAmount: { type: 'number', required: true, min: 0 },
    currency: { type: 'string', required: false, default: 'USD' },

    // Accounting
    glAccount: { type: 'string', required: false },
    costCenter: { type: 'string', required: false },
    projectCode: { type: 'string', required: false },
    budgetCode: { type: 'string', required: false },

    // Delivery details
    deliveryAddress: {
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
    requestedDeliveryDate: { type: 'date', required: false },
    expectedDeliveryDate: { type: 'date', required: false },
    actualDeliveryDate: { type: 'date', required: false },

    // Approval workflow
    approvedBy: { type: 'string', required: false },
    approvalNotes: { type: 'string', required: false },
    rejectionReason: { type: 'string', required: false },

    // Vendor communication
    sentToVendorAt: { type: 'date', required: false },
    acknowledgedAt: { type: 'date', required: false },
    vendorPoNumber: { type: 'string', required: false },
    vendorConfirmationNumber: { type: 'string', required: false },

    // Shipping
    trackingNumber: { type: 'string', required: false },
    shippedAt: { type: 'date', required: false },
    carrier: { type: 'string', required: false },

    // Receiving
    receivedBy: { type: 'string', required: false },
    receivedByName: { type: 'string', required: false },
    receivedAt: { type: 'date', required: false },
    receivingNotes: { type: 'string', required: false },
    partialReceived: { type: 'boolean', required: false, default: false },

    // Invoice matching
    invoiceNumber: { type: 'string', required: false },
    invoiceReceived: { type: 'boolean', required: false, default: false },
    invoiceDate: { type: 'date', required: false },

    // Documents
    documents: { type: 'array', required: false, default: [] },

    // Additional info
    notes: { type: 'string', required: false },
    urgency: {
      type: 'string',
      required: false,
      enum: ['normal', 'urgent', 'critical'],
      default: 'normal'
    }
  },

  // State definitions
  states: {
    // Draft - PO being prepared
    draft: {
      name: 'Draft',
      description: 'Purchase order is being prepared',
      transitions: ['submitted', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} in draft`);

        // Set PO date if not provided
        if (!processInstance.variables.poDate) {
          processInstance.variables.poDate = new Date().toISOString();
        }
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Complete PO details and submit for approval',
          actionLabel: 'Submit PO'
        }
      ]
    },

    // Submitted - Awaiting approval
    submitted: {
      name: 'Submitted',
      description: 'PO submitted for approval',
      transitions: ['approved', 'draft', 'cancelled'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} submitted`);

        processInstance.variables.submittedAt = new Date().toISOString();

        // TODO: Send notification to approvers
        // const amount = processInstance.variables.totalAmount || 0;
        // const requiredRole = amount >= 10000 ? APPROVAL_LEVELS.DIRECTOR : APPROVAL_LEVELS.MANAGER;
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
                value: 1000
              }
            ],
            reason: 'Auto-approved (amount < $1,000)'
          },
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'cancelled',
            reason: 'No approval within 7 days'
          }
        ]
      },

      requiredActions: [
        {
          type: 'approval',
          role: APPROVAL_LEVELS.MANAGER,
          message: 'Review and approve this purchase order',
          actionLabel: 'Review PO',
          metadata: {
            approveLabel: 'Approve',
            rejectLabel: 'Send Back',
            requiresAmount: true,
            amountThreshold: 10000,
            escalateTo: APPROVAL_LEVELS.DIRECTOR
          }
        }
      ]
    },

    // Approved - PO approved
    approved: {
      name: 'Approved',
      description: 'Purchase order approved',
      transitions: ['sent_to_vendor'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} approved`);

        // Record approver
        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }

        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }

        processInstance.variables.approvedAt = new Date().toISOString();

        // TODO: Commit budget/encumber funds
        // await budgetService.encumber({
        //   amount: processInstance.variables.totalAmount,
        //   budgetCode: processInstance.variables.budgetCode
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Send PO to vendor',
          actionLabel: 'Send to Vendor'
        }
      ]
    },

    // Sent to Vendor - PO transmitted to vendor
    sent_to_vendor: {
      name: 'Sent to Vendor',
      description: 'PO has been sent to vendor',
      transitions: ['acknowledged', 'approved'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} sent to vendor`);

        processInstance.variables.sentToVendorAt = new Date().toISOString();

        // TODO: Send PO to vendor
        // await vendorService.sendPO({
        //   vendorEmail: processInstance.variables.vendorEmail,
        //   poNumber: processInstance.variables.poNumber,
        //   items: processInstance.variables.items
        // });
      },

      // Auto-escalate if not acknowledged within 3 days
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 3 * 24 * 60 * 60 * 1000, // 3 days
            toState: 'acknowledged',
            reason: 'Auto-acknowledged after 3 days'
          }
        ]
      }
    },

    // Acknowledged - Vendor confirmed PO
    acknowledged: {
      name: 'Acknowledged',
      description: 'Vendor has acknowledged the PO',
      transitions: ['shipped'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} acknowledged by vendor`);

        processInstance.variables.acknowledgedAt = new Date().toISOString();

        if (context.vendorPoNumber) {
          processInstance.variables.vendorPoNumber = context.vendorPoNumber;
        }

        if (context.expectedDeliveryDate) {
          processInstance.variables.expectedDeliveryDate = context.expectedDeliveryDate;
        }

        // TODO: Notify requester
        // await notificationService.send({
        //   to: processInstance.variables.requestedBy,
        //   type: 'po_acknowledged',
        //   poNumber: processInstance.variables.poNumber,
        //   expectedDeliveryDate: processInstance.variables.expectedDeliveryDate
        // });
      }
    },

    // Shipped - Vendor shipped items
    shipped: {
      name: 'Shipped',
      description: 'Items have been shipped',
      transitions: ['received'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} shipped`);

        processInstance.variables.shippedAt = new Date().toISOString();

        if (context.trackingNumber) {
          processInstance.variables.trackingNumber = context.trackingNumber;
        }

        if (context.carrier) {
          processInstance.variables.carrier = context.carrier;
        }

        // TODO: Notify receiving department
        // await notificationService.send({
        //   to: 'receiving_department',
        //   type: 'po_shipped',
        //   poNumber: processInstance.variables.poNumber,
        //   trackingNumber: processInstance.variables.trackingNumber
        // });
      },

      requiredActions: [
        {
          type: 'manual',
          role: APPROVAL_LEVELS.MEMBER,
          message: 'Mark as received when items arrive',
          actionLabel: 'Mark Received'
        }
      ]
    },

    // Received - Items received
    received: {
      name: 'Received',
      description: 'Items have been received',
      transitions: ['invoiced'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} received`);

        processInstance.variables.receivedAt = new Date().toISOString();

        if (context.receivedBy) {
          processInstance.variables.receivedBy = context.receivedBy;
        }

        if (context.receivedByName) {
          processInstance.variables.receivedByName = context.receivedByName;
        }

        if (context.receivingNotes) {
          processInstance.variables.receivingNotes = context.receivingNotes;
        }

        if (context.actualDeliveryDate) {
          processInstance.variables.actualDeliveryDate = context.actualDeliveryDate;
        } else {
          processInstance.variables.actualDeliveryDate = new Date().toISOString();
        }

        // TODO: Update inventory
        // await inventoryService.receive(processInstance.variables.items);

        // TODO: Notify requester and accounts payable
        // await notificationService.send({
        //   to: [processInstance.variables.requestedBy, 'accounts_payable'],
        //   type: 'po_received',
        //   poNumber: processInstance.variables.poNumber
        // });
      },

      // Auto-transition to invoiced after 7 days
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            toState: 'invoiced',
            reason: 'Auto-moved to invoiced after 7 days'
          }
        ]
      }
    },

    // Invoiced - Vendor invoice received
    invoiced: {
      name: 'Invoiced',
      description: 'Vendor invoice received',
      transitions: ['closed'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} invoiced`);

        processInstance.variables.invoiceReceived = true;

        if (context.invoiceNumber) {
          processInstance.variables.invoiceNumber = context.invoiceNumber;
        }

        if (context.invoiceDate) {
          processInstance.variables.invoiceDate = context.invoiceDate;
        }

        // TODO: Create invoice approval process
        // const invoiceProcess = await processService.createProcess({
        //   definitionId: 'invoice_approval_v1',
        //   variables: {
        //     invoiceNumber: processInstance.variables.invoiceNumber,
        //     vendorId: processInstance.variables.vendorId,
        //     amount: processInstance.variables.totalAmount,
        //     poNumber: processInstance.variables.poNumber
        //   }
        // });
      },

      // Auto-close after 30 days
      autoTransition: {
        conditions: [
          {
            type: 'timer',
            duration: 30 * 24 * 60 * 60 * 1000, // 30 days
            toState: 'closed',
            reason: 'Auto-closed after 30 days'
          }
        ]
      }
    },

    // Closed - PO completed (terminal state)
    closed: {
      name: 'Closed',
      description: 'Purchase order completed',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} closed`);

        processInstance.variables.closedAt = new Date().toISOString();

        // Calculate PO cycle time
        if (processInstance.variables.poDate && processInstance.variables.closedAt) {
          const poDate = new Date(processInstance.variables.poDate);
          const closedDate = new Date(processInstance.variables.closedAt);
          const durationMs = closedDate.getTime() - poDate.getTime();
          processInstance.variables.cycleTime = durationMs;
        }

        // TODO: Release budget encumbrance
        // await budgetService.release({
        //   budgetCode: processInstance.variables.budgetCode,
        //   amount: processInstance.variables.totalAmount
        // });
      }
    },

    // Cancelled - PO cancelled (terminal state)
    cancelled: {
      name: 'Cancelled',
      description: 'Purchase order cancelled',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} cancelled`);

        if (context.reason || context.rejectionReason) {
          processInstance.variables.rejectionReason = context.reason || context.rejectionReason;
        }

        processInstance.variables.cancelledAt = new Date().toISOString();

        // TODO: Release budget if encumbered
        // if (processInstance.variables.approvedAt) {
        //   await budgetService.release({
        //     budgetCode: processInstance.variables.budgetCode,
        //     amount: processInstance.variables.totalAmount
        //   });
        // }

        // TODO: Notify vendor and requester
      }
    }
  },

  // Metadata
  metadata: {
    category: PROCESS_CATEGORIES.SUPPLY_CHAIN,
    tags: ['purchase', 'procurement', 'vendor', 'order'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'requester', 'manager', 'admin', 'owner'],
      transition: {
        draft_to_submitted: ['creator', 'requester', 'member', 'admin', 'owner'],
        submitted_to_approved: ['manager', 'director', 'owner'],
        submitted_to_draft: ['creator', 'requester', 'manager', 'owner'],
        approved_to_sent_to_vendor: ['member', 'admin', 'owner'],
        sent_to_vendor_to_acknowledged: ['member', 'vendor', 'system', 'owner'],
        acknowledged_to_shipped: ['vendor', 'member', 'admin', 'owner'],
        shipped_to_received: ['member', 'admin', 'owner'],
        received_to_invoiced: ['system', 'member', 'admin', 'owner'],
        invoiced_to_closed: ['system', 'admin', 'owner'],
        any_to_cancelled: ['creator', 'requester', 'manager', 'admin', 'owner']
      }
    },
    icon: 'cart-outline',
    color: '#6366f1' // indigo
  }
};

export default purchaseOrderDefinition;
