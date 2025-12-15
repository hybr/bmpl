# Business Process Management (BPM) Framework

A comprehensive, lightweight BPM framework for managing business processes in JavaScript applications with offline-first capabilities using PouchDB/CouchDB.

## Features

- **State Machine Engine**: Define and execute state-based workflows
- **Process Definitions**: Pre-built workflows for common business processes
- **Auto-Transitions**: Timer-based, event-driven, and condition-based transitions
- **Task Management**: User tasks, approvals, and form submissions
- **Offline Support**: Local-first architecture with automatic synchronization
- **Event System**: Real-time process state notifications
- **Audit Logging**: Complete history of all process transitions
- **Permission System**: Role-based access control for transitions

## Architecture

```
bpm/
├── state-machine.js          # Core state machine engine
├── process-service.js        # Main process management API
├── process-persistence.js    # PouchDB persistence layer
├── process-sync.js          # Synchronization service
├── condition-evaluator.js   # Condition evaluation engine
├── transition-engine.js     # Auto-transition handler
├── task-service.js          # User task management
├── definitions/             # Process definitions
│   ├── order-fulfillment.js
│   ├── job-application.js
│   └── task-workflow.js
├── test-bpm.js             # Test utilities
└── index.js                # Main exports
```

## Quick Start

### 1. Initialize the Framework

```javascript
import { initializeBPM } from './services/bpm/index.js';

// Initialize without sync
await initializeBPM();

// Initialize with organization sync
await initializeBPM({
  orgId: 'org_123',
  remoteUrl: 'https://couchdb.example.com/org_123',
  credentials: {
    username: 'user',
    password: 'pass'
  }
});
```

### 2. Create a Process Instance

```javascript
import { processService } from './services/bpm/index.js';

// Create an order process
const order = await processService.createProcess({
  definitionId: 'order_fulfillment_v1',
  type: 'order',
  variables: {
    orderId: 'ORD-001',
    buyerId: 'user_123',
    sellerId: 'user_456',
    productId: 'prod_789',
    quantity: 2,
    amount: 99.99
  },
  metadata: {
    source: 'marketplace',
    createdBy: 'user_123'
  }
});

console.log(`Process created: ${order._id}`);
console.log(`Current state: ${order.currentState}`); // "pending"
```

### 3. Transition Process States

```javascript
// Transition to next state
await processService.transitionState(
  order._id,
  'confirmed',
  { confirmedBy: 'user_456' }
);

// Get available transitions
const transitions = processService.getAvailableTransitions(order._id);
console.log('Available next states:', transitions.map(t => t.targetState));
```

### 4. Update Process Variables

```javascript
processService.updateProcessVariables(order._id, {
  trackingNumber: 'TRACK123',
  estimatedDelivery: '2025-01-20'
});
```

### 5. Work with Tasks

```javascript
import { taskService } from './services/bpm/index.js';

// Get user's pending tasks
const tasks = taskService.getUserTasks('user_456', 'admin');

// Complete a task
await taskService.completeTask(
  taskId,
  'user_456',
  'admin',
  { approved: true, reason: 'Looks good!' }
);
```

## Process Definitions

### Order Fulfillment

E-commerce order workflow from creation to delivery.

```javascript
const order = await processService.createProcess({
  definitionId: 'order_fulfillment_v1',
  type: 'order',
  variables: {
    orderId: 'ORD-001',
    buyerId: 'buyer_id',
    sellerId: 'seller_id',
    productId: 'product_id',
    quantity: 1,
    amount: 49.99
  }
});
```

**States**: pending → confirmed → processing → shipped → delivered → completed

### Job Application

Recruitment workflow for managing job applications.

```javascript
const application = await processService.createProcess({
  definitionId: 'job_application_v1',
  type: 'job_application',
  variables: {
    applicationId: 'APP-001',
    applicantId: 'applicant_id',
    applicantName: 'John Doe',
    applicantEmail: 'john@example.com',
    jobId: 'job_123',
    jobTitle: 'Software Engineer'
  }
});
```

**States**: submitted → screening → interview_scheduled → interviewed → decision_pending → offer_made → accepted/rejected

### Task Workflow

Simple task management workflow.

```javascript
const task = await processService.createProcess({
  definitionId: 'task_workflow_v1',
  type: 'task',
  variables: {
    taskId: 'TASK-001',
    title: 'Implement BPM Framework',
    description: 'Build a lightweight BPM system',
    creatorId: 'user_123',
    priority: 'high',
    dueDate: '2025-01-31'
  }
});
```

**States**: created → assigned → in_progress → review → completed

## Advanced Features

### Auto-Transitions

#### Timer-Based Transitions

```javascript
autoTransition: {
  conditions: [
    {
      type: 'timer',
      duration: 24 * 60 * 60 * 1000, // 24 hours
      toState: 'cancelled',
      reason: 'No confirmation within 24 hours'
    }
  ]
}
```

#### Condition-Based Transitions

```javascript
autoTransition: {
  conditions: [
    {
      type: 'condition',
      conditions: [
        {
          type: 'variable',
          field: 'amount',
          operator: 'gt',
          value: 1000
        }
      ],
      toState: 'requires_approval'
    }
  ]
}
```

#### Event-Driven Transitions

```javascript
autoTransition: {
  conditions: [
    {
      type: 'event',
      event: 'payment_received',
      toState: 'processing'
    }
  ]
}
```

### State Hooks

```javascript
states: {
  confirmed: {
    name: 'Confirmed',
    transitions: ['processing'],

    // Executed when entering this state
    onEnter: async (processInstance, context) => {
      console.log('Order confirmed!');
      await sendNotification(processInstance.variables.buyerId);
    },

    // Executed when leaving this state
    onExit: async (processInstance, context) => {
      console.log('Moving to next step');
    }
  }
}
```

### Required Actions (Tasks)

```javascript
requiredActions: [
  {
    type: 'approval',
    role: 'admin',
    message: 'Please review and approve this order',
    actionLabel: 'Approve Order'
  }
]
```

**Task Types**:
- `approval`: Yes/No decision
- `manual`: Simple completion action
- `form`: Form submission with validation
- `review`: Review with decision and comments

## API Reference

### ProcessService

#### `createProcess(options)`
Create a new process instance.

```javascript
const process = await processService.createProcess({
  definitionId: 'order_fulfillment_v1',
  type: 'order',
  variables: { /* process data */ },
  metadata: { /* additional metadata */ }
});
```

#### `transitionState(processId, targetState, context)`
Transition a process to a new state.

```javascript
await processService.transitionState(
  processId,
  'confirmed',
  { confirmedBy: 'user_123' }
);
```

#### `updateProcessVariables(processId, variables)`
Update process variables.

```javascript
processService.updateProcessVariables(processId, {
  trackingNumber: 'TRACK123'
});
```

#### `getProcess(processId)`
Get a process instance by ID.

#### `getAllProcesses()`
Get all process instances.

#### `getProcessesByType(type)`
Get processes filtered by type.

#### `getProcessesByStatus(status)`
Get processes filtered by status.

#### `cancelProcess(processId, reason)`
Cancel a process.

#### `suspendProcess(processId, reason)`
Suspend a process.

#### `resumeProcess(processId)`
Resume a suspended process.

### TaskService

#### `getUserTasks(userId, userRole)`
Get all tasks for a user.

```javascript
const tasks = taskService.getUserTasks('user_123', 'admin');
```

#### `completeTask(taskId, userId, userRole, data)`
Complete a task.

```javascript
await taskService.completeTask(
  taskId,
  'user_123',
  'admin',
  { approved: true }
);
```

### ProcessSync

#### `initialize(orgId, remoteUrl, credentials)`
Initialize sync for an organization.

#### `syncPendingProcesses()`
Sync all pending processes.

#### `forceSync()`
Force immediate synchronization.

#### `switchOrganization(orgId, remoteUrl, credentials)`
Switch to a different organization.

## Events

Listen to process events using the event bus:

```javascript
import { eventBus, EVENTS } from './utils/events.js';

// Process created
eventBus.on(EVENTS.PROCESS_CREATED, (data) => {
  console.log('Process created:', data.processId);
});

// State changed
eventBus.on(EVENTS.PROCESS_STATE_CHANGED, (data) => {
  console.log(`${data.from} → ${data.to}`);
});

// Process completed
eventBus.on(EVENTS.PROCESS_COMPLETED, (data) => {
  console.log('Process completed:', data.processId);
});

// Sync completed
eventBus.on(EVENTS.PROCESS_SYNC_COMPLETED, (data) => {
  console.log('Sync completed:', data);
});
```

## Creating Custom Process Definitions

```javascript
export const customProcessDefinition = {
  id: 'custom_process_v1',
  name: 'Custom Process',
  description: 'Description of the process',
  type: 'custom',
  version: '1.0.0',
  initialState: 'start',

  variables: {
    // Define expected variables
    fieldName: { type: 'string', required: true }
  },

  states: {
    start: {
      name: 'Start State',
      description: 'Initial state',
      transitions: ['next_state'],

      onEnter: async (processInstance, context) => {
        // Logic when entering this state
      },

      requiredActions: [
        {
          type: 'manual',
          role: 'admin',
          message: 'Action message',
          actionLabel: 'Button Label'
        }
      ]
    },

    next_state: {
      name: 'Next State',
      transitions: ['completed'],
      // ... state configuration
    },

    completed: {
      name: 'Completed',
      transitions: [] // Terminal state
    }
  },

  metadata: {
    category: 'custom',
    tags: ['tag1', 'tag2'],
    permissions: {
      create: ['authenticated'],
      view: ['creator', 'admin'],
      transition: {
        start_to_next: ['admin']
      }
    }
  }
};

// Register the definition
import { processService } from './services/bpm/index.js';
processService.registerDefinition(customProcessDefinition);
```

## Testing

```javascript
import { testBPMFramework } from './services/bpm/index.js';

// Run comprehensive tests
const result = await testBPMFramework();
console.log(result);
```

Or use the browser console:

```javascript
// Available in browser console after calling exposeBPMGlobally()
await window.BPM.test();
```

## Best Practices

1. **Keep States Focused**: Each state should represent a clear, distinct phase
2. **Use Meaningful Names**: State and variable names should be self-documenting
3. **Handle Errors**: Always wrap state hooks in try-catch blocks
4. **Log Important Events**: Use audit logging for compliance and debugging
5. **Set Reasonable Timeouts**: Don't set timer transitions too short
6. **Validate Input**: Always validate user input in task handlers
7. **Document Processes**: Add clear descriptions to states and transitions
8. **Test Thoroughly**: Test all possible state transitions
9. **Monitor Performance**: Watch for slow state hooks or transitions
10. **Keep Variables Minimal**: Only store essential data in process variables

## Troubleshooting

### Process not transitioning
- Check if transition is allowed from current state
- Verify user has required permissions
- Check if conditions are met
- Look for errors in onExit/onEnter hooks

### Auto-transitions not working
- Verify transition engine is initialized
- Check timer durations
- Ensure conditions are properly formatted
- Look for errors in console

### Sync issues
- Verify database connection
- Check credentials
- Ensure network connectivity
- Look for sync errors in events

## License

MIT
