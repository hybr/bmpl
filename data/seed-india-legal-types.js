/**
 * Seed India Legal Types to CouchDB
 *
 * This script populates the bmpl_common database with Indian organization legal types
 *
 * Usage:
 *   node scripts/seed-india-legal-types.js
 *
 * Options:
 *   --force    Overwrite existing records
 *   --api      Use API endpoint instead of direct CouchDB access
 */

const path = require('path');

// Load dotenv from api/node_modules
const dotenv = require(path.join(__dirname, '../api/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../api/.env') });

// Load nano from api/node_modules
const nano = require(path.join(__dirname, '../api/node_modules/nano'));

// India Legal Types Data
const INDIA_LEGAL_TYPES = [
  {
    legal_type: 'Pvt. Ltd.',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Pvt. Ltd.',
    full_name: 'Private Limited Company',
    description: 'Most popular business structure in India offering limited liability with minimum 2 directors and 2 shareholders.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Corporate tax rate: 25% (for companies with turnover up to ₹400 crores) or 30%. Alternative Minimum Tax may apply.',
    min_members: 2,
    registration_required: true,
    annual_filing_required: true,
    audit_required: true
  },
  {
    legal_type: 'Ltd.',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Ltd.',
    full_name: 'Public Limited Company',
    description: 'Public company that can raise capital from public and list on stock exchanges. Requires minimum 3 directors and 7 shareholders.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Corporate tax rate: 25% or 30%. Subject to additional compliance and SEBI regulations if listed.',
    min_members: 7,
    registration_required: true,
    annual_filing_required: true,
    audit_required: true
  },
  {
    legal_type: 'LLP',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'LLP',
    full_name: 'Limited Liability Partnership',
    description: 'Hybrid structure combining benefits of partnership and limited liability. Popular among professionals and startups.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Taxed at 30% plus surcharge and cess. No Dividend Distribution Tax. Partners taxed on profit share.',
    min_members: 2,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'OPC',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'OPC',
    full_name: 'One Person Company',
    description: 'Company structure for single entrepreneurs, introduced in Companies Act 2013. Requires one nominee.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Corporate tax rate: 25% or 30% plus surcharge and cess.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: true
  },
  {
    legal_type: 'Partnership',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Partnership',
    full_name: 'Partnership Firm',
    description: 'Traditional partnership governed by Indian Partnership Act, 1932. Partners have unlimited liability.',
    liability: 'unlimited',
    tax_type: 'pass-through',
    tax_rate_info: 'Firm taxed at 30% plus surcharge and cess. Partners also taxed on profit distribution.',
    min_members: 2,
    registration_required: false,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Sole Proprietorship',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Proprietorship',
    full_name: 'Sole Proprietorship',
    description: 'Simplest business structure where individual owns and runs the business. No separate legal entity.',
    liability: 'unlimited',
    tax_type: 'pass-through',
    tax_rate_info: 'Business income taxed as per individual income tax slabs (up to 30% plus surcharge and cess).',
    min_members: 1,
    registration_required: false,
    annual_filing_required: false,
    audit_required: false
  },
  {
    legal_type: 'Section 8 Company',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Sec 8',
    full_name: 'Section 8 Company (Nonprofit)',
    description: 'Company registered under Section 8 of Companies Act for charitable purposes. Profits used for promoting objectives.',
    liability: 'limited',
    tax_type: 'exempt',
    tax_rate_info: 'Exempt from income tax under Section 12A/12AA if registered. Must file annual returns.',
    min_members: 2,
    registration_required: true,
    annual_filing_required: true,
    audit_required: true
  },
  {
    legal_type: 'HUF',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'HUF',
    full_name: 'Hindu Undivided Family',
    description: 'Unique Indian business structure for Hindu families. Managed by Karta (head of family) on behalf of family members.',
    liability: 'unlimited',
    tax_type: 'corporate',
    tax_rate_info: 'Taxed as separate entity with same income tax slabs as individuals (up to 30% plus surcharge and cess).',
    min_members: 1,
    registration_required: false,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Trust',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Trust',
    full_name: 'Private Trust',
    description: 'Legal arrangement where trustee holds property/assets for beneficiaries. Can be charitable or private.',
    liability: 'limited',
    tax_type: 'exempt',
    tax_rate_info: 'Charitable trusts exempt under Section 11 if registered. Private trusts taxed at maximum marginal rate.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Society',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Society',
    full_name: 'Registered Society',
    description: 'Registered under Societies Registration Act, 1860 for charitable, literary, or scientific purposes.',
    liability: 'limited',
    tax_type: 'exempt',
    tax_rate_info: 'Exempt from income tax if registered under Section 12A/12AA. Must maintain proper accounts.',
    min_members: 7,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Producer Company',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Producer Co.',
    full_name: 'Producer Company',
    description: 'Specialized company for farmers/producers to collectively improve their economic conditions. Governed by Part IXA of Companies Act.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Corporate tax at 25% or 30%. Eligible for various agricultural exemptions and benefits.',
    min_members: 10,
    registration_required: true,
    annual_filing_required: true,
    audit_required: true
  },
  {
    legal_type: 'Cooperative Society',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Co-op',
    full_name: 'Cooperative Society',
    description: 'Member-owned organization registered under state cooperative acts. Common in agriculture, housing, and credit sectors.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Lower tax rate (22% plus surcharge) for cooperatives. Special deductions available under Section 80P.',
    min_members: 10,
    registration_required: true,
    annual_filing_required: true,
    audit_required: true
  },
  {
    legal_type: 'Other',
    country_iso_code: 'IN',
    country_name: 'India',
    abbreviation: 'Other',
    full_name: 'Other',
    description: 'Other business structure not listed above (e.g., Joint Venture, Branch Office, Subsidiary).',
    liability: null,
    tax_type: 'other',
    tax_rate_info: null,
    min_members: 1,
    registration_required: null,
    annual_filing_required: null,
    audit_required: null
  }
];

// Parse command line arguments
const args = process.argv.slice(2);
const forceMode = args.includes('--force');
const useAPI = args.includes('--api');

// CouchDB Configuration
const COUCHDB_URL = process.env.COUCHDB_URL || 'http://admin:password@127.0.0.1:5984';
const DB_NAME = process.env.DB_COMMON || 'bmpl_common';

/**
 * Generate document ID for legal type
 */
function generateId(legalTypeData) {
  const countryCode = legalTypeData.country_iso_code.toLowerCase();
  const legalTypeSlug = legalTypeData.legal_type.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
  return `organization_legal_type:${countryCode}:${legalTypeSlug}`;
}

/**
 * Seed legal types via direct CouchDB access
 */
async function seedViaCouchDB() {
  console.log('🔗 Connecting to CouchDB...');
  console.log(`   URL: ${COUCHDB_URL.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`   Database: ${DB_NAME}`);

  const couchdb = nano(COUCHDB_URL);
  const db = couchdb.db.use(DB_NAME);

  // Check if database exists
  try {
    await db.info();
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Error: Database does not exist or connection failed');
    console.error('   Run setup-couchdb-sync script first or create the database manually');
    process.exit(1);
  }

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  console.log('\n📊 Seeding India legal types...\n');

  for (const legalTypeData of INDIA_LEGAL_TYPES) {
    const id = generateId(legalTypeData);

    try {
      // Check if document exists
      let existingDoc = null;
      try {
        existingDoc = await db.get(id);
      } catch (err) {
        if (err.statusCode !== 404) {
          throw err;
        }
      }

      const doc = {
        _id: id,
        type: 'organization_legal_type',
        ...legalTypeData,
        is_active: true,
        is_seed_data: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingDoc) {
        if (forceMode) {
          // Update existing document
          doc._rev = existingDoc._rev;
          await db.insert(doc);
          console.log(`✅ Updated: ${legalTypeData.legal_type} (${legalTypeData.full_name})`);
          results.updated++;
        } else {
          console.log(`⏭️  Skipped: ${legalTypeData.legal_type} (already exists, use --force to update)`);
          results.skipped++;
        }
      } else {
        // Create new document
        await db.insert(doc);
        console.log(`✅ Created: ${legalTypeData.legal_type} (${legalTypeData.full_name})`);
        results.created++;
      }
    } catch (error) {
      console.error(`❌ Error: ${legalTypeData.legal_type}`);
      console.error(`   ${error.message}`);
      results.errors.push({
        legal_type: legalTypeData.legal_type,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Seeding Summary');
  console.log('='.repeat(60));
  console.log(`✅ Created:  ${results.created}`);
  console.log(`🔄 Updated:  ${results.updated}`);
  console.log(`⏭️  Skipped:  ${results.skipped}`);
  console.log(`❌ Errors:   ${results.errors.length}`);
  console.log('='.repeat(60));

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`   - ${err.legal_type}: ${err.error}`);
    });
  }

  // Verify
  console.log('\n🔍 Verifying India legal types in database...');
  try {
    const queryResult = await db.find({
      selector: {
        type: 'organization_legal_type',
        country_iso_code: 'IN'
      }
    });
    console.log(`✅ Found ${queryResult.docs.length} India legal types in database`);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

/**
 * Seed legal types via API endpoint
 */
async function seedViaAPI() {
  console.log('🌐 Using API endpoint to seed data...');

  const API_URL = process.env.API_URL || 'http://localhost:3000';
  const endpoint = `${API_URL}/api/common/legal-types`;

  console.log(`   API URL: ${endpoint}`);

  const results = {
    created: 0,
    skipped: 0,
    errors: []
  };

  console.log('\n📊 Seeding India legal types via API...\n');

  for (const legalTypeData of INDIA_LEGAL_TYPES) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(legalTypeData)
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Created: ${legalTypeData.legal_type} (${legalTypeData.full_name})`);
        results.created++;
      } else {
        if (result.error && result.error.includes('conflict')) {
          console.log(`⏭️  Skipped: ${legalTypeData.legal_type} (already exists)`);
          results.skipped++;
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      }
    } catch (error) {
      console.error(`❌ Error: ${legalTypeData.legal_type}`);
      console.error(`   ${error.message}`);
      results.errors.push({
        legal_type: legalTypeData.legal_type,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Seeding Summary');
  console.log('='.repeat(60));
  console.log(`✅ Created:  ${results.created}`);
  console.log(`⏭️  Skipped:  ${results.skipped}`);
  console.log(`❌ Errors:   ${results.errors.length}`);
  console.log('='.repeat(60));

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`   - ${err.legal_type}: ${err.error}`);
    });
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🇮🇳 Seed India Legal Types to CouchDB');
  console.log('='.repeat(60));
  console.log(`Total legal types to seed: ${INDIA_LEGAL_TYPES.length}`);
  console.log(`Force mode: ${forceMode ? 'ON' : 'OFF'}`);
  console.log(`Method: ${useAPI ? 'API' : 'Direct CouchDB'}`);
  console.log('='.repeat(60) + '\n');

  try {
    if (useAPI) {
      await seedViaAPI();
    } else {
      await seedViaCouchDB();
    }

    console.log('\n✅ Seeding completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
