/**
 * Purchase Order Process Definition
 * Vendor purchase order and procurement workflow
 *
 * Field Principles:
 * - Auto-generated IDs are system fields (not shown in forms)
 * - Vendor/User references use appropriate lookups
 * - Redundant fields derived from lookups are removed
 * - Fields are assigned to specific steps/states
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
  type: PROCESS_TYPES.SC_PURCHASE_ORDER,
  version: '1.0.0',
  initialState: 'draft',

  // Variable schema
  variables: {
    // === SYSTEM FIELDS (auto-generated) ===
    poNumber: {
      type: 'string',
      required: false,
      step: 'system',
      description: 'Auto-generated PO number'
    },

    // === CREATE/DRAFT STEP FIELDS ===

    // Requester - User lookup (defaults to current user)
    requestedBy: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name'],
        displayFields: ['name', 'department'],
        placeholder: 'Search requester'
      },
      description: 'Employee requesting the purchase'
    },

    // Vendor - Entity lookup
    vendorId: {
      type: 'string',
      required: true,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'vendors',
        searchFields: ['name', 'vendorCode', 'email'],
        displayTemplate: '{name} ({vendorCode})',
        placeholder: 'Search for vendor'
      },
      description: 'Vendor to purchase from'
    },

    // Department
    department: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'departments',
        searchFields: ['name', 'code'],
        displayTemplate: '{name}',
        placeholder: 'Select department'
      }
    },

    // Items description (simplified - detailed line items in system)
    itemsDescription: {
      type: 'string',
      required: true,
      step: 'create',
      multiline: true,
      rows: 4,
      placeholder: 'Describe items to purchase (item, quantity, price)'
    },

    // Total amount
    totalAmount: {
      type: 'number',
      required: true,
      step: 'create',
      min: 0,
      placeholder: 'Total amount'
    },

    currency: {
      type: 'string',
      required: false,
      step: 'create',
      default: 'USD',
      foreignKey: {
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
      }
    },

    // Delivery date requested
    requestedDeliveryDate: {
      type: 'date',
      required: false,
      step: 'create',
      description: 'Requested delivery date'
    },

    // Urgency
    urgency: {
      type: 'string',
      required: false,
      step: 'create',
      default: 'normal',
      foreignKey: {
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'urgent', label: 'Urgent' },
          { value: 'critical', label: 'Critical' }
        ]
      }
    },

    // Accounting
    budgetCode: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'budgets',
        searchFields: ['code', 'name'],
        displayTemplate: '{code} - {name}',
        placeholder: 'Search budget'
      }
    },

    costCenter: {
      type: 'string',
      required: false,
      step: 'create',
      inputType: 'entityLookup',
      lookup: {
        entity: 'costCenters',
        searchFields: ['code', 'name'],
        displayTemplate: '{code} - {name}',
        placeholder: 'Search cost center'
      }
    },

    // Notes
    notes: {
      type: 'string',
      required: false,
      step: 'create',
      multiline: true,
      rows: 2,
      placeholder: 'Additional notes'
    },

    // === SUBMITTED STEP FIELDS ===
    approvalNotes: {
      type: 'string',
      required: false,
      step: 'submitted',
      multiline: true,
      rows: 2,
      placeholder: 'Approval notes'
    },

    // === ACKNOWLEDGED STEP FIELDS ===
    vendorPoNumber: {
      type: 'string',
      required: false,
      step: 'acknowledged',
      placeholder: "Vendor's PO reference number"
    },

    expectedDeliveryDate: {
      type: 'date',
      required: false,
      step: 'acknowledged',
      description: 'Expected delivery date from vendor'
    },

    // === SHIPPED STEP FIELDS ===
    trackingNumber: {
      type: 'string',
      required: false,
      step: 'shipped',
      placeholder: 'Shipping tracking number'
    },

    carrier: {
      type: 'string',
      required: false,
      step: 'shipped',
      foreignKey: {
        options: [
          { value: 'ups', label: 'UPS' },
          { value: 'fedex', label: 'FedEx' },
          { value: 'usps', label: 'USPS' },
          { value: 'dhl', label: 'DHL' },
          { value: 'other', label: 'Other' }
        ]
      }
    },

    // === RECEIVED STEP FIELDS ===
    receivedBy: {
      type: 'string',
      required: false,
      step: 'received',
      inputType: 'userLookup',
      lookup: {
        service: 'employees',
        searchFields: ['email', 'name'],
        displayFields: ['name'],
        placeholder: 'Who received the items?'
      }
    },

    receivingNotes: {
      type: 'string',
      required: false,
      step: 'received',
      multiline: true,
      rows: 2,
      placeholder: 'Notes about received items'
    },

    partialReceived: {
      type: 'boolean',
      required: false,
      step: 'received',
      default: false,
      toggleLabel: 'Partial delivery (not all items received)'
    },

    // === INVOICED STEP FIELDS ===
    invoiceNumber: {
      type: 'string',
      required: false,
      step: 'invoiced',
      placeholder: 'Vendor invoice number'
    },

    invoiceDate: {
      type: 'date',
      required: false,
      step: 'invoiced',
      description: 'Invoice date'
    },

    // === CANCELLED STEP FIELDS ===
    cancellationReason: {
      type: 'string',
      required: false,
      step: 'cancelled',
      multiline: true,
      rows: 2,
      placeholder: 'Reason for cancellation'
    },

    // === SYSTEM TRACKING FIELDS ===
    poDate: { type: 'date', required: false, step: 'system' },
    items: { type: 'array', required: false, step: 'system', default: [] },
    subtotal: { type: 'number', required: false, step: 'system', min: 0 },
    taxAmount: { type: 'number', required: false, step: 'system', min: 0, default: 0 },
    shippingCost: { type: 'number', required: false, step: 'system', min: 0, default: 0 },
    glAccount: { type: 'string', required: false, step: 'system' },
    projectCode: { type: 'string', required: false, step: 'system' },
    deliveryAddress: { type: 'object', required: false, step: 'system' },
    actualDeliveryDate: { type: 'date', required: false, step: 'system' },
    approvedBy: { type: 'string', required: false, step: 'system' },
    sentToVendorAt: { type: 'date', required: false, step: 'system' },
    acknowledgedAt: { type: 'date', required: false, step: 'system' },
    shippedAt: { type: 'date', required: false, step: 'system' },
    receivedAt: { type: 'date', required: false, step: 'system' },
    invoiceReceived: { type: 'boolean', required: false, step: 'system', default: false },
    documents: { type: 'array', required: false, step: 'system', default: [] },
    submittedAt: { type: 'date', required: false, step: 'system' },
    approvedAt: { type: 'date', required: false, step: 'system' },
    closedAt: { type: 'date', required: false, step: 'system' },
    cancelledAt: { type: 'date', required: false, step: 'system' },
    cycleTime: { type: 'number', required: false, step: 'system' }
  },

  // State definitions
  states: {
    // Draft - PO being prepared
    draft: {
      name: 'Draft',
      description: 'Purchase order is being prepared',
      transitions: ['submitted', 'cancelled'],

      onEnter: async (processInstance, context) => {
        // Generate PO number
        if (!processInstance.variables.poNumber) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          processInstance.variables.poNumber = `PO-${timestamp}-${random}`;
        }

        processInstance.variables.poDate = new Date().toISOString();

        console.log(`Purchase order ${processInstance.variables.poNumber} in draft`);
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

        processInstance.variables.approvedAt = new Date().toISOString();

        if (context.approvedBy) {
          processInstance.variables.approvedBy = context.approvedBy;
        }
        if (context.approvalNotes) {
          processInstance.variables.approvalNotes = context.approvalNotes;
        }
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

    // Sent to Vendor
    sent_to_vendor: {
      name: 'Sent to Vendor',
      description: 'PO has been sent to vendor',
      transitions: ['acknowledged', 'approved'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} sent to vendor`);
        processInstance.variables.sentToVendorAt = new Date().toISOString();
      },

      // Auto-acknowledge after 3 days
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

    // Acknowledged
    acknowledged: {
      name: 'Acknowledged',
      description: 'Vendor has acknowledged the PO',
      transitions: ['shipped'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} acknowledged`);

        processInstance.variables.acknowledgedAt = new Date().toISOString();

        if (context.vendorPoNumber) {
          processInstance.variables.vendorPoNumber = context.vendorPoNumber;
        }
        if (context.expectedDeliveryDate) {
          processInstance.variables.expectedDeliveryDate = context.expectedDeliveryDate;
        }
      }
    },

    // Shipped
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

    // Received
    received: {
      name: 'Received',
      description: 'Items have been received',
      transitions: ['invoiced'],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} received`);

        processInstance.variables.receivedAt = new Date().toISOString();
        processInstance.variables.actualDeliveryDate = new Date().toISOString();

        if (context.receivedBy) {
          processInstance.variables.receivedBy = context.receivedBy;
        }
        if (context.receivingNotes) {
          processInstance.variables.receivingNotes = context.receivingNotes;
        }
        if (context.partialReceived !== undefined) {
          processInstance.variables.partialReceived = context.partialReceived;
        }
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

    // Invoiced
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

    // Closed (terminal state)
    closed: {
      name: 'Closed',
      description: 'Purchase order completed',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} closed`);

        processInstance.variables.closedAt = new Date().toISOString();

        // Calculate cycle time
        if (processInstance.variables.poDate && processInstance.variables.closedAt) {
          const poDate = new Date(processInstance.variables.poDate);
          const closedDate = new Date(processInstance.variables.closedAt);
          processInstance.variables.cycleTime = closedDate.getTime() - poDate.getTime();
        }
      }
    },

    // Cancelled (terminal state)
    cancelled: {
      name: 'Cancelled',
      description: 'Purchase order cancelled',
      transitions: [],

      onEnter: async (processInstance, context) => {
        console.log(`Purchase order ${processInstance.variables.poNumber} cancelled`);

        processInstance.variables.cancelledAt = new Date().toISOString();

        if (context.reason || context.cancellationReason) {
          processInstance.variables.cancellationReason = context.reason || context.cancellationReason;
        }
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
