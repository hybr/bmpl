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
  APP_SETTINGS: 'app_settings'
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
  PROCESS_CREATED: 'process:created',
  PROCESS_STATE_CHANGED: 'process:state:changed',
  PROCESS_UPDATED: 'process:updated',
  PROCESS_COMPLETED: 'process:completed',
  PROCESS_CANCELLED: 'process:cancelled',
  PROCESS_FAILED: 'process:failed',
  PROCESS_SYNC_STARTED: 'process:sync:started',
  PROCESS_SYNC_COMPLETED: 'process:sync:completed',
  PROCESS_SYNC_ERROR: 'process:sync:error'
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

// Process Types
export const PROCESS_TYPES = {
  ORDER: 'order',
  JOB_APPLICATION: 'job_application',
  TASK: 'task',
  ONBOARDING: 'onboarding',
  CUSTOM: 'custom'
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
