/**
 * Seed Data Service
 * Handles seeding common database with reference data
 */

import { commonPersistence } from './common-persistence.js';
import { LEGAL_TYPES_SEED_DATA } from '../data/legal-types-seed.js';
import { COMMON_DATA_TYPES } from '../config/constants.js';

class SeedDataService {
  constructor() {
    this.isSeeding = false;
  }

  /**
   * Seed organization legal types into bmpl_common database
   */
  async seedLegalTypes() {
    if (this.isSeeding) {
      console.log('Seeding already in progress...');
      return;
    }

    this.isSeeding = true;

    try {
      await commonPersistence.ensureInitialized();

      const results = {
        created: 0,
        skipped: 0,
        errors: []
      };

      console.log(`Starting to seed ${LEGAL_TYPES_SEED_DATA.length} legal types...`);

      for (const legalTypeData of LEGAL_TYPES_SEED_DATA) {
        try {
          // Generate ID: organization_legal_type:us:llc
          const countryCode = legalTypeData.country_iso_code.toLowerCase();
          const legalTypeSlug = legalTypeData.legal_type.toLowerCase().replace(/\s+/g, '-');
          const id = `${COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE}:${countryCode}:${legalTypeSlug}`;

          // Check if already exists
          const existing = await commonPersistence.getCommonDataById(id);

          if (existing) {
            console.log(`Legal type already exists: ${id}`);
            results.skipped++;
            continue;
          }

          // Create seed data with system creator
          await commonPersistence.createLegalType({
            ...legalTypeData,
            is_active: true,
            is_seed_data: true,
            createdBy: 'system'
          });

          console.log(`Created legal type: ${id}`);
          results.created++;
        } catch (error) {
          console.error('Error seeding legal type:', legalTypeData, error);
          results.errors.push({
            data: legalTypeData,
            error: error.message || error.toString()
          });
        }
      }

      console.log('Legal types seed results:', results);
      return results;
    } catch (error) {
      console.error('Error during legal types seeding:', error);
      throw error;
    } finally {
      this.isSeeding = false;
    }
  }

  /**
   * Check if seed data exists in the common database
   */
  async hasSeedData() {
    try {
      await commonPersistence.ensureInitialized();

      const legalTypes = await commonPersistence.getCommonDataByType(
        COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE,
        { limit: 1 }
      );

      return legalTypes.length > 0;
    } catch (error) {
      console.error('Error checking for seed data:', error);
      return false;
    }
  }

  /**
   * Get seed data statistics
   */
  async getSeedDataStats() {
    try {
      await commonPersistence.ensureInitialized();

      const allLegalTypes = await commonPersistence.getAllLegalTypes();

      const stats = {
        total: allLegalTypes.length,
        system: allLegalTypes.filter(lt => lt.is_seed_data === true).length,
        user: allLegalTypes.filter(lt => lt.is_seed_data !== true).length,
        byCountry: {}
      };

      // Count by country
      allLegalTypes.forEach(lt => {
        if (!stats.byCountry[lt.country_iso_code]) {
          stats.byCountry[lt.country_iso_code] = {
            country_name: lt.country_name,
            count: 0
          };
        }
        stats.byCountry[lt.country_iso_code].count++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting seed data stats:', error);
      return null;
    }
  }

  /**
   * Re-seed legal types (useful for updates to seed data)
   * WARNING: This will update existing seed records
   */
  async reseedLegalTypes(force = false) {
    if (!force) {
      console.warn('Reseed requires force=true parameter to proceed');
      return { error: 'Force parameter required' };
    }

    try {
      await commonPersistence.ensureInitialized();

      const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      console.log('Reseeding legal types (force mode)...');

      for (const legalTypeData of LEGAL_TYPES_SEED_DATA) {
        try {
          const countryCode = legalTypeData.country_iso_code.toLowerCase();
          const legalTypeSlug = legalTypeData.legal_type.toLowerCase().replace(/\s+/g, '-');
          const id = `${COMMON_DATA_TYPES.ORGANIZATION_LEGAL_TYPE}:${countryCode}:${legalTypeSlug}`;

          const existing = await commonPersistence.getCommonDataById(id);

          if (existing) {
            // Update existing seed data
            if (existing.is_seed_data) {
              await commonPersistence.updateLegalType(id, {
                ...legalTypeData,
                is_active: true,
                is_seed_data: true
              });
              console.log(`Updated legal type: ${id}`);
              results.updated++;
            } else {
              // Skip user-created records
              console.log(`Skipping user-created record: ${id}`);
              results.skipped++;
            }
          } else {
            // Create new seed data
            await commonPersistence.createLegalType({
              ...legalTypeData,
              is_active: true,
              is_seed_data: true,
              createdBy: 'system'
            });
            console.log(`Created legal type: ${id}`);
            results.created++;
          }
        } catch (error) {
          console.error('Error reseeding legal type:', legalTypeData, error);
          results.errors.push({
            data: legalTypeData,
            error: error.message || error.toString()
          });
        }
      }

      console.log('Legal types reseed results:', results);
      return results;
    } catch (error) {
      console.error('Error during legal types reseeding:', error);
      throw error;
    }
  }

  /**
   * Clear all seed data (for testing/development)
   * WARNING: This will delete all system seed records
   */
  async clearSeedData(confirm = false) {
    if (!confirm) {
      console.warn('Clear seed data requires confirm=true parameter to proceed');
      return { error: 'Confirmation required' };
    }

    try {
      await commonPersistence.ensureInitialized();

      const allLegalTypes = await commonPersistence.getAllLegalTypes();
      const seedRecords = allLegalTypes.filter(lt => lt.is_seed_data === true);

      const results = {
        deleted: 0,
        errors: []
      };

      console.log(`Clearing ${seedRecords.length} seed records...`);

      for (const record of seedRecords) {
        try {
          await commonPersistence.deleteLegalType(record._id);
          console.log(`Deleted seed record: ${record._id}`);
          results.deleted++;
        } catch (error) {
          console.error('Error deleting seed record:', record._id, error);
          results.errors.push({
            id: record._id,
            error: error.message || error.toString()
          });
        }
      }

      console.log('Seed data clear results:', results);
      return results;
    } catch (error) {
      console.error('Error clearing seed data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const seedDataService = new SeedDataService();
export default seedDataService;
