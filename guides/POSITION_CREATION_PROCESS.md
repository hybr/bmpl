# Position Creation Process

## Overview

The Position Creation Process enables organizations to formally define and approve job positions before recruitment begins. This process ensures that both HR and the concerned Department collaborate to create well-defined positions with clear requirements.

**Key Principle:** A Position is the combination of Department + Team + Designation + Education Requirements + Experience Requirements + Skills.

## Process Definition Summary

| Property | Value |
|----------|-------|
| **Process ID** | `position_creation_v1` |
| **Name** | Position Creation Workflow |
| **Category** | HR |
| **Type** | `PROCESS_TYPES.POSITION_CREATION` |
| **Initial State** | `draft` |
| **Terminal States** | `active`, `closed`, `rejected` |

## Process Flow Diagram

```
                                    ┌─────────────────┐
                                    │                 │
     ┌──────────┐    ┌───────────┐  │  ┌───────────┐  │   ┌──────────┐   ┌────────┐
     │          │    │           │  │  │ HR        │  │   │          │   │        │
     │  DRAFT   │───►│ SUBMITTED │──┼─►│ APPROVAL  │──┼──►│ APPROVED │──►│ ACTIVE │
     │          │    │           │  │  │ (pending) │  │   │          │   │        │
     └──────────┘    └───────────┘  │  └───────────┘  │   └──────────┘   └────────┘
          │                         │        │        │         │              │
          │                         │        │        │         │              │
          │                         │  ┌───────────┐  │         │              │
          │                         │  │ DEPT      │  │         │              │
          │                         └─►│ APPROVAL  │──┘         │              │
          │                            │ (pending) │            │              │
          │                            └───────────┘            │              │
          │                                  │                  │              │
          │                                  ▼                  │              ▼
          │                            ┌──────────┐             │        ┌──────────┐
          └───────────────────────────►│ REJECTED │◄────────────┘        │  CLOSED  │
                                       └──────────┘                      └──────────┘
```

### State Descriptions

| State | Description |
|-------|-------------|
| `draft` | Position details being entered by initiator (HR or Department) |
| `submitted` | Position submitted for parallel approval |
| `pending_hr_approval` | Waiting for HR Head approval |
| `pending_dept_approval` | Waiting for Department Head approval |
| `approved` | Both HR and Department have approved |
| `active` | Position is open and available for job applications |
| `closed` | Position filled or cancelled |
| `rejected` | Position rejected by either approver |

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| **HR Team** | Create position, Edit drafts, Submit for approval, HR approval authority |
| **Department Head** | Create position, Edit drafts, Submit for approval, Department approval authority |
| **HR Head** | Final HR approval |
| **Management/Owner** | View all positions, Override approvals |

### Transition Permissions

```javascript
permissions: {
  create: ['hr_team', 'department_head'],
  view: ['hr_team', 'department', 'admin', 'owner'],
  transition: {
    draft_to_submitted: ['hr_team', 'department_head'],
    submitted_to_pending_approval: ['system'],
    pending_hr_approval_to_approved: ['hr_head'],
    pending_dept_approval_to_approved: ['department_head'],
    pending_to_rejected: ['hr_head', 'department_head'],
    approved_to_active: ['hr_team', 'admin'],
    active_to_closed: ['hr_team', 'admin']
  }
}
```

## Variables Schema

### System Fields (auto-generated, step: 'system')

| Field | Type | Description |
|-------|------|-------------|
| `positionId` | string | Auto-generated unique position ID (e.g., POS-1734567890-123) |
| `createdAt` | date | Timestamp when position was created |
| `submittedAt` | date | Timestamp when submitted for approval |
| `approvedAt` | date | Timestamp when fully approved |
| `activatedAt` | date | Timestamp when position became active |
| `closedAt` | date | Timestamp when position was closed |

### Create Step Fields (step: 'create')

#### Organization Structure

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `departmentId` | string | Yes | entityLookup | Department for this position |
| `teamId` | string | Yes | entityLookup | Team within the department (filtered by departmentId) |
| `designation` | string | Yes | text | Job title/designation |
| `reportingToId` | string | No | userLookup | Manager this position reports to |

#### Job Details

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `jobDescription` | string | Yes | multiline (rows: 6) | Detailed job responsibilities |
| `employmentType` | string | Yes | select | Full-time, Part-time, Contract, Intern |
| `numberOfPositions` | number | Yes | number (min: 1) | Number of openings |
| `location` | string | No | text | Work location |
| `remoteAllowed` | boolean | No | toggle | Whether remote work is allowed |

#### Compensation

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `salaryMin` | number | Yes | number | Minimum salary for this position |
| `salaryMax` | number | Yes | number | Maximum salary for this position |
| `salaryCurrency` | string | Yes | select | Currency (INR, USD, EUR, etc.) |
| `salaryPeriod` | string | Yes | select | Per Month, Per Year |

#### Education Requirements

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `educationLevel` | string | Yes | select | Minimum education level required (from EDUCATION_LEVELS enum) |
| `educationSubject` | string | No | text | Required subject/specialization |
| `minimumMarks` | number | No | number | Minimum marks/percentage required |
| `preferredCertifications` | array | No | tags | Preferred professional certifications |

#### Experience Requirements

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `experienceMin` | number | Yes | number | Minimum years of experience |
| `experienceMax` | number | No | number | Maximum years of experience (optional) |
| `experienceType` | string | No | text | Type of experience preferred |

#### Skills

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `skillsRequired` | array | Yes | tags | Required technical and soft skills |
| `skillsPreferred` | array | No | tags | Nice-to-have skills |

### Approval Step Fields (step: 'approval')

#### HR Approval

| Field | Type | Required | Step | Description |
|-------|------|----------|------|-------------|
| `hrApprovalStatus` | string | No | pending_hr_approval | pending, approved, rejected |
| `hrApprovalNotes` | string | No | pending_hr_approval | Notes from HR reviewer |
| `hrApprovedById` | string | No | system | User ID who approved from HR |
| `hrApprovedAt` | date | No | system | Timestamp of HR approval |

#### Department Approval

| Field | Type | Required | Step | Description |
|-------|------|----------|------|-------------|
| `deptApprovalStatus` | string | No | pending_dept_approval | pending, approved, rejected |
| `deptApprovalNotes` | string | No | pending_dept_approval | Notes from Department reviewer |
| `deptApprovedById` | string | No | system | User ID who approved from Department |
| `deptApprovedAt` | date | No | system | Timestamp of Department approval |

### Close Step Fields (step: 'close')

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `closeReason` | string | Yes | Reason for closing (Filled, Cancelled, Budget, etc.) |
| `closeNotes` | string | No | Additional notes about closure |
| `positionsFilled` | number | No | Number of positions actually filled |

## Master Data: Education Levels

This enum should be stored in the shared constants and available across all organizations:

```javascript
export const EDUCATION_LEVELS = {
  PRIMARY: { value: 'primary', label: 'Primary Education', order: 1 },
  SECONDARY: { value: 'secondary', label: 'Secondary Education (10th)', order: 2 },
  HIGHER_SECONDARY: { value: 'higher_secondary', label: 'Higher Secondary (12th)', order: 3 },
  DIPLOMA: { value: 'diploma', label: 'Diploma', order: 4 },
  GRADUATE: { value: 'graduate', label: 'Graduate (Bachelor\'s)', order: 5 },
  POST_GRADUATE: { value: 'post_graduate', label: 'Post Graduate (Master\'s)', order: 6 },
  DOCTORATE: { value: 'doctorate', label: 'Doctorate (PhD)', order: 7 },
  PROFESSIONAL: { value: 'professional', label: 'Professional Certification', order: 8 }
};
```

## Master Data: Employment Types

```javascript
export const EMPLOYMENT_TYPES = {
  FULL_TIME: { value: 'full_time', label: 'Full Time' },
  PART_TIME: { value: 'part_time', label: 'Part Time' },
  CONTRACT: { value: 'contract', label: 'Contract' },
  INTERN: { value: 'intern', label: 'Internship' },
  CONSULTANT: { value: 'consultant', label: 'Consultant' }
};
```

## State Definitions

### draft

```javascript
draft: {
  name: 'Draft',
  description: 'Position details being entered',
  transitions: ['submitted'],

  onEnter: async (processInstance, context) => {
    // Generate position ID
    if (!processInstance.variables.positionId) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      processInstance.variables.positionId = `POS-${timestamp}-${random}`;
    }
    processInstance.variables.createdAt = new Date().toISOString();
  },

  requiredActions: [
    {
      type: 'form',
      role: ['hr_team', 'department_head'],
      message: 'Complete position details and submit for approval',
      actionLabel: 'Submit for Approval'
    }
  ]
}
```

### submitted

```javascript
submitted: {
  name: 'Submitted',
  description: 'Position submitted, initiating parallel approvals',
  transitions: ['pending_hr_approval', 'pending_dept_approval'],

  onEnter: async (processInstance, context) => {
    processInstance.variables.submittedAt = new Date().toISOString();
    processInstance.variables.hrApprovalStatus = 'pending';
    processInstance.variables.deptApprovalStatus = 'pending';

    // TODO: Send notification to HR Head and Department Head
  },

  // Auto-transition to parallel approval states
  autoTransition: {
    conditions: [{ type: 'immediate', toState: 'pending_approval' }]
  }
}
```

### pending_approval (Parallel Approval State)

```javascript
pending_approval: {
  name: 'Pending Approval',
  description: 'Waiting for both HR and Department approval',
  transitions: ['approved', 'rejected'],

  requiredActions: [
    {
      type: 'approval',
      role: 'hr_head',
      message: 'Review and approve position from HR perspective',
      actionLabel: 'HR Approval',
      metadata: {
        approveLabel: 'Approve',
        rejectLabel: 'Reject',
        field: 'hrApprovalStatus'
      }
    },
    {
      type: 'approval',
      role: 'department_head',
      message: 'Review and approve position from Department perspective',
      actionLabel: 'Department Approval',
      metadata: {
        approveLabel: 'Approve',
        rejectLabel: 'Reject',
        field: 'deptApprovalStatus'
      }
    }
  ],

  // Check if both approvals are complete
  onAction: async (processInstance, action, context) => {
    if (action.type === 'hr_approval') {
      processInstance.variables.hrApprovalStatus = context.approved ? 'approved' : 'rejected';
      processInstance.variables.hrApprovedById = context.userId;
      processInstance.variables.hrApprovedAt = new Date().toISOString();
      processInstance.variables.hrApprovalNotes = context.notes;
    }

    if (action.type === 'dept_approval') {
      processInstance.variables.deptApprovalStatus = context.approved ? 'approved' : 'rejected';
      processInstance.variables.deptApprovedById = context.userId;
      processInstance.variables.deptApprovedAt = new Date().toISOString();
      processInstance.variables.deptApprovalNotes = context.notes;
    }

    // Check transition conditions
    const hrStatus = processInstance.variables.hrApprovalStatus;
    const deptStatus = processInstance.variables.deptApprovalStatus;

    // If either rejected, transition to rejected
    if (hrStatus === 'rejected' || deptStatus === 'rejected') {
      return { transition: 'rejected' };
    }

    // If both approved, transition to approved
    if (hrStatus === 'approved' && deptStatus === 'approved') {
      return { transition: 'approved' };
    }

    // Stay in current state waiting for other approval
    return { transition: null };
  }
}
```

### approved

```javascript
approved: {
  name: 'Approved',
  description: 'Position approved by both HR and Department',
  transitions: ['active'],

  onEnter: async (processInstance, context) => {
    processInstance.variables.approvedAt = new Date().toISOString();

    // TODO: Notify relevant stakeholders
  },

  requiredActions: [
    {
      type: 'manual',
      role: ['hr_team', 'admin'],
      message: 'Activate position to open for applications',
      actionLabel: 'Activate Position'
    }
  ]
}
```

### active

```javascript
active: {
  name: 'Active',
  description: 'Position is open for job applications',
  transitions: ['closed'],

  onEnter: async (processInstance, context) => {
    processInstance.variables.activatedAt = new Date().toISOString();

    // TODO: Create position entity for Job Application lookup
    // This allows Job Applications to reference this position
  },

  requiredActions: [
    {
      type: 'manual',
      role: ['hr_team', 'admin'],
      message: 'Close position when filled or no longer needed',
      actionLabel: 'Close Position'
    }
  ]
}
```

### closed

```javascript
closed: {
  name: 'Closed',
  description: 'Position is closed',
  transitions: [], // Terminal state

  onEnter: async (processInstance, context) => {
    processInstance.variables.closedAt = new Date().toISOString();
    processInstance.variables.closeReason = context.reason;
    processInstance.variables.closeNotes = context.notes;
    processInstance.variables.positionsFilled = context.positionsFilled || 0;
  }
}
```

### rejected

```javascript
rejected: {
  name: 'Rejected',
  description: 'Position rejected by approver',
  transitions: [], // Terminal state

  onEnter: async (processInstance, context) => {
    processInstance.variables.rejectedAt = new Date().toISOString();

    // Determine who rejected
    const hrStatus = processInstance.variables.hrApprovalStatus;
    const deptStatus = processInstance.variables.deptApprovalStatus;

    if (hrStatus === 'rejected') {
      processInstance.variables.rejectedBy = 'HR';
      processInstance.variables.rejectionReason = processInstance.variables.hrApprovalNotes;
    } else if (deptStatus === 'rejected') {
      processInstance.variables.rejectedBy = 'Department';
      processInstance.variables.rejectionReason = processInstance.variables.deptApprovalNotes;
    }
  }
}
```

## Integration Points

### With Job Application Process

The Position entity created by this process is referenced by the Job Application process:

```javascript
// In job-application.js
jobId: {
  type: 'string',
  required: true,
  step: 'create',
  inputType: 'entityLookup',
  lookup: {
    entity: 'positions',  // References positions created by this process
    filter: { status: 'active' },  // Only show active positions
    searchFields: ['designation', 'department', 'team'],
    displayTemplate: '{designation} - {department}'
  }
}
```

### Position Entity Storage

When a position becomes `active`, create an entity record:

```javascript
// Entity structure for position lookup
{
  _id: 'position:POS-1234567890-123',
  type: 'position',
  positionId: 'POS-1234567890-123',
  designation: 'Senior Software Engineer',
  departmentId: 'dept_engineering',
  departmentName: 'Engineering',
  teamId: 'team_backend',
  teamName: 'Backend Team',
  status: 'active',
  educationLevel: 'graduate',
  experienceMin: 3,
  salaryMin: 80000,
  salaryMax: 120000,
  createdAt: '2024-01-15T10:00:00Z',
  activatedAt: '2024-01-16T14:00:00Z'
}
```

## Metadata

```javascript
metadata: {
  category: PROCESS_CATEGORIES.HR,
  tags: ['position', 'recruitment', 'hr', 'hiring', 'job-opening'],
  icon: 'briefcase-outline',
  color: '#8b5cf6', // purple
  sla: {
    draft_to_submitted: 7 * 24 * 60 * 60 * 1000,  // 7 days
    submitted_to_approved: 5 * 24 * 60 * 60 * 1000  // 5 days
  }
}
```

## Usage Example

```javascript
// Create a new position
const position = await processService.createProcess({
  definitionId: 'position_creation_v1',
  variables: {
    departmentId: 'dept_engineering',
    teamId: 'team_backend',
    designation: 'Senior Software Engineer',
    jobDescription: 'Design and develop backend services...',
    employmentType: 'full_time',
    numberOfPositions: 2,
    salaryMin: 80000,
    salaryMax: 120000,
    salaryCurrency: 'INR',
    salaryPeriod: 'month',
    educationLevel: 'graduate',
    educationSubject: 'Computer Science or related',
    experienceMin: 3,
    experienceMax: 7,
    skillsRequired: ['Node.js', 'Python', 'PostgreSQL', 'REST APIs'],
    skillsPreferred: ['Docker', 'Kubernetes', 'AWS']
  }
});

// Submit for approval
await processService.transition(position._id, 'submitted', {});

// HR approves
await processService.executeAction(position._id, 'hr_approval', {
  approved: true,
  notes: 'Salary range approved, job description clear'
});

// Department Head approves
await processService.executeAction(position._id, 'dept_approval', {
  approved: true,
  notes: 'Team needs this role urgently'
});

// Activate position
await processService.transition(position._id, 'active', {});
```

## Future Enhancements

1. **Position Templates** - Create reusable templates for common positions
2. **Budget Integration** - Link to budget approval process
3. **Headcount Planning** - Integration with annual headcount planning
4. **Auto-close** - Automatically close when all positions filled
5. **Position Modification** - Workflow for modifying active positions
6. **Position Cloning** - Clone existing position for similar roles
