/**
 * Application Constants
 */

// User Roles
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer'
};

// Role Hierarchy (for permission checking)
export const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.MEMBER]: 2,
  [ROLES.VIEWER]: 1
};

// Document Types
export const DOC_TYPES = {
  ORGANIZATION: 'organization',
  MEMBER: 'member',
  ACTIVITY: 'activity',
  INDUSTRY: 'industry',
  COUNTRY: 'country',
  DATA: 'data',
  PROCESS_DEFINITION: 'process_definition',
  PROCESS_INSTANCE: 'process_instance',
  STEP_EXECUTION: 'step_execution'
};

// Activity Actions
export const ACTIVITY_ACTIONS = {
  ORG_CREATED: 'organization.created',
  ORG_UPDATED: 'organization.updated',
  ORG_DELETED: 'organization.deleted',
  MEMBER_JOINED: 'member.joined',
  MEMBER_LEFT: 'member.left',
  MEMBER_INVITED: 'member.invited',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  SETTINGS_UPDATED: 'settings.updated'
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  ACTIVE_ORG_ID: 'active_org_id',
  COUCHDB_CREDENTIALS: 'couchdb_credentials',
  APP_SETTINGS: 'app_settings',
  ORG_MEMBERS: 'org_members',
  NOTIFICATIONS: 'notifications'
};

// Database Names
export const DB_NAMES = {
  SHARED: 'v4l_shared',
  ORG_PREFIX: 'v4l_org_',
  SHARD_PREFIX: 'v4l_orgs_shard_'
};

// Sync States
export const SYNC_STATES = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  ERROR: 'error',
  PAUSED: 'paused'
};

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HOME: '/home',
  MARKETPLACE: '/marketplace',
  OPPORTUNITIES: '/opportunities',
  MYSPACE: '/myspace',
  ACCOUNT: '/account',
  ORG_LIST: '/organizations',
  ORG_DETAIL: '/organizations/:id',
  ORG_SETTINGS: '/organizations/:id/settings',
  ORG_MEMBERS: '/organizations/:id/members',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};

// Event Names
export const EVENTS = {
  AUTH_STATE_CHANGED: 'auth:statechanged',
  ORG_SWITCHED: 'org:switched',
  SYNC_STATE_CHANGED: 'sync:statechanged',
  NETWORK_STATE_CHANGED: 'network:statechanged',
  DB_CHANGE: 'db:change',
  ERROR: 'app:error',

  // Process Events
  PROCESS_CREATED: 'process:created',
  PROCESS_STATE_CHANGED: 'process:state:changed',
  PROCESS_UPDATED: 'process:updated',
  PROCESS_COMPLETED: 'process:completed',
  PROCESS_CANCELLED: 'process:cancelled',
  PROCESS_FAILED: 'process:failed',
  PROCESS_SYNC_STARTED: 'process:sync:started',
  PROCESS_SYNC_COMPLETED: 'process:sync:completed',
  PROCESS_SYNC_ERROR: 'process:sync:error',

  // Document Events
  DOCUMENT_UPLOADED: 'document:uploaded',
  DOCUMENT_DELETED: 'document:deleted',
  DOCUMENT_DOWNLOADED: 'document:downloaded',

  // Task Events
  TASK_ASSIGNED: 'task:assigned',
  TASK_COMPLETED: 'task:completed',

  // Analytics Events
  ANALYTICS_UPDATED: 'analytics:updated',

  // Navigation Events
  NAVIGATION_TAB_CHANGED: 'navigation:tab-changed',
  NAVIGATION_SUBTAB_CLICKED: 'navigation:subtab-clicked',
  NAVIGATION_LEVEL_CHANGED: 'navigation:level-changed',

  // Member Events
  MEMBER_ADDED: 'member:added',
  MEMBER_REMOVED: 'member:removed',
  MEMBER_ROLE_CHANGED: 'member:role:changed',

  // Notification Events
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATIONS_CLEARED: 'notifications:cleared'
};

// Error Codes
export const ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DB_ERROR: 'DB_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Process Categories
export const PROCESS_CATEGORIES = {
  FINANCIAL: 'financial',
  OPERATIONS: 'operations',
  HR: 'hr',
  SUPPLY_CHAIN: 'supply_chain',
  PROJECTS: 'projects',
  MARKETING: 'marketing',
  IT: 'it',
  CUSTOMER: 'customer',
  COMPLIANCE: 'compliance'
};

// Process Types
export const PROCESS_TYPES = {
  // Existing
  ORDER: 'order',
  JOB_APPLICATION: 'job_application',
  TASK: 'task',
  ONBOARDING: 'onboarding',
  CUSTOM: 'custom',

  // Financial
  FINANCIAL_INVOICE: 'financial_invoice',
  FINANCIAL_EXPENSE: 'financial_expense',
  FINANCIAL_BUDGET: 'financial_budget',

  // Operations
  OPS_SALES_ORDER: 'ops_sales_order',
  OPS_SERVICE_REQUEST: 'ops_service_request',
  OPS_INVENTORY: 'ops_inventory',

  // HR
  HR_ONBOARDING: 'hr_onboarding',
  HR_LEAVE: 'hr_leave',
  HR_PERFORMANCE: 'hr_performance',

  // Supply Chain
  SC_PURCHASE_ORDER: 'sc_purchase_order',
  SC_VENDOR_ONBOARDING: 'sc_vendor_onboarding',
  SC_QC_INSPECTION: 'sc_qc_inspection',

  // Projects
  PROJECT_INITIATION: 'project_initiation',
  PROJECT_MILESTONE: 'project_milestone',

  // Marketing
  MKT_CAMPAIGN: 'mkt_campaign',
  MKT_LEAD: 'mkt_lead',

  // IT
  IT_TICKET: 'it_ticket',
  IT_CHANGE_REQUEST: 'it_change_request',

  // Customer
  CUSTOMER_ONBOARDING: 'customer_onboarding',

  // Compliance
  LEGAL_CONTRACT: 'legal_contract',
  COMPLIANCE_AUDIT: 'compliance_audit'
};

// Process Status
export const PROCESS_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

// Process Sync Status
export const PROCESS_SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  SYNCING: 'syncing',
  CONFLICT: 'conflict',
  ERROR: 'error'
};

// Process Priority Levels
export const PROCESS_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Approval Levels (extends ROLES for process approvals)
export const APPROVAL_LEVELS = {
  MEMBER: 'member',
  MANAGER: 'manager',
  ADMIN: 'admin',
  DIRECTOR: 'director',
  EXECUTIVE: 'executive',
  OWNER: 'owner'
};

// Approval Level Hierarchy (for permission checking)
export const APPROVAL_HIERARCHY = {
  [APPROVAL_LEVELS.MEMBER]: 1,
  [APPROVAL_LEVELS.MANAGER]: 2,
  [APPROVAL_LEVELS.ADMIN]: 3,
  [APPROVAL_LEVELS.DIRECTOR]: 4,
  [APPROVAL_LEVELS.EXECUTIVE]: 5,
  [APPROVAL_LEVELS.OWNER]: 6
};

// Notification Types
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  PROCESS_CREATED: 'process_created',
  PROCESS_COMPLETED: 'process_completed',
  APPROVAL_NEEDED: 'approval_needed',
  APPROVAL_RECEIVED: 'approval_received',
  MEMBER_JOINED: 'member_joined',
  ROLE_CHANGED: 'role_changed'
};

// Username Validation
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z0-9_]+$/; // lowercase, numbers, underscores

// Security Questions
export const MIN_SECURITY_QUESTIONS = 3;
export const MAX_SECURITY_QUESTIONS = 5;
export const RESET_QUESTIONS_REQUIRED = 2;

// Predefined Security Questions
export const SECURITY_QUESTIONS = [
  { id: 'sq1', text: 'What is your mother\'s maiden name?' },
  { id: 'sq2', text: 'What was the name of your first pet?' },
  { id: 'sq3', text: 'What city were you born in?' },
  { id: 'sq4', text: 'What is the name of your favorite childhood teacher?' },
  { id: 'sq5', text: 'What was your childhood nickname?' },
  { id: 'sq6', text: 'What is the name of the street you grew up on?' },
  { id: 'sq7', text: 'What was the make and model of your first car?' },
  { id: 'sq8', text: 'What is your favorite book?' },
  { id: 'sq9', text: 'What is your favorite movie?' },
  { id: 'sq10', text: 'In what city did you meet your spouse/partner?' }
];

// Password Reset
export const RESET_TOKEN_EXPIRY_HOURS = 1;

// Routes for password reset
export const ROUTES_AUTH = {
  ...ROUTES,
  REGISTER: '/register',
  PASSWORD_RESET: '/password-reset',
  PASSWORD_RESET_CONFIRM: '/password-reset-confirm'
};

// Document Management
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_PROCESS = 20;
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

export const FILE_TYPE_ICONS = {
  'application/pdf': 'document',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'application/msword': 'document-text',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document-text',
  'application/vnd.ms-excel': 'grid',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'grid',
  'text/plain': 'document-text',
  'text/csv': 'grid',
  'default': 'document-attach'
};

// Analytics
export const ANALYTICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const ANALYTICS_DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom'
};

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
