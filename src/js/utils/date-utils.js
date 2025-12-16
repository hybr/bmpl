/**
 * Date Utilities
 * Helper functions for date formatting and calculations
 */

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export function formatDate(date, options = {}) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time
 */
export function formatDateTime(date) {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format time only
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time
 */
export function formatTime(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @param {boolean} short - Use short format (e.g., "2h 30m" vs "2 hours 30 minutes")
 * @returns {string} Formatted duration
 */
export function formatDuration(ms, short = false) {
  if (!ms || ms <= 0) return short ? '0s' : '0 seconds';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const parts = [];

  if (years > 0) {
    parts.push(short ? `${years}y` : `${years} ${years === 1 ? 'year' : 'years'}`);
  }
  if (months > 0 && years === 0) {
    parts.push(short ? `${months}mo` : `${months} ${months === 1 ? 'month' : 'months'}`);
  }
  if (weeks > 0 && months === 0 && years === 0) {
    parts.push(short ? `${weeks}w` : `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`);
  }
  if (days % 7 > 0 && weeks < 4 && months === 0) {
    const d = days % 7;
    parts.push(short ? `${d}d` : `${d} ${d === 1 ? 'day' : 'days'}`);
  }
  if (hours % 24 > 0 && days === 0) {
    const h = hours % 24;
    parts.push(short ? `${h}h` : `${h} ${h === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes % 60 > 0 && hours === 0) {
    const m = minutes % 60;
    parts.push(short ? `${m}m` : `${m} ${m === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds % 60 > 0 && minutes === 0) {
    const s = seconds % 60;
    parts.push(short ? `${s}s` : `${s} ${s === 1 ? 'second' : 'seconds'}`);
  }

  return parts.slice(0, 2).join(short ? ' ' : ' and ');
}

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add hours to a date
 * @param {Date} date - Starting date
 * @param {number} hours - Number of hours to add
 * @returns {Date} New date
 */
export function addHours(date, hours) {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Add minutes to a date
 * @param {Date} date - Starting date
 * @param {number} minutes - Number of minutes to add
 * @returns {Date} New date
 */
export function addMinutes(date, minutes) {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Get start of day
 * @param {Date} date - Date
 * @returns {Date} Start of day
 */
export function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 * @param {Date} date - Date
 * @returns {Date} End of day
 */
export function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of week
 * @param {Date} date - Date
 * @returns {Date} Start of week (Sunday)
 */
export function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  return startOfDay(result);
}

/**
 * Get end of week
 * @param {Date} date - Date
 * @returns {Date} End of week (Saturday)
 */
export function endOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() + (6 - day);
  result.setDate(diff);
  return endOfDay(result);
}

/**
 * Get start of month
 * @param {Date} date - Date
 * @returns {Date} Start of month
 */
export function startOfMonth(date) {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
}

/**
 * Get end of month
 * @param {Date} date - Date
 * @returns {Date} End of month
 */
export function endOfMonth(date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
}

/**
 * Get start of year
 * @param {Date} date - Date
 * @returns {Date} Start of year
 */
export function startOfYear(date) {
  const result = new Date(date);
  result.setMonth(0, 1);
  return startOfDay(result);
}

/**
 * Get end of year
 * @param {Date} date - Date
 * @returns {Date} End of year
 */
export function endOfYear(date) {
  const result = new Date(date);
  result.setMonth(11, 31);
  return endOfDay(result);
}

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if today
 */
export function isToday(date) {
  const today = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
}

/**
 * Check if date is yesterday
 * @param {Date} date - Date to check
 * @returns {boolean} True if yesterday
 */
export function isYesterday(date) {
  const yesterday = addDays(new Date(), -1);
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.getDate() === yesterday.getDate() &&
         dateObj.getMonth() === yesterday.getMonth() &&
         dateObj.getFullYear() === yesterday.getFullYear();
}

/**
 * Check if date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} True if in the past
 */
export function isPast(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < new Date().getTime();
}

/**
 * Check if date is in the future
 * @param {Date} date - Date to check
 * @returns {boolean} True if in the future
 */
export function isFuture(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > new Date().getTime();
}

/**
 * Get days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days
 */
export function daysBetween(date1, date2) {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Parse date range from preset
 * @param {string} preset - Preset name (today, yesterday, last_7_days, etc.)
 * @returns {object} { start, end } Date range
 */
export function parseDateRangePreset(preset) {
  const now = new Date();

  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };

    case 'yesterday':
      const yesterday = addDays(now, -1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday)
      };

    case 'last_7_days':
      return {
        start: startOfDay(addDays(now, -6)),
        end: endOfDay(now)
      };

    case 'last_30_days':
      return {
        start: startOfDay(addDays(now, -29)),
        end: endOfDay(now)
      };

    case 'this_month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };

    case 'last_month':
      const lastMonth = addDays(startOfMonth(now), -1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };

    case 'this_year':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };

    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };
  }
}

/**
 * Format date to ISO string (for API/storage)
 * @param {Date} date - Date to format
 * @returns {string} ISO string
 */
export function toISOString(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Date string
 */
export function toDateString(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default {
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeTime,
  formatDuration,
  addDays,
  addHours,
  addMinutes,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isToday,
  isYesterday,
  isPast,
  isFuture,
  daysBetween,
  parseDateRangePreset,
  toISOString,
  toDateString
};
