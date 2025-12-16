/**
 * Process State Management
 * Manages all process instances in the application
 */

import Store from './store.js';
import { EVENTS, PROCESS_STATUS, PROCESS_SYNC_STATUS } from '../config/constants.js';

class ProcessState extends Store {
  constructor() {
    super({
      processes: {}, // Map of processId -> processInstance
      loading: false,
      error: null,
      syncStatus: PROCESS_SYNC_STATUS.SYNCED
    });
  }

  /**
   * Add a new process instance
   */
  addProcess(processInstance) {
    if (!processInstance || !processInstance._id) {
      throw new Error('Invalid process instance');
    }

    const processes = { ...this._state.processes };
    processes[processInstance._id] = processInstance;

    this.setState({ processes });

    // Emit process created event
    this.emitEvent(EVENTS.PROCESS_CREATED, {
      processId: processInstance._id,
      definitionId: processInstance.definitionId,
      type: processInstance.type,
      timestamp: processInstance.createdAt
    });

    return processInstance;
  }

  /**
   * Update an existing process instance
   */
  updateProcess(processId, updates) {
    const processes = { ...this._state.processes };
    const existingProcess = processes[processId];

    if (!existingProcess) {
      throw new Error(`Process ${processId} not found`);
    }

    processes[processId] = {
      ...existingProcess,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.setState({ processes });

    // Emit process updated event
    this.emitEvent(EVENTS.PROCESS_UPDATED, {
      processId,
      updates,
      timestamp: processes[processId].updatedAt
    });

    return processes[processId];
  }

  /**
   * Remove a process instance
   */
  removeProcess(processId) {
    const processes = { ...this._state.processes };
    const process = processes[processId];

    if (!process) {
      return false;
    }

    delete processes[processId];
    this.setState({ processes });

    return true;
  }

  /**
   * Get a process instance by ID
   */
  getProcess(processId) {
    return this._state.processes[processId] || null;
  }

  /**
   * Get all processes
   */
  getAllProcesses() {
    return Object.values(this._state.processes);
  }

  /**
   * Get processes by type
   */
  getProcessesByType(type) {
    return Object.values(this._state.processes).filter(
      process => process.type === type
    );
  }

  /**
   * Get processes by status
   */
  getProcessesByStatus(status) {
    return Object.values(this._state.processes).filter(
      process => process.status === status
    );
  }

  /**
   * Get processes by definition ID
   */
  getProcessesByDefinition(definitionId) {
    return Object.values(this._state.processes).filter(
      process => process.definitionId === definitionId
    );
  }

  /**
   * Get processes by current state
   */
  getProcessesByState(currentState) {
    return Object.values(this._state.processes).filter(
      process => process.currentState === currentState
    );
  }

  /**
   * Get active processes (not completed/cancelled/failed)
   */
  getActiveProcesses() {
    return Object.values(this._state.processes).filter(
      process => process.status === PROCESS_STATUS.ACTIVE
    );
  }

  /**
   * Get completed processes
   */
  getCompletedProcesses() {
    return Object.values(this._state.processes).filter(
      process => process.status === PROCESS_STATUS.COMPLETED
    );
  }

  /**
   * Get processes that need sync
   */
  getProcessesNeedingSync() {
    return Object.values(this._state.processes).filter(
      process => process.syncStatus === PROCESS_SYNC_STATUS.PENDING ||
                 process.syncStatus === PROCESS_SYNC_STATUS.ERROR
    );
  }

  /**
   * Get process count by type
   */
  getProcessCountByType(type) {
    return this.getProcessesByType(type).length;
  }

  /**
   * Get process count by status
   */
  getProcessCountByStatus(status) {
    return this.getProcessesByStatus(status).length;
  }

  /**
   * Check if process exists
   */
  hasProcess(processId) {
    return processId in this._state.processes;
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.setState({ loading });
  }

  /**
   * Set error state
   */
  setError(error) {
    this.setState({
      error: error ? error.message || error : null,
      loading: false
    });
  }

  /**
   * Clear error state
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * Set sync status
   */
  setSyncStatus(syncStatus) {
    this.setState({ syncStatus });
  }

  /**
   * Update process sync status
   */
  updateProcessSyncStatus(processId, syncStatus) {
    const processes = { ...this._state.processes };
    const process = processes[processId];

    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    processes[processId] = {
      ...process,
      syncStatus,
      lastSyncAt: syncStatus === PROCESS_SYNC_STATUS.SYNCED ? new Date().toISOString() : process.lastSyncAt
    };

    this.setState({ processes });

    return processes[processId];
  }

  /**
   * Clear all processes
   */
  clear() {
    this.setState({
      processes: {},
      loading: false,
      error: null,
      syncStatus: PROCESS_SYNC_STATUS.SYNCED
    });
  }

  /**
   * Load processes from array
   * Useful for initial load or sync
   */
  loadProcesses(processArray) {
    const processes = {};

    processArray.forEach(process => {
      if (process && process._id) {
        processes[process._id] = process;
      }
    });

    this.setState({ processes });
  }

  /**
   * Get process statistics
   */
  getStatistics() {
    const allProcesses = this.getAllProcesses();

    return {
      total: allProcesses.length,
      active: this.getProcessCountByStatus(PROCESS_STATUS.ACTIVE),
      completed: this.getProcessCountByStatus(PROCESS_STATUS.COMPLETED),
      cancelled: this.getProcessCountByStatus(PROCESS_STATUS.CANCELLED),
      failed: this.getProcessCountByStatus(PROCESS_STATUS.FAILED),
      suspended: this.getProcessCountByStatus(PROCESS_STATUS.SUSPENDED),
      needingSync: this.getProcessesNeedingSync().length
    };
  }

  /**
   * Get processes by category
   * @param {string} category - Process category (from PROCESS_CATEGORIES)
   * @param {function} getDefinition - Function to get process definition
   * @returns {array} Processes in the category
   */
  getProcessesByCategory(category, getDefinition) {
    if (!getDefinition) {
      console.warn('getDefinition function required for category filtering');
      return [];
    }

    return Object.values(this._state.processes).filter(process => {
      const definition = getDefinition(process.definitionId);
      return definition?.metadata?.category === category;
    });
  }

  /**
   * Get process count by category
   * @param {string} category - Process category
   * @param {function} getDefinition - Function to get process definition
   * @returns {number} Count
   */
  getProcessCountByCategory(category, getDefinition) {
    return this.getProcessesByCategory(category, getDefinition).length;
  }

  /**
   * Search processes by variables
   * Enhanced search with multiple criteria support
   */
  searchProcesses(criteria) {
    return Object.values(this._state.processes).filter(process => {
      // Check each criteria
      for (const [key, value] of Object.entries(criteria)) {
        // Check in process variables
        if (process.variables && process.variables[key] === value) {
          continue;
        }

        // Check in process root properties
        if (process[key] === value) {
          continue;
        }

        // No match found for this criteria
        return false;
      }

      // All criteria matched
      return true;
    });
  }

  /**
   * Advanced filter processes
   * @param {object} filters - Filter options
   * @returns {array} Filtered processes
   */
  filterProcesses(filters = {}) {
    let processes = Object.values(this._state.processes);

    // Filter by definition ID
    if (filters.definitionId) {
      processes = processes.filter(p => p.definitionId === filters.definitionId);
    }

    // Filter by status (single or array)
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      processes = processes.filter(p => statuses.includes(p.status));
    }

    // Filter by current state
    if (filters.currentState) {
      processes = processes.filter(p => p.currentState === filters.currentState);
    }

    // Filter by category (requires getDefinition function)
    if (filters.category && filters.getDefinition) {
      processes = processes.filter(p => {
        const definition = filters.getDefinition(p.definitionId);
        return definition?.metadata?.category === filters.category;
      });
    }

    // Filter by date range
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      processes = processes.filter(p => {
        const created = new Date(p.createdAt).getTime();
        return created >= start && created <= end;
      });
    }

    // Filter by search query (searches in variables)
    if (filters.query) {
      const lowerQuery = filters.query.toLowerCase();
      processes = processes.filter(p => {
        // Search in process ID
        if (p._id.toLowerCase().includes(lowerQuery)) return true;

        // Search in variables
        if (p.variables) {
          return Object.values(p.variables).some(value => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(lowerQuery);
            }
            return false;
          });
        }

        return false;
      });
    }

    // Filter by custom variable values
    if (filters.variables) {
      processes = processes.filter(p => {
        return Object.entries(filters.variables).every(([key, value]) => {
          return p.variables?.[key] === value;
        });
      });
    }

    // Sort
    if (filters.sortBy) {
      processes = this.sortProcesses(processes, filters.sortBy, filters.sortOrder);
    }

    return processes;
  }

  /**
   * Sort processes
   * @param {array} processes - Processes to sort
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - 'asc' or 'desc'
   * @returns {array} Sorted processes
   */
  sortProcesses(processes, sortBy, sortOrder = 'desc') {
    const sorted = [...processes];

    sorted.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'createdAt':
        case 'updatedAt':
        case 'completedAt':
          valueA = new Date(a[sortBy] || 0).getTime();
          valueB = new Date(b[sortBy] || 0).getTime();
          break;

        case 'status':
        case 'currentState':
          valueA = a[sortBy] || '';
          valueB = b[sortBy] || '';
          break;

        default:
          // Try to get from variables
          valueA = a.variables?.[sortBy] || '';
          valueB = b.variables?.[sortBy] || '';
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });

    return sorted;
  }

  /**
   * Paginate processes
   * @param {array} processes - Processes to paginate
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Items per page
   * @returns {object} { processes, total, pages, page, pageSize }
   */
  paginateProcesses(processes, page = 1, pageSize = 50) {
    const total = processes.length;
    const pages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      processes: processes.slice(start, end),
      total,
      pages,
      page,
      pageSize,
      hasNext: page < pages,
      hasPrev: page > 1
    };
  }

  /**
   * Get processes with pagination and filters
   * @param {object} options - { filters, page, pageSize }
   * @returns {object} Paginated and filtered processes
   */
  getProcessesPaginated(options = {}) {
    const {
      filters = {},
      page = 1,
      pageSize = 50
    } = options;

    const filtered = this.filterProcesses(filters);
    return this.paginateProcesses(filtered, page, pageSize);
  }

  /**
   * Full-text search across all process data
   * @param {string} query - Search query
   * @returns {array} Matching processes
   */
  fullTextSearch(query) {
    if (!query || query.trim() === '') {
      return this.getAllProcesses();
    }

    const lowerQuery = query.toLowerCase();

    return Object.values(this._state.processes).filter(process => {
      // Search in process ID
      if (process._id.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in definition ID
      if (process.definitionId.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in current state
      if (process.currentState.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in status
      if (process.status.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in variables
      if (process.variables) {
        const variableMatch = Object.values(process.variables).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerQuery);
          }
          if (typeof value === 'number') {
            return String(value).includes(query);
          }
          return false;
        });

        if (variableMatch) return true;
      }

      // Search in metadata
      if (process.metadata) {
        const metadataMatch = Object.values(process.metadata).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerQuery);
          }
          return false;
        });

        if (metadataMatch) return true;
      }

      return false;
    });
  }

  /**
   * Get processes sorted by creation date
   */
  getProcessesSortedByDate(ascending = false) {
    const processes = this.getAllProcesses();

    return processes.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Get processes sorted by update date
   */
  getProcessesSortedByUpdate(ascending = false) {
    const processes = this.getAllProcesses();

    return processes.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);

      return ascending ? dateA - dateB : dateB - dateA;
    });
  }
}

// Create singleton instance
export const processState = new ProcessState();

export default processState;
