/**
 * Sync Status Component
 * Displays CouchDB sync status and allows credential configuration
 */

import { syncConfigService } from '../services/sync-config.js';
import { processSync } from '../services/bpm/process-sync.js';
import { eventBus } from '../utils/events.js';
import { EVENTS } from '../config/constants.js';

export class SyncStatusComponent {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.isExpanded = false;
    this.unsubscribers = [];
  }

  /**
   * Initialize the component
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn('Sync status container not found:', this.containerId);
      return;
    }

    this.render();
    this.attachEventListeners();
    this.setupEventSubscriptions();
  }

  /**
   * Render the component
   */
  render() {
    const status = syncConfigService.getConnectionStatus();
    const syncStatus = processSync.getSyncStatus();

    const statusColor = status.connected ? '#10b981' : '#ef4444';
    const statusIcon = status.connected ? 'cloud-done' : 'cloud-offline';
    const statusText = status.connected ? 'Connected' : 'Offline';

    this.container.innerHTML = `
      <div class="sync-status-wrapper">
        <!-- Compact Status Indicator -->
        <div class="sync-status-indicator" id="sync-status-toggle">
          <ion-icon name="${statusIcon}" style="color: ${statusColor}; font-size: 20px;"></ion-icon>
          <span class="sync-status-text" style="color: ${statusColor}; font-size: 12px; margin-left: 4px;">${statusText}</span>
          <ion-icon name="chevron-${this.isExpanded ? 'up' : 'down'}" style="font-size: 14px; margin-left: 4px;"></ion-icon>
        </div>

        <!-- Expanded Panel -->
        <div class="sync-status-panel" id="sync-status-panel" style="display: ${this.isExpanded ? 'block' : 'none'};">
          <div style="padding: 16px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 300px;">

            <!-- Connection Status -->
            <div style="margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">CouchDB Status</h4>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${statusColor};"></div>
                <span style="font-size: 13px;">${statusText}</span>
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                URL: ${status.url}
              </div>
            </div>

            <!-- Sync Status -->
            <div style="margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">Sync Status</h4>
              <div style="display: flex; justify-content: space-between; font-size: 13px;">
                <span>Status:</span>
                <span style="font-weight: 500;">${syncStatus.isSyncing ? 'Syncing...' : syncStatus.overallStatus || 'idle'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 4px;">
                <span>Pending:</span>
                <span style="font-weight: 500;">${syncStatus.pendingCount} items</span>
              </div>
            </div>

            <!-- Credentials Section -->
            <div style="margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">Credentials</h4>
              ${status.hasCredentials ? `
                <div style="font-size: 13px; color: #10b981; margin-bottom: 8px;">
                  <ion-icon name="checkmark-circle" style="vertical-align: middle;"></ion-icon>
                  Credentials saved
                </div>
                <button id="clear-credentials-btn" style="
                  padding: 6px 12px;
                  font-size: 12px;
                  background: #fee2e2;
                  color: #dc2626;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                ">Clear Credentials</button>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <input type="text" id="couchdb-username" placeholder="Username" style="
                    padding: 8px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    font-size: 13px;
                  " />
                  <input type="password" id="couchdb-password" placeholder="Password" style="
                    padding: 8px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    font-size: 13px;
                  " />
                  <button id="save-credentials-btn" style="
                    padding: 8px 16px;
                    font-size: 13px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                  ">Save & Connect</button>
                </div>
              `}
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button id="force-sync-btn" style="
                padding: 6px 12px;
                font-size: 12px;
                background: #10b981;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                ${!status.connected ? 'opacity: 0.5;' : ''}
              " ${!status.connected ? 'disabled' : ''}>Force Sync</button>

              <button id="test-connection-btn" style="
                padding: 6px 12px;
                font-size: 12px;
                background: #6b7280;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              ">Test Connection</button>
            </div>

            <!-- Status Message -->
            <div id="sync-message" style="margin-top: 12px; font-size: 12px; display: none;"></div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    this.addStyles();
  }

  /**
   * Add component styles
   */
  addStyles() {
    if (document.getElementById('sync-status-styles')) return;

    const style = document.createElement('style');
    style.id = 'sync-status-styles';
    style.textContent = `
      .sync-status-wrapper {
        position: relative;
      }

      .sync-status-indicator {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        background: var(--ion-color-light, #f3f4f6);
        border-radius: 20px;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
      }

      .sync-status-indicator:hover {
        background: var(--ion-color-light-shade, #e5e7eb);
      }

      .sync-status-panel {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        z-index: 1000;
      }

      @media (max-width: 640px) {
        .sync-status-panel {
          position: fixed;
          top: auto;
          bottom: 0;
          left: 0;
          right: 0;
          margin-top: 0;
        }

        .sync-status-panel > div {
          border-radius: 16px 16px 0 0 !important;
          min-width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle panel
    const toggle = document.getElementById('sync-status-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.togglePanel());
    }

    // Save credentials
    const saveBtn = document.getElementById('save-credentials-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCredentials());
    }

    // Clear credentials
    const clearBtn = document.getElementById('clear-credentials-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearCredentials());
    }

    // Force sync
    const forceBtn = document.getElementById('force-sync-btn');
    if (forceBtn) {
      forceBtn.addEventListener('click', () => this.forceSync());
    }

    // Test connection
    const testBtn = document.getElementById('test-connection-btn');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.testConnection());
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isExpanded && !this.container.contains(e.target)) {
        this.togglePanel();
      }
    });
  }

  /**
   * Setup event subscriptions
   */
  setupEventSubscriptions() {
    // Re-render on sync state change
    const unsub = eventBus.on(EVENTS.SYNC_STATE_CHANGED, () => {
      this.render();
      this.attachEventListeners();
    });
    this.unsubscribers.push(unsub);
  }

  /**
   * Toggle expanded panel
   */
  togglePanel() {
    this.isExpanded = !this.isExpanded;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Save credentials and reconnect
   */
  async saveCredentials() {
    const username = document.getElementById('couchdb-username')?.value;
    const password = document.getElementById('couchdb-password')?.value;

    if (!username || !password) {
      this.showMessage('Please enter both username and password', 'error');
      return;
    }

    this.showMessage('Testing credentials...', 'info');

    const result = await syncConfigService.testCredentials(username, password);

    if (result.valid) {
      syncConfigService.saveCredentials(username, password);
      this.showMessage('Credentials saved! Reconnecting...', 'success');

      // Re-check connectivity
      await syncConfigService.checkConnectivity();

      // Re-render
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage('Invalid credentials: ' + result.error, 'error');
    }
  }

  /**
   * Clear saved credentials
   */
  clearCredentials() {
    syncConfigService.clearCredentials();
    this.showMessage('Credentials cleared', 'info');
    this.render();
    this.attachEventListeners();
  }

  /**
   * Force sync
   */
  async forceSync() {
    this.showMessage('Syncing...', 'info');

    try {
      await processSync.forceSync();
      this.showMessage('Sync completed', 'success');
    } catch (error) {
      this.showMessage('Sync failed: ' + error.message, 'error');
    }

    this.render();
    this.attachEventListeners();
  }

  /**
   * Test connection
   */
  async testConnection() {
    this.showMessage('Testing connection...', 'info');

    const result = await syncConfigService.checkConnectivity();

    if (result.connected) {
      this.showMessage(`Connected to ${result.info.couchdb} v${result.info.version}`, 'success');
    } else {
      this.showMessage('Connection failed: ' + result.error, 'error');
    }

    this.render();
    this.attachEventListeners();
  }

  /**
   * Show status message
   */
  showMessage(text, type) {
    const msgEl = document.getElementById('sync-message');
    if (!msgEl) return;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6'
    };

    msgEl.style.display = 'block';
    msgEl.style.color = colors[type] || '#6b7280';
    msgEl.textContent = text;

    // Hide after 3 seconds for success/error
    if (type !== 'info') {
      setTimeout(() => {
        msgEl.style.display = 'none';
      }, 3001);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}

/**
 * Create a sync status component
 */
export function createSyncStatus(containerId) {
  const component = new SyncStatusComponent(containerId);
  component.init();
  return component;
}

export default SyncStatusComponent;
