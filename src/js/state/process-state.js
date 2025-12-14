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
   * Search processes by variables
   * Simple search implementation - can be enhanced later
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
