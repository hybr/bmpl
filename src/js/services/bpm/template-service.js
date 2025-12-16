/**
 * Template Service
 * Manages process templates for quick process creation
 */

import { processService } from './process-service.js';
import { processState } from '../../state/process-state.js';
import { eventBus } from '../../utils/events.js';
import { EVENTS, DOC_TYPES } from '../../config/constants.js';

class TemplateService {
  constructor() {
    this.templates = new Map(); // templateId -> template
  }

  /**
   * Save a process as a template
   * @param {string} processId - Process instance ID to save as template
   * @param {object} templateInfo - Template metadata
   * @returns {object} Template
   */
  saveAsTemplate(processId, templateInfo = {}) {
    const processInstance = processState.getProcess(processId);
    if (!processInstance) {
      throw new Error(`Process not found: ${processId}`);
    }

    // Get process definition
    const definition = processService.getDefinition(processInstance.definitionId);
    if (!definition) {
      throw new Error(`Process definition not found: ${processInstance.definitionId}`);
    }

    // Generate template ID
    const templateId = this.generateTemplateId(processInstance.definitionId);

    // Create template
    const template = {
      _id: templateId,
      type: DOC_TYPES.DATA,
      subType: 'process_template',
      definitionId: processInstance.definitionId,
      definitionName: definition.name,
      name: templateInfo.name || `${definition.name} Template`,
      description: templateInfo.description || '',
      category: definition.metadata?.category || 'general',
      tags: templateInfo.tags || [],

      // Save process variables as template data
      variables: { ...processInstance.variables },

      // Remove runtime-specific fields
      excludeFields: ['createdAt', 'updatedAt', 'completedAt', 'documents'],

      // Template metadata
      createdBy: templateInfo.createdBy || 'current_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: templateInfo.isPublic || false,
      usageCount: 0
    };

    // Clean up variables (remove runtime data)
    template.excludeFields.forEach(field => {
      delete template.variables[field];
    });

    // Store in memory
    this.templates.set(templateId, template);

    console.log(`Template created: ${templateId} (${template.name})`);

    return template;
  }

  /**
   * Create a process from a template
   * @param {string} templateId - Template ID
   * @param {object} overrides - Variable overrides
   * @param {object} metadata - Process metadata
   * @returns {Promise<object>} Created process instance
   */
  async createFromTemplate(templateId, overrides = {}, metadata = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Merge template variables with overrides
    const variables = {
      ...template.variables,
      ...overrides
    };

    // Create process instance
    const processInstance = await processService.createProcess({
      definitionId: template.definitionId,
      type: template.definitionId.split('_')[0], // Extract type from definition ID
      variables,
      metadata: {
        ...metadata,
        createdFromTemplate: templateId
      }
    });

    // Increment usage count
    template.usageCount += 1;
    template.updatedAt = new Date().toISOString();

    console.log(`Process created from template: ${templateId} -> ${processInstance._id}`);

    return processInstance;
  }

  /**
   * Get a template by ID
   * @param {string} templateId - Template ID
   * @returns {object|null} Template
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get all templates
   * @param {object} filters - Optional filters
   * @returns {array} Array of templates
   */
  getAllTemplates(filters = {}) {
    let templates = Array.from(this.templates.values());

    // Filter by definition ID
    if (filters.definitionId) {
      templates = templates.filter(t => t.definitionId === filters.definitionId);
    }

    // Filter by category
    if (filters.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      templates = templates.filter(t =>
        filters.tags.some(tag => t.tags.includes(tag))
      );
    }

    // Filter by public/private
    if (filters.isPublic !== undefined) {
      templates = templates.filter(t => t.isPublic === filters.isPublic);
    }

    // Filter by creator
    if (filters.createdBy) {
      templates = templates.filter(t => t.createdBy === filters.createdBy);
    }

    // Sort by usage count (most used first)
    if (filters.sortBy === 'usage') {
      templates.sort((a, b) => b.usageCount - a.usageCount);
    }
    // Sort by name
    else if (filters.sortBy === 'name') {
      templates.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Sort by most recent
    else {
      templates.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return templates;
  }

  /**
   * Get templates by definition ID
   * @param {string} definitionId - Process definition ID
   * @returns {array} Array of templates
   */
  getTemplatesByDefinition(definitionId) {
    return this.getAllTemplates({ definitionId });
  }

  /**
   * Get templates by category
   * @param {string} category - Process category
   * @returns {array} Array of templates
   */
  getTemplatesByCategory(category) {
    return this.getAllTemplates({ category });
  }

  /**
   * Update a template
   * @param {string} templateId - Template ID
   * @param {object} updates - Updates to apply
   * @returns {object} Updated template
   */
  updateTemplate(templateId, updates) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Allowed updates
    const allowedFields = ['name', 'description', 'tags', 'variables', 'isPublic'];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'variables') {
          // Merge variables
          template.variables = {
            ...template.variables,
            ...updates.variables
          };
        } else if (field === 'tags') {
          // Replace tags
          template.tags = [...updates.tags];
        } else {
          template[field] = updates[field];
        }
      }
    });

    template.updatedAt = new Date().toISOString();

    console.log(`Template updated: ${templateId}`);

    return template;
  }

  /**
   * Delete a template
   * @param {string} templateId - Template ID
   * @returns {boolean} Success
   */
  deleteTemplate(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.templates.delete(templateId);

    console.log(`Template deleted: ${templateId}`);

    return true;
  }

  /**
   * Clone a template
   * @param {string} templateId - Template ID to clone
   * @param {object} newInfo - New template info
   * @returns {object} Cloned template
   */
  cloneTemplate(templateId, newInfo = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const newTemplateId = this.generateTemplateId(template.definitionId);

    const clonedTemplate = {
      ...template,
      _id: newTemplateId,
      name: newInfo.name || `${template.name} (Copy)`,
      description: newInfo.description || template.description,
      createdBy: newInfo.createdBy || 'current_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    this.templates.set(newTemplateId, clonedTemplate);

    console.log(`Template cloned: ${templateId} -> ${newTemplateId}`);

    return clonedTemplate;
  }

  /**
   * Get template preview
   * @param {string} templateId - Template ID
   * @returns {object} Template preview with sample data
   */
  getTemplatePreview(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const definition = processService.getDefinition(template.definitionId);
    if (!definition) {
      return null;
    }

    return {
      templateId: template._id,
      templateName: template.name,
      definitionName: definition.name,
      description: template.description,
      category: template.category,
      variables: template.variables,
      variableSchema: definition.variables,
      initialState: definition.initialState,
      tags: template.tags,
      usageCount: template.usageCount
    };
  }

  /**
   * Get popular templates
   * @param {number} limit - Number of templates to return
   * @returns {array} Most used templates
   */
  getPopularTemplates(limit = 10) {
    return this.getAllTemplates({ sortBy: 'usage' }).slice(0, limit);
  }

  /**
   * Get recent templates
   * @param {number} limit - Number of templates to return
   * @returns {array} Most recent templates
   */
  getRecentTemplates(limit = 10) {
    return this.getAllTemplates().slice(0, limit);
  }

  /**
   * Search templates
   * @param {string} query - Search query
   * @returns {array} Matching templates
   */
  searchTemplates(query) {
    if (!query || query.trim() === '') {
      return this.getAllTemplates();
    }

    const lowerQuery = query.toLowerCase();

    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.definitionName.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export template
   * @param {string} templateId - Template ID
   * @returns {string} JSON string
   */
  exportTemplate(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template
   * @param {string} jsonString - JSON template data
   * @returns {object} Imported template
   */
  importTemplate(jsonString) {
    try {
      const template = JSON.parse(jsonString);

      // Validate required fields
      if (!template.definitionId || !template.name) {
        throw new Error('Invalid template: missing required fields');
      }

      // Generate new ID
      const newTemplateId = this.generateTemplateId(template.definitionId);

      // Create imported template
      const importedTemplate = {
        ...template,
        _id: newTemplateId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      };

      this.templates.set(newTemplateId, importedTemplate);

      console.log(`Template imported: ${newTemplateId}`);

      return importedTemplate;
    } catch (error) {
      throw new Error(`Failed to import template: ${error.message}`);
    }
  }

  /**
   * Generate unique template ID
   * @param {string} definitionId - Process definition ID
   * @returns {string} Template ID
   */
  generateTemplateId(definitionId) {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 9);
    const prefix = definitionId.split('_')[0];
    return `template_${prefix}_${timestamp}_${random}`;
  }

  /**
   * Get template count
   * @returns {number} Total number of templates
   */
  getTemplateCount() {
    return this.templates.size;
  }

  /**
   * Clear all templates (for testing)
   */
  clearAll() {
    this.templates.clear();
  }
}

// Create singleton instance
export const templateService = new TemplateService();

export default templateService;
