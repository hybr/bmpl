/**
 * Environment Configuration
 *
 * These values should be overridden by environment variables in production
 */

const ENV = {
  // API Configuration
  AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000/api/auth',

  // CouchDB Configuration
  COUCHDB_URL: import.meta.env.VITE_COUCHDB_URL || 'http://localhost:5984',
  COUCHDB_USE_SSL: import.meta.env.VITE_COUCHDB_USE_SSL === 'true' || false,

  // App Configuration
  APP_NAME: 'V4L',
  APP_FULL_NAME: 'Vocal 4 Local',
  APP_VERSION: '1.0.0',
  APP_DOMAIN: 'v4l.app',
  APP_URL: import.meta.env.VITE_APP_URL || 'https://v4l.app',

  // Feature Flags
  ENABLE_BIOMETRIC: import.meta.env.VITE_ENABLE_BIOMETRIC === 'true' || false,
  ENABLE_PUSH_NOTIFICATIONS: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true' || true,

  // Performance Configuration
  SYNC_INTERVAL_MS: parseInt(import.meta.env.VITE_SYNC_INTERVAL_MS) || 60000, // 60 seconds
  DB_LAZY_DESTROY_HOURS: parseInt(import.meta.env.VITE_DB_LAZY_DESTROY_HOURS) || 24,

  // Scalability Thresholds
  SMALL_ORG_MEMBER_THRESHOLD: 50, // Orgs with < 50 members use shared DB
  LARGE_FILE_THRESHOLD_BYTES: 1048576, // 1MB - files larger than this go to blob storage

  // Development
  DEBUG: import.meta.env.DEV || false
};

// Freeze to prevent modifications
Object.freeze(ENV);

export default ENV;
