/**
 * Organizations Service
 * Handles organization search, retrieval, and membership queries
 */

const nano = require('nano');

module.exports = {
  name: "organizations",

  settings: {
    COUCHDB_URL: process.env.COUCHDB_URL,
    DB_ORGANIZATIONS: process.env.DB_ORGANIZATIONS || 'bmpl_organizations',
    DB_MEMBERS: 'bmpl_members' // Database for organization memberships
  },

  /**
   * Actions
   */
  actions: {
    /**
     * Search organizations by query
     * @param {string} query - Search query (name, industry, etc.)
     * @param {number} limit - Maximum results to return (default: 10)
     * @param {object} filters - Additional filters (industry, legalType, etc.)
     * @returns {array} - Array of matching organizations
     */
    search: {
      rest: "POST /search",
      params: {
        query: { type: "string", min: 2 },
        limit: { type: "number", optional: true, default: 10, max: 50 },
        filters: { type: "object", optional: true }
      },
      async handler(ctx) {
        const { query, limit, filters = {} } = ctx.params;
        const lowerQuery = query.toLowerCase().trim();

        try {
          const db = this.getDatabase();

          // Build selector with query and filters
          const selector = {
            type: 'organization',
            $or: [
              { shortName: { $regex: `(?i)${lowerQuery}` } },
              { fullName: { $regex: `(?i)${lowerQuery}` } },
              { tagLine: { $regex: `(?i)${lowerQuery}` } }
            ]
          };

          // Add filters if provided
          if (filters.industry) {
            selector.industry = filters.industry;
          }
          if (filters.legalType) {
            selector.legalType = filters.legalType;
          }

          // Execute query
          const result = await db.find({
            selector,
            limit
          });

          return {
            success: true,
            organizations: result.docs
          };
        } catch (error) {
          this.logger.error('Organization search error:', error);

          // Fallback to manual search if $regex not supported
          try {
            const orgs = await this.searchFallback(lowerQuery, limit, filters);
            return {
              success: true,
              organizations: orgs
            };
          } catch (fallbackError) {
            this.logger.error('Organization search fallback error:', fallbackError);
            return {
              success: false,
              error: fallbackError.message,
              organizations: []
            };
          }
        }
      }
    },

    /**
     * Get organization by ID
     * @param {string} id - Organization ID (e.g., "org:techcorp")
     * @returns {object} - Organization object
     */
    get: {
      rest: "GET /:id",
      params: {
        id: { type: "string", min: 4 }
      },
      async handler(ctx) {
        const { id } = ctx.params;

        try {
          const db = this.getDatabase();
          const org = await db.get(id);

          return {
            success: true,
            organization: org
          };
        } catch (error) {
          this.logger.error('Get organization error:', error);
          return {
            success: false,
            error: error.statusCode === 404 ? 'Organization not found' : error.message
          };
        }
      }
    },

    /**
     * Get organizations where current user is a member
     * Uses authenticated user from JWT token
     * @returns {array} - Array of organizations where user is a member
     */
    getUserMemberships: {
      rest: "GET /user-memberships",
      async handler(ctx) {
        // Get authenticated user from context
        const user = ctx.meta.user;

        if (!user || !user.id) {
          return {
            success: false,
            error: 'User not authenticated',
            organizations: []
          };
        }

        try {
          // Query organization memberships
          // This assumes you have a bmpl_members database with member documents
          // Format: { type: 'member', organizationId: 'org:xyz', userId: 'user:abc', role: 'admin' }

          const orgIds = await this.getUserOrganizationIds(user.id);

          if (orgIds.length === 0) {
            return {
              success: true,
              organizations: []
            };
          }

          // Fetch organization details
          const db = this.getDatabase();
          const result = await db.find({
            selector: {
              type: 'organization',
              _id: { $in: orgIds }
            }
          });

          return {
            success: true,
            organizations: result.docs
          };
        } catch (error) {
          this.logger.error('Get user memberships error:', error);
          return {
            success: false,
            error: error.message,
            organizations: []
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
     * Get CouchDB database connection for organizations
     */
    getDatabase() {
      if (!this.db) {
        const couchdb = nano(this.settings.COUCHDB_URL);
        this.db = couchdb.db.use(this.settings.DB_ORGANIZATIONS);
      }
      return this.db;
    },

    /**
     * Get CouchDB database connection for members
     */
    getMembersDatabase() {
      if (!this.membersDb) {
        const couchdb = nano(this.settings.COUCHDB_URL);
        this.membersDb = couchdb.db.use(this.settings.DB_MEMBERS);
      }
      return this.membersDb;
    },

    /**
     * Get organization IDs where user is a member
     */
    async getUserOrganizationIds(userId) {
      try {
        const membersDb = this.getMembersDatabase();

        const result = await membersDb.find({
          selector: {
            type: 'member',
            userId: userId
          }
        });

        return result.docs.map(doc => doc.organizationId);
      } catch (error) {
        this.logger.error('Error getting user organization IDs:', error);
        return [];
      }
    },

    /**
     * Fallback search when regex is not supported
     * Fetches all organizations and filters client-side
     */
    async searchFallback(query, limit, filters = {}) {
      const db = this.getDatabase();

      // Get all organizations
      const result = await db.find({
        selector: {
          type: 'organization'
        },
        limit: 1000 // Reasonable limit
      });

      // Filter client-side
      let filtered = result.docs.filter(org => {
        const searchStr = [
          org.shortName || '',
          org.fullName || '',
          org.tagLine || ''
        ].join(' ').toLowerCase();
        return searchStr.includes(query);
      });

      // Apply additional filters
      if (filters.industry) {
        filtered = filtered.filter(org => org.industry === filters.industry);
      }
      if (filters.legalType) {
        filtered = filtered.filter(org => org.legalType === filters.legalType);
      }

      return filtered.slice(0, limit);
    }
  },

  /**
   * Service created lifecycle event handler
   */
  created() {
    this.logger.info("Organizations service created");
  },

  /**
   * Service started lifecycle event handler
   */
  async started() {
    this.logger.info("Organizations service started");
  },

  /**
   * Service stopped lifecycle event handler
   */
  async stopped() {
    this.logger.info("Organizations service stopped");
  }
};
