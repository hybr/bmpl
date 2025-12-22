/**
 * Common Service
 * Handles common/reference data like organization legal types
 */

const nano = require('nano');

module.exports = {
  name: "common",

  settings: {
    COUCHDB_URL: process.env.COUCHDB_URL,
    DB_COMMON: process.env.DB_COMMON || 'bmpl_common'
  },

  /**
   * Actions
   */
  actions: {
    /**
     * Get organization legal types
     * @param {string} country - Country ISO code (optional)
     * @param {string} search - Search query (optional)
     * @param {number} limit - Maximum results to return (default: 100)
     * @param {boolean} activeOnly - Return only active legal types (default: true)
     * @returns {array} - Array of legal type documents
     */
    getLegalTypes: {
      rest: "GET /legal-types",
      params: {
        country: { type: "string", optional: true },
        search: { type: "string", optional: true },
        limit: { type: "number", optional: true, default: 100, max: 1000, convert: true },
        activeOnly: { type: "string", optional: true, default: "true" }
      },
      async handler(ctx) {
        const { country, search, limit } = ctx.params;
        // Convert activeOnly from string to boolean
        const activeOnly = ctx.params.activeOnly === "true" || ctx.params.activeOnly === true;

        try {
          const db = this.getDatabase();

          // Build selector
          const selector = {
            type: 'organization_legal_type'
          };

          // Filter by country if provided
          if (country) {
            selector.country_iso_code = country.toUpperCase();
          }

          // Filter by active status
          if (activeOnly) {
            selector.is_active = { $ne: false };
          }

          // Execute base query
          const result = await db.find({
            selector,
            limit: 1000 // Get more for client-side filtering if needed
          });

          let docs = result.docs;

          // Apply search filter client-side if provided
          if (search) {
            const lowerSearch = search.toLowerCase();
            docs = docs.filter(doc => {
              const searchStr = [
                doc.legal_type || '',
                doc.full_name || '',
                doc.abbreviation || '',
                doc.description || ''
              ].join(' ').toLowerCase();
              return searchStr.includes(lowerSearch);
            });
          }

          // Sort by country name, then legal type
          docs.sort((a, b) => {
            const countryCompare = (a.country_name || '').localeCompare(b.country_name || '');
            if (countryCompare !== 0) return countryCompare;
            return (a.legal_type || '').localeCompare(b.legal_type || '');
          });

          // Apply limit
          docs = docs.slice(0, limit);

          return {
            success: true,
            data: docs
          };
        } catch (error) {
          this.logger.error('Get legal types error:', error);
          return {
            success: false,
            error: error.message,
            data: []
          };
        }
      }
    },

    /**
     * Get legal type by ID
     * @param {string} id - Legal type ID (e.g., "organization_legal_type:us:llc")
     * @returns {object} - Legal type document
     */
    getLegalType: {
      rest: "GET /legal-types/:id",
      params: {
        id: { type: "string", min: 5 }
      },
      async handler(ctx) {
        const { id } = ctx.params;

        try {
          const db = this.getDatabase();
          const doc = await db.get(id);

          return {
            success: true,
            data: doc
          };
        } catch (error) {
          this.logger.error('Get legal type error:', error);
          return {
            success: false,
            error: error.statusCode === 404 ? 'Legal type not found' : error.message
          };
        }
      }
    },

    /**
     * Create legal type (admin only)
     * @param {object} legalTypeData - Legal type data
     * @returns {object} - Created legal type
     */
    createLegalType: {
      rest: "POST /legal-types",
      params: {
        country_iso_code: { type: "string", length: 2 },
        country_name: { type: "string", min: 2 },
        legal_type: { type: "string", min: 2 },
        full_name: { type: "string", optional: true },
        abbreviation: { type: "string", optional: true },
        description: { type: "string", optional: true },
        is_active: { type: "boolean", optional: true, default: true }
      },
      async handler(ctx) {
        const legalTypeData = ctx.params;

        try {
          // Generate ID: organization_legal_type:us:llc
          const countryCode = legalTypeData.country_iso_code.toLowerCase();
          const legalTypeSlug = legalTypeData.legal_type.toLowerCase().replace(/\s+/g, '-');
          const id = `organization_legal_type:${countryCode}:${legalTypeSlug}`;

          const doc = {
            _id: id,
            type: 'organization_legal_type',
            ...legalTypeData,
            country_iso_code: legalTypeData.country_iso_code.toUpperCase(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const db = this.getDatabase();
          const result = await db.insert(doc);

          return {
            success: true,
            data: { ...doc, _rev: result.rev }
          };
        } catch (error) {
          this.logger.error('Create legal type error:', error);
          return {
            success: false,
            error: error.message
          };
        }
      }
    }
  },

  /**
   * Methods
   */
  methods: {
    /**
     * Get CouchDB database connection
     */
    getDatabase() {
      if (!this.db) {
        const couchdb = nano(this.settings.COUCHDB_URL);
        this.db = couchdb.db.use(this.settings.DB_COMMON);
      }
      return this.db;
    }
  },

  /**
   * Service created lifecycle event handler
   */
  created() {
    this.logger.info("Common service created");
  },

  /**
   * Service started lifecycle event handler
   */
  async started() {
    this.logger.info("Common service started");
  },

  /**
   * Service stopped lifecycle event handler
   */
  async stopped() {
    this.logger.info("Common service stopped");
  }
};
