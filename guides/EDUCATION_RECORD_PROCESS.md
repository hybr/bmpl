# Education Record Process

## Overview

The Education Record Process allows users to record and manage their educational qualifications. This is a self-service feature where users can add multiple education records (10th, 12th, Graduation, Post-Graduation, etc.) to build their educational profile.

**Key Features:**
- Self-service (no approval workflow)
- Multiple records per user
- Track completed and in-progress education
- Link to institutes (organizations in the system)
- Support for document/certificate uploads

## Process Definition Summary

| Property | Value |
|----------|-------|
| **Process ID** | `education_record_v1` |
| **Name** | Education Record |
| **Category** | User Profile |
| **Type** | `PROCESS_TYPES.EDUCATION_RECORD` |
| **Initial State** | `draft` |
| **Terminal States** | `active`, `archived` |
| **Approval Required** | No (self-service) |

## Process Flow

```
┌─────────┐         ┌─────────┐         ┌───────────┐
│         │  Save   │         │ Archive │           │
│  DRAFT  │────────►│  ACTIVE │────────►│ ARCHIVED  │
│         │         │         │         │           │
└─────────┘         └─────────┘         └───────────┘
     │                   │
     │    Cancel         │  Edit (returns to draft)
     └───────────────────┘
```

### State Descriptions

| State | Description |
|-------|-------------|
| `draft` | Record being entered or edited |
| `active` | Record saved and visible in user profile |
| `archived` | Record hidden/soft-deleted |

## Variables Schema

### System Fields (auto-generated, step: 'system')

| Field | Type | Description |
|-------|------|-------------|
| `educationId` | string | Auto-generated unique ID (e.g., EDU-1734567890-123) |
| `userId` | string | Owner user ID (auto-set from logged-in user) |
| `createdAt` | date | Timestamp when record was created |
| `updatedAt` | date | Timestamp when record was last updated |

### Education Details (step: 'create')

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `educationLevel` | string | Yes | select | Education level from EDUCATION_LEVELS enum |
| `subject` | string | Yes | select | Subject/Stream from SUBJECTS enum |
| `specialization` | string | No | text | Specific specialization (e.g., "Computer Science") |
| `instituteId` | string | Yes | entityLookup | Institute/University (organization in system) |
| `instituteName` | string | No | text | Institute name if not in system (fallback) |
| `boardUniversity` | string | No | text | Board/University name (e.g., "CBSE", "Mumbai University") |

### Duration & Completion

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `startMonth` | number | No | select | Start month (1-12) |
| `startYear` | number | No | number | Start year (e.g., 2018) |
| `endMonth` | number | Conditional | select | End month (required if status is COMPLETED) |
| `endYear` | number | Conditional | number | End year (required if status is COMPLETED) |
| `status` | string | Yes | select | Education status from EDUCATION_STATUS enum |

### Performance

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `marksType` | string | Yes | select | Percentage, CGPA, Grade |
| `marksValue` | number | Yes | number | Actual marks/CGPA value |
| `marksOutOf` | number | No | number | Maximum marks (e.g., 100 for %, 10 for CGPA) |
| `division` | string | No | select | First, Second, Third, Pass (optional) |
| `rank` | number | No | number | Rank if applicable |

### Documents

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `certificate` | object | No | file | Uploaded certificate/marksheet |
| `certificateUrl` | string | No | text | URL to certificate if stored externally |
| `verified` | boolean | No | toggle | Whether certificate has been verified (admin only) |

### Additional Info

| Field | Type | Required | Input Type | Description |
|-------|------|----------|------------|-------------|
| `achievements` | string | No | multiline | Notable achievements during this education |
| `notes` | string | No | multiline | Additional notes |

## Master Data Enums

### EDUCATION_LEVELS

Common education levels shared across organizations:

```javascript
export const EDUCATION_LEVELS = {
  PRIMARY: {
    value: 'primary',
    label: 'Primary Education (1st-5th)',
    order: 1
  },
  MIDDLE: {
    value: 'middle',
    label: 'Middle School (6th-8th)',
    order: 2
  },
  SECONDARY: {
    value: 'secondary',
    label: 'Secondary (10th)',
    order: 3
  },
  HIGHER_SECONDARY: {
    value: 'higher_secondary',
    label: 'Higher Secondary (12th)',
    order: 4
  },
  DIPLOMA: {
    value: 'diploma',
    label: 'Diploma',
    order: 5
  },
  GRADUATE: {
    value: 'graduate',
    label: 'Graduate (Bachelor\'s)',
    order: 6
  },
  POST_GRADUATE: {
    value: 'post_graduate',
    label: 'Post Graduate (Master\'s)',
    order: 7
  },
  DOCTORATE: {
    value: 'doctorate',
    label: 'Doctorate (PhD)',
    order: 8
  },
  PROFESSIONAL: {
    value: 'professional',
    label: 'Professional Certification',
    order: 9
  }
};
```

### SUBJECTS

Common subjects/streams:

```javascript
export const SUBJECTS = {
  // School Level
  GENERAL: { value: 'general', label: 'General', levels: ['primary', 'middle'] },

  // Higher Secondary Streams
  SCIENCE: { value: 'science', label: 'Science (PCM/PCB)', levels: ['higher_secondary'] },
  COMMERCE: { value: 'commerce', label: 'Commerce', levels: ['higher_secondary'] },
  ARTS: { value: 'arts', label: 'Arts/Humanities', levels: ['higher_secondary'] },

  // Graduate/Post-Graduate
  ENGINEERING: { value: 'engineering', label: 'Engineering/Technology', levels: ['graduate', 'post_graduate'] },
  MEDICINE: { value: 'medicine', label: 'Medicine/Healthcare', levels: ['graduate', 'post_graduate'] },
  MANAGEMENT: { value: 'management', label: 'Management/MBA', levels: ['graduate', 'post_graduate'] },
  LAW: { value: 'law', label: 'Law', levels: ['graduate', 'post_graduate'] },
  SCIENCE_UG: { value: 'science_ug', label: 'Science (BSc/MSc)', levels: ['graduate', 'post_graduate'] },
  COMMERCE_UG: { value: 'commerce_ug', label: 'Commerce (BCom/MCom)', levels: ['graduate', 'post_graduate'] },
  ARTS_UG: { value: 'arts_ug', label: 'Arts (BA/MA)', levels: ['graduate', 'post_graduate'] },
  EDUCATION: { value: 'education', label: 'Education (BEd/MEd)', levels: ['graduate', 'post_graduate'] },
  COMPUTER_APPLICATIONS: { value: 'computer_applications', label: 'Computer Applications (BCA/MCA)', levels: ['graduate', 'post_graduate'] },

  // Professional
  CA: { value: 'ca', label: 'Chartered Accountancy', levels: ['professional'] },
  CS: { value: 'cs', label: 'Company Secretary', levels: ['professional'] },
  CFA: { value: 'cfa', label: 'CFA', levels: ['professional'] },

  // Other
  OTHER: { value: 'other', label: 'Other', levels: ['all'] }
};
```

### EDUCATION_STATUS

```javascript
export const EDUCATION_STATUS = {
  COMPLETED: {
    value: 'completed',
    label: 'Completed',
    icon: 'checkmark-circle',
    color: 'success'
  },
  IN_PROGRESS: {
    value: 'in_progress',
    label: 'In Progress',
    icon: 'time',
    color: 'primary'
  },
  DROPPED: {
    value: 'dropped',
    label: 'Dropped',
    icon: 'close-circle',
    color: 'danger'
  },
  ON_HOLD: {
    value: 'on_hold',
    label: 'On Hold',
    icon: 'pause-circle',
    color: 'warning'
  }
};
```

### MARKS_TYPE

```javascript
export const MARKS_TYPE = {
  PERCENTAGE: { value: 'percentage', label: 'Percentage', maxValue: 100, suffix: '%' },
  CGPA_10: { value: 'cgpa_10', label: 'CGPA (out of 10)', maxValue: 10, suffix: '' },
  CGPA_4: { value: 'cgpa_4', label: 'GPA (out of 4)', maxValue: 4, suffix: '' },
  GRADE: { value: 'grade', label: 'Grade', maxValue: null, suffix: '' }
};
```

## State Definitions

### draft

```javascript
draft: {
  name: 'Draft',
  description: 'Education record being entered or edited',
  transitions: ['active'],

  onEnter: async (processInstance, context) => {
    // Generate education ID for new records
    if (!processInstance.variables.educationId) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      processInstance.variables.educationId = `EDU-${timestamp}-${random}`;
      processInstance.variables.createdAt = new Date().toISOString();
    }

    // Set user ID from context
    if (!processInstance.variables.userId && context.userId) {
      processInstance.variables.userId = context.userId;
    }
  },

  requiredActions: [
    {
      type: 'form',
      role: ['owner'], // Only the user who owns this record
      message: 'Complete education details',
      actionLabel: 'Save Record'
    }
  ]
}
```

### active

```javascript
active: {
  name: 'Active',
  description: 'Education record is saved and visible',
  transitions: ['draft', 'archived'],

  onEnter: async (processInstance, context) => {
    processInstance.variables.updatedAt = new Date().toISOString();

    console.log(`Education record ${processInstance.variables.educationId} saved`);
  },

  requiredActions: [
    {
      type: 'manual',
      role: ['owner'],
      message: 'Edit or archive this record',
      actions: [
        { label: 'Edit', transition: 'draft' },
        { label: 'Archive', transition: 'archived' }
      ]
    }
  ]
}
```

### archived

```javascript
archived: {
  name: 'Archived',
  description: 'Education record is archived (soft deleted)',
  transitions: ['active'], // Can be restored

  onEnter: async (processInstance, context) => {
    processInstance.variables.archivedAt = new Date().toISOString();
    processInstance.variables.archivedReason = context.reason || 'User archived';
  },

  requiredActions: [
    {
      type: 'manual',
      role: ['owner'],
      message: 'Restore this archived record',
      actionLabel: 'Restore'
    }
  ]
}
```

## Validation Rules

### Required Field Validation

```javascript
const validationRules = {
  // Basic required fields
  educationLevel: { required: true },
  subject: { required: true },
  status: { required: true },
  marksType: { required: true },
  marksValue: { required: true },

  // Conditional: End date required if completed
  endMonth: {
    required: (values) => values.status === 'completed',
    message: 'End month is required for completed education'
  },
  endYear: {
    required: (values) => values.status === 'completed',
    message: 'End year is required for completed education'
  },

  // Institute: Either instituteId or instituteName required
  instituteId: {
    required: (values) => !values.instituteName,
    message: 'Select an institute or enter institute name'
  }
};
```

### Marks Validation

```javascript
const marksValidation = {
  percentage: { min: 0, max: 100 },
  cgpa_10: { min: 0, max: 10 },
  cgpa_4: { min: 0, max: 4 },
  grade: { pattern: /^[A-F][+-]?$|^O$/ } // A+, A, A-, B+, ... F, O (Outstanding)
};
```

### Date Validation

```javascript
const dateValidation = {
  // End date must be after start date
  endDate: (values) => {
    if (values.startYear && values.endYear) {
      if (values.endYear < values.startYear) {
        return 'End year must be after start year';
      }
      if (values.endYear === values.startYear && values.endMonth < values.startMonth) {
        return 'End month must be after start month';
      }
    }
    return null;
  },

  // Future dates allowed only for in-progress
  futureDate: (values) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (values.status === 'completed') {
      if (values.endYear > currentYear ||
          (values.endYear === currentYear && values.endMonth > currentMonth)) {
        return 'Completion date cannot be in the future';
      }
    }
    return null;
  }
};
```

## Integration Points

### With Job Application Process

Education records can be displayed when a user applies for a job:

```javascript
// In job application, fetch user's education
const userEducation = await educationService.getByUserId(applicantId);

// Display in application
const highestEducation = userEducation
  .filter(e => e.status === 'completed')
  .sort((a, b) => EDUCATION_LEVELS[b.educationLevel].order - EDUCATION_LEVELS[a.educationLevel].order)[0];
```

### With Position Matching

Match candidate education with position requirements:

```javascript
function meetsEducationRequirement(candidateEducation, positionRequirement) {
  const candidateLevel = EDUCATION_LEVELS[candidateEducation.educationLevel].order;
  const requiredLevel = EDUCATION_LEVELS[positionRequirement.educationLevel].order;

  return candidateLevel >= requiredLevel;
}
```

## UI Considerations

### Education List View

```
┌─────────────────────────────────────────────────────────┐
│ My Education                              [+ Add New]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🎓 Post Graduate (Master's)            ✓ Completed │ │
│ │    MBA - Finance                                    │ │
│ │    XYZ Business School | 2020-2022                 │ │
│ │    CGPA: 8.5/10                        [Edit] [⋮]  │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🎓 Graduate (Bachelor's)               ✓ Completed │ │
│ │    B.Tech - Computer Science                       │ │
│ │    ABC Engineering College | 2016-2020            │ │
│ │    Percentage: 78%                     [Edit] [⋮]  │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🎓 Higher Secondary (12th)             ✓ Completed │ │
│ │    Science (PCM)                                   │ │
│ │    City Public School | 2014-2016                 │ │
│ │    Percentage: 85%                     [Edit] [⋮]  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Add/Edit Form Layout

```
┌─────────────────────────────────────────────────────────┐
│ Add Education Record                              [X]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Education Level *        [Graduate (Bachelor's)    ▼]  │
│                                                         │
│ Subject/Stream *         [Engineering/Technology   ▼]  │
│                                                         │
│ Specialization           [Computer Science          ]  │
│                                                         │
│ Institute *              [🔍 Search institute...    ]  │
│                                                         │
│ Board/University         [State Technical Univ.     ]  │
│                                                         │
│ ─────────────── Duration ───────────────                │
│                                                         │
│ Start    [Month ▼] [Year    ]    Status  [Completed ▼] │
│ End      [Month ▼] [Year    ]                          │
│                                                         │
│ ─────────────── Performance ───────────────             │
│                                                         │
│ Marks Type *  [Percentage ▼]   Value * [78    ] %      │
│                                                         │
│ Division      [First      ▼]   Rank    [       ]       │
│                                                         │
│ ─────────────── Documents ───────────────               │
│                                                         │
│ Certificate   [📎 Upload certificate/marksheet]        │
│                                                         │
│ Achievements  [                                    ]    │
│               [                                    ]    │
│                                                         │
│                              [Cancel]  [Save Record]   │
└─────────────────────────────────────────────────────────┘
```

## Entity Storage

Education records are stored in PouchDB/CouchDB:

```javascript
// Document structure
{
  _id: 'education:EDU-1734567890-123',
  type: 'education_record',
  userId: 'user:john_doe',
  educationId: 'EDU-1734567890-123',
  educationLevel: 'graduate',
  subject: 'engineering',
  specialization: 'Computer Science',
  instituteId: 'org:abc_college',
  instituteName: 'ABC Engineering College',
  boardUniversity: 'State Technical University',
  startMonth: 7,
  startYear: 2016,
  endMonth: 5,
  endYear: 2020,
  status: 'completed',
  marksType: 'percentage',
  marksValue: 78,
  marksOutOf: 100,
  division: 'first',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
}
```

## Metadata

```javascript
metadata: {
  category: PROCESS_CATEGORIES.USER_PROFILE,
  tags: ['education', 'qualification', 'profile', 'self-service'],
  icon: 'school-outline',
  color: '#10b981', // green
  permissions: {
    create: ['authenticated'],
    view: ['owner', 'hr_team', 'admin'],
    edit: ['owner'],
    delete: ['owner', 'admin']
  }
}
```

## Usage Examples

### Add Education Record

```javascript
// Create a new education record
const education = await processService.createProcess({
  definitionId: 'education_record_v1',
  variables: {
    educationLevel: 'graduate',
    subject: 'engineering',
    specialization: 'Computer Science',
    instituteId: 'org:abc_college',
    startMonth: 7,
    startYear: 2016,
    endMonth: 5,
    endYear: 2020,
    status: 'completed',
    marksType: 'percentage',
    marksValue: 78
  }
});

// Save (transition to active)
await processService.transition(education._id, 'active', {});
```

### Get User's Education

```javascript
// Get all education records for a user
const educationRecords = await db.find({
  selector: {
    type: 'education_record',
    userId: currentUserId,
    status: { $ne: 'archived' }
  },
  sort: [{ 'variables.startYear': 'desc' }]
});
```

### Check Qualification

```javascript
// Check if user meets minimum education requirement
function hasMinimumEducation(userEducation, requiredLevel) {
  const requiredOrder = EDUCATION_LEVELS[requiredLevel].order;

  return userEducation.some(edu => {
    const eduOrder = EDUCATION_LEVELS[edu.educationLevel].order;
    return eduOrder >= requiredOrder && edu.status === 'completed';
  });
}
```
