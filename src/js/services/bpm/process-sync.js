/**
 * Process Sync Service
 * Manages synchronization of process instances between local and remote storage
 */

import { processPersistence } from './process-persistence.js';
import { processState } from '../../state/process-state.js';
import { eventBus } from '../../utils/events.js';
import { EVENTS, PROCESS_SYNC_STATUS } from '../../config/constants.js';
import { orgState } from '../../state/org-state.js';

class ProcessSync {
  constructor() {
    this.syncInterval = null;
    this.syncIntervalMs = 30000; // Sync every 30 seconds
    this.isSyncing = false;
  }

  /**
   * Initialize sync for current organization
   */
  async initialize(orgId, remoteUrl, credentials = null) {
    try {
      // Initialize database
      await processPersistence.initDatabase(orgId);

      // Load existing processes from database
      await this.loadProcessesFromDatabase(orgId);

      // Setup remote sync if URL provided
      if (remoteUrl) {
        await processPersistence.setupSync(orgId, remoteUrl, credentials);
      }

      // Start periodic sync check
      this.startPeriodicSync();

      console.log(`Process sync initialized for org: ${orgId}`);
    } catch (error) {
      console.error('Error initializing process sync:', error);
      throw error;
    }
  }

  /**
   * Load processes from database into state
   */
  async loadProcessesFromDatabase(orgId) {
    try {
      processState.setLoading(true);

      const processes = await processPersistence.loadAllProcesses(orgId);

      // Load processes into state
      processState.loadProcesses(processes);

      console.log(`Loaded ${processes.length} processes from database`);

      processState.setLoading(false);

      return processes;
    } catch (error) {
      console.error('Error loading processes from database:', error);
      processState.setError(error);
      throw error;
    }
  }

  /**
   * Save a process to database
   */
  async saveProcess(processInstance) {
    try {
      const activeOrg = orgState.getActiveOrganization();
      if (!activeOrg) {
        throw new Error('No active organization');
      }

      // Save to database
      const saved = await processPersistence.saveProcess(activeOrg.id, processInstance);

      // Update state with saved version (includes _rev)
      processState.updateProcess(saved._id, saved);

      return saved;
    } catch (error) {
      console.error('Error saving process:', error);

      // Mark as pending sync on error
      processState.updateProcessSyncStatus(
        processInstance._id,
        PROCESS_SYNC_STATUS.PENDING
      );

      throw error;
    }
  }

  /**
   * Save multiple processes to database
   */
  async saveProcesses(processes) {
    try {
      const activeOrg = orgState.getActiveOrganization();
      if (!activeOrg) {
        throw new Error('No active organization');
      }

      // Bulk save to database
      const saved = await processPersistence.bulkSaveProcesses(activeOrg.id, processes);

      // Update state with saved versions
      saved.forEach(p => {
        if (processState.hasProcess(p._id)) {
          processState.updateProcess(p._id, p);
        } else {
          processState.addProcess(p);
        }
      });

      return saved;
    } catch (error) {
      console.error('Error saving processes:', error);
      throw error;
    }
  }

  /**
   * Sync pending processes
   */
  async syncPendingProcesses() {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.isSyncing = true;
      processState.setSyncStatus(PROCESS_SYNC_STATUS.SYNCING);

      const activeOrg = orgState.getActiveOrganization();
      if (!activeOrg) {
        console.log('No active organization, skipping sync');
        return;
      }

      // Get processes that need sync
      const pendingProcesses = processState.getProcessesNeedingSync();

      if (pendingProcesses.length === 0) {
        console.log('No processes need sync');
        processState.setSyncStatus(PROCESS_SYNC_STATUS.SYNCED);
        return;
      }

      console.log(`Syncing ${pendingProcesses.length} pending processes...`);

      // Save each process
      const results = await Promise.allSettled(
        pendingProcesses.map(p => processPersistence.saveProcess(activeOrg.id, p))
      );

      // Update sync status for each process
      results.forEach((result, index) => {
        const process = pendingProcesses[index];

        if (result.status === 'fulfilled') {
          // Update with saved version
          processState.updateProcess(process._id, result.value);
          console.log(`✓ Process ${process._id} synced`);
        } else {
          // Mark as error
          processState.updateProcessSyncStatus(process._id, PROCESS_SYNC_STATUS.ERROR);
          console.error(`✗ Process ${process._id} sync failed:`, result.reason);
        }
      });

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;

      console.log(`Sync completed: ${successCount} succeeded, ${errorCount} failed`);

      // Set overall sync status
      if (errorCount === 0) {
        processState.setSyncStatus(PROCESS_SYNC_STATUS.SYNCED);
      } else {
        processState.setSyncStatus(PROCESS_SYNC_STATUS.ERROR);
      }

      // Emit sync completed event
      eventBus.emit(EVENTS.PROCESS_SYNC_COMPLETED, {
        orgId: activeOrg.id,
        total: pendingProcesses.length,
        succeeded: successCount,
        failed: errorCount
      });

    } catch (error) {
      console.error('Error syncing pending processes:', error);
      processState.setSyncStatus(PROCESS_SYNC_STATUS.ERROR);

      eventBus.emit(EVENTS.PROCESS_SYNC_ERROR, {
        error: error.message
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    // Clear existing interval
    this.stopPeriodicSync();

    // Start new interval
    this.syncInterval = setInterval(async () => {
      await this.syncPendingProcesses();
    }, this.syncIntervalMs);

    console.log(`Periodic sync started (every ${this.syncIntervalMs}ms)`);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }

  /**
   * Force immediate sync
   */
  async forceSync() {
    console.log('Forcing immediate sync...');
    await this.syncPendingProcesses();
  }

  /**
   * Load specific process from database
   */
  async loadProcess(processId) {
    try {
      const activeOrg = orgState.getActiveOrganization();
      if (!activeOrg) {
        throw new Error('No active organization');
      }

      const process = await processPersistence.loadProcess(activeOrg.id, processId);

      if (process) {
        // Update state with loaded process
        if (processState.hasProcess(processId)) {
          processState.updateProcess(processId, process);
        } else {
          processState.addProcess(process);
        }
      }

      return process;
    } catch (error) {
      console.error('Error loading process:', error);
      throw error;
    }
  }

  /**
   * Delete process from database
   */
  async deleteProcess(processId) {
    try {
      const activeOrg = orgState.getActiveOrganization();
      if (!activeOrg) {
        throw new Error('No active organization');
      }

      // Delete from database
      await processPersistence.deleteProcess(activeOrg.id, processId);

      // Remove from state
      processState.removeProcess(processId);

      console.log(`Process ${processId} deleted`);
    } catch (error) {
      console.error('Error deleting process:', error);
      throw error;
    }
  }

  /**
   * Get database info
   */
  async getDatabaseInfo() {
    try {
      const activeOrg = orgState.getActiveOrganization();
      if (!activeOrg) {
        throw new Error('No active organization');
      }

      return await processPersistence.getDatabaseInfo(activeOrg.id);
    } catch (error) {
      console.error('Error getting database info:', error);
      return null;
    }
  }

  /**
   * Compact database
   */
  async compactDatabase() {
    try {
      const activeOrg = orgState.getActiveOrganization();
      if (!activeOrg) {
        throw new Error('No active organization');
      }

      await processPersistence.compactDatabase(activeOrg.id);
      console.log('Database compacted');
    } catch (error) {
      console.error('Error compacting database:', error);
      throw error;
    }
  }

  /**
   * Switch organization
   */
  async switchOrganization(orgId, remoteUrl = null, credentials = null) {
    try {
      // Stop current sync
      this.stopPeriodicSync();

      // Get previous org to close its database
      const previousOrg = orgState.getActiveOrganization();
      if (previousOrg) {
        await processPersistence.closeDatabase(previousOrg.id);
      }

      // Clear current process state
      processState.clear();

      // Initialize for new organization
      await this.initialize(orgId, remoteUrl, credentials);

      console.log(`Switched to organization: ${orgId}`);
    } catch (error) {
      console.error('Error switching organization:', error);
      throw error;
    }
  }

  /**
   * Cleanup - stop sync and close databases
   */
  async cleanup() {
    try {
      // Stop periodic sync
      this.stopPeriodicSync();

      // Close all databases
      const activeOrg = orgState.getActiveOrganization();
      if (activeOrg) {
        await processPersistence.closeDatabase(activeOrg.id);
      }

      // Clear state
      processState.clear();

      console.log('Process sync cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Set sync interval
   */
  setSyncInterval(milliseconds) {
    this.syncIntervalMs = milliseconds;

    // Restart periodic sync with new interval
    if (this.syncInterval) {
      this.startPeriodicSync();
    }

    console.log(`Sync interval set to ${milliseconds}ms`);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      syncInterval: this.syncIntervalMs,
      overallStatus: processState.get('syncStatus'),
      pendingCount: processState.getProcessesNeedingSync().length
    };
  }
}

// Create singleton instance
export const processSync = new ProcessSync();

export default processSync;
