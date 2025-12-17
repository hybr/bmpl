/**
 * Utility Helper Functions
 */

import { ROLE_HIERARCHY, APPROVAL_HIERARCHY } from '../config/constants.js';

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a document ID with prefix
 * @param {string} type - Document type
 * @param {string} [id] - Optional ID, generates UUID if not provided
 * @returns {string} Document ID
 */
export function generateDocId(type, id = null) {
  return `${type}:${id || generateUUID()}`;
}

/**
 * Parse document ID to get type and ID
 * @param {string} docId - Document ID
 * @returns {{type: string, id: string}} Parsed document ID
 */
export function parseDocId(docId) {
  const parts = docId.split(':');
  return {
    type: parts[0],
    id: parts.slice(1).join(':')
  };
}

/**
 * Check if user has permission based on role hierarchy
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean} Has permission
 */
export function hasPermission(userRole, requiredRole) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user has approval permission based on approval hierarchy
 * Maps org ROLES to APPROVAL_LEVELS for comparison
 * @param {string} userApprovalLevel - User's approval level (from membership)
 * @param {string} requiredApprovalLevel - Required approval level for the task
 * @returns {boolean} Has approval permission
 */
export function hasApprovalPermission(userApprovalLevel, requiredApprovalLevel) {
  // If no requirement, allow all
  if (!requiredApprovalLevel) {
    return true;
  }

  // If user has no approval level, deny
  if (!userApprovalLevel) {
    return false;
  }

  // Get hierarchy levels
  const userLevel = APPROVAL_HIERARCHY[userApprovalLevel] || 0;
  const requiredLevel = APPROVAL_HIERARCHY[requiredApprovalLevel] || 0;

  // User level must be >= required level
  return userLevel >= requiredLevel;
}

/**
 * Map organization role to default approval level
 * @param {string} orgRole - Organization role (owner, admin, member, viewer)
 * @returns {string} Default approval level
 */
export function mapRoleToApprovalLevel(orgRole) {
  const mapping = {
    'owner': 'owner',
    'admin': 'admin',
    'member': 'member',
    'viewer': 'member'
  };
  return mapping[orgRole] || 'member';
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval);

    if (interval >= 1) {
      return interval === 1
        ? `1 ${name} ago`
        : `${interval} ${name}s ago`;
    }
  }

  return 'just now';
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Get initials from name
 * @param {string} name - Name
 * @returns {string} Initials
 */
export function getInitials(name) {
  if (!name) return '';

  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<*>} Function result
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
}

/**
 * Check if string is valid email
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} Is empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Get hash of shard number from organization ID
 * @param {string} orgId - Organization ID
 * @param {number} totalShards - Total number of shards
 * @returns {number} Shard number (1-based)
 */
export function getShardNumber(orgId, totalShards = 40) {
  let hash = 0;
  for (let i = 0; i < orgId.length; i++) {
    hash = (hash << 5) - hash + orgId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  return (Math.abs(hash) % totalShards) + 1;
}

/**
 * Format shard number with zero padding
 * @param {number} shardNumber - Shard number
 * @returns {string} Formatted shard number (e.g., "001")
 */
export function formatShardNumber(shardNumber) {
  return String(shardNumber).padStart(3, '0');
}
