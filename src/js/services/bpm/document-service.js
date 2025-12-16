/**
 * Document Service
 * Handles document attachments for process instances using PouchDB attachments
 */

import { processPersistence } from './process-persistence.js';
import { processState } from '../../state/process-state.js';
import { eventBus } from '../../utils/events.js';
import {
  EVENTS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_PROCESS,
  ALLOWED_FILE_TYPES,
  PROCESS_SYNC_STATUS
} from '../../config/constants.js';

class DocumentService {
  constructor() {
    this.uploading = new Map(); // Track upload progress
  }

  /**
   * Attach a document to a process instance
   * @param {string} orgId - Organization ID
   * @param {string} processId - Process instance ID
   * @param {File} file - File object to attach
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Document metadata
   */
  async attachDocument(orgId, processId, file, metadata = {}) {
    // Validation
    this.validateFile(file);

    // Get process instance
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    // Check document limit
    const existingDocs = processInstance.variables.documents || [];
    if (existingDocs.length >= MAX_FILES_PER_PROCESS) {
      throw new Error(`Maximum ${MAX_FILES_PER_PROCESS} documents per process`);
    }

    // Generate document ID
    const documentId = this.generateDocumentId(file.name);

    // Create document metadata
    const docMetadata = {
      id: documentId,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: metadata.uploadedBy || 'current_user',
      version: 1,
      ...metadata
    };

    try {
      // Mark as uploading
      this.uploading.set(documentId, { progress: 0, total: file.size });

      // Convert file to base64
      const base64Data = await this.fileToBase64(file);

      // Get PouchDB instance
      const db = await processPersistence.getDatabase(orgId);

      // Get current document
      const doc = await db.get(processId);

      // Add attachment to PouchDB
      const updatedDoc = await db.putAttachment(
        processId,
        documentId,
        doc._rev,
        base64Data,
        file.type
      );

      // Update process variables with document metadata
      const documents = [...existingDocs, docMetadata];
      const updated = {
        variables: {
          ...processInstance.variables,
          documents
        },
        syncStatus: PROCESS_SYNC_STATUS.PENDING,
        updatedAt: new Date().toISOString(),
        _rev: updatedDoc.rev
      };

      // Update in state
      processState.updateProcess(processId, updated);

      // Save to persistence
      await processPersistence.saveProcess(orgId, {
        ...processInstance,
        ...updated
      });

      // Emit event
      eventBus.emit(EVENTS.DOCUMENT_UPLOADED, {
        processId,
        documentId,
        document: docMetadata,
        timestamp: docMetadata.uploadedAt
      });

      console.log(`Document attached: ${documentId} to process ${processId}`);

      return docMetadata;
    } catch (error) {
      console.error('Failed to attach document:', error);
      throw new Error(`Failed to attach document: ${error.message}`);
    } finally {
      this.uploading.delete(documentId);
    }
  }

  /**
   * Get a document from a process instance
   * @param {string} orgId - Organization ID
   * @param {string} processId - Process instance ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Blob>} Document as blob
   */
  async getDocument(orgId, processId, documentId) {
    try {
      const db = await processPersistence.getDatabase(orgId);

      // Get attachment
      const blob = await db.getAttachment(processId, documentId);

      // Emit event
      eventBus.emit(EVENTS.DOCUMENT_DOWNLOADED, {
        processId,
        documentId,
        timestamp: new Date().toISOString()
      });

      return blob;
    } catch (error) {
      console.error('Failed to get document:', error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  /**
   * Get document metadata
   * @param {string} processId - Process instance ID
   * @param {string} documentId - Document ID
   * @returns {object|null} Document metadata
   */
  getDocumentMetadata(processId, documentId) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      return null;
    }

    const documents = processInstance.variables.documents || [];
    return documents.find(doc => doc.id === documentId) || null;
  }

  /**
   * List all documents for a process
   * @param {string} processId - Process instance ID
   * @returns {array} Array of document metadata
   */
  listDocuments(processId) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      return [];
    }

    return processInstance.variables.documents || [];
  }

  /**
   * Remove a document from a process instance
   * @param {string} orgId - Organization ID
   * @param {string} processId - Process instance ID
   * @param {string} documentId - Document ID
   * @returns {Promise<void>}
   */
  async removeDocument(orgId, processId, documentId) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    try {
      const db = await processPersistence.getDatabase(orgId);

      // Get current document
      const doc = await db.get(processId);

      // Remove attachment
      const updatedDoc = await db.removeAttachment(
        processId,
        documentId,
        doc._rev
      );

      // Update process variables
      const documents = (processInstance.variables.documents || []).filter(
        doc => doc.id !== documentId
      );

      const updated = {
        variables: {
          ...processInstance.variables,
          documents
        },
        syncStatus: PROCESS_SYNC_STATUS.PENDING,
        updatedAt: new Date().toISOString(),
        _rev: updatedDoc.rev
      };

      // Update in state
      processState.updateProcess(processId, updated);

      // Save to persistence
      await processPersistence.saveProcess(orgId, {
        ...processInstance,
        ...updated
      });

      // Emit event
      eventBus.emit(EVENTS.DOCUMENT_DELETED, {
        processId,
        documentId,
        timestamp: new Date().toISOString()
      });

      console.log(`Document removed: ${documentId} from process ${processId}`);
    } catch (error) {
      console.error('Failed to remove document:', error);
      throw new Error(`Failed to remove document: ${error.message}`);
    }
  }

  /**
   * Download a document
   * @param {string} orgId - Organization ID
   * @param {string} processId - Process instance ID
   * @param {string} documentId - Document ID
   * @returns {Promise<void>}
   */
  async downloadDocument(orgId, processId, documentId) {
    try {
      // Get document metadata
      const metadata = this.getDocumentMetadata(processId, documentId);
      if (!metadata) {
        throw new Error('Document metadata not found');
      }

      // Get document blob
      const blob = await this.getDocument(orgId, processId, documentId);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = metadata.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`Document downloaded: ${metadata.name}`);
    } catch (error) {
      console.error('Failed to download document:', error);
      throw new Error(`Failed to download document: ${error.message}`);
    }
  }

  /**
   * Get upload progress
   * @param {string} documentId - Document ID
   * @returns {object|null} Progress info
   */
  getUploadProgress(documentId) {
    return this.uploading.get(documentId) || null;
  }

  /**
   * Validate file
   * @param {File} file - File to validate
   * @throws {Error} If validation fails
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Check file type
    if (ALLOWED_FILE_TYPES.length > 0 && !ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }

  /**
   * Convert file to base64
   * @param {File} file - File to convert
   * @returns {Promise<Blob>} Base64 data as Blob
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Convert to blob for PouchDB
        resolve(new Blob([reader.result], { type: file.type }));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Generate unique document ID
   * @param {string} filename - Original filename
   * @returns {string} Document ID
   */
  generateDocumentId(filename) {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 9);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `doc_${timestamp}_${random}_${sanitized}`;
  }

  /**
   * Get document count for a process
   * @param {string} processId - Process instance ID
   * @returns {number} Document count
   */
  getDocumentCount(processId) {
    return this.listDocuments(processId).length;
  }

  /**
   * Get total size of documents for a process
   * @param {string} processId - Process instance ID
   * @returns {number} Total size in bytes
   */
  getTotalDocumentSize(processId) {
    const documents = this.listDocuments(processId);
    return documents.reduce((total, doc) => total + (doc.size || 0), 0);
  }

  /**
   * Check if process can accept more documents
   * @param {string} processId - Process instance ID
   * @returns {boolean} True if more documents can be added
   */
  canAddDocument(processId) {
    return this.getDocumentCount(processId) < MAX_FILES_PER_PROCESS;
  }
}

// Create singleton instance
export const documentService = new DocumentService();

export default documentService;
