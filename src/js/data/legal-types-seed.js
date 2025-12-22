/**
 * Seed Data for Organization Legal Types
 * Country-specific legal structures with compliance, tax, and formation info
 */

export const LEGAL_TYPES_SEED_DATA = [
  // ============================================
  // UNITED STATES
  // ============================================
  {
    legal_type: 'LLC',
    country_iso_code: 'US',
    country_name: 'United States',
    abbreviation: 'LLC',
    full_name: 'Limited Liability Company',
    description: 'A flexible business structure that combines the limited liability protection of a corporation with the pass-through taxation of a partnership.',
    liability: 'limited',
    tax_type: 'pass-through',
    tax_rate_info: 'Pass-through taxation (members report profit/loss on personal returns). Can elect corporate taxation.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Inc',
    country_iso_code: 'US',
    country_name: 'United States',
    abbreviation: 'Inc',
    full_name: 'Incorporated (C-Corporation)',
    description: 'A C-Corporation with separate legal entity status, offering maximum liability protection and corporate taxation.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Corporate income tax at federal (21%) and state levels. Double taxation on dividends.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Corp',
    country_iso_code: 'US',
    country_name: 'United States',
    abbreviation: 'Corp',
    full_name: 'Corporation',
    description: 'Similar to Inc, a separate legal entity with limited liability protection for shareholders.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Corporate income tax unless S-Corp election filed for pass-through treatment.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'LLP',
    country_iso_code: 'US',
    country_name: 'United States',
    abbreviation: 'LLP',
    full_name: 'Limited Liability Partnership',
    description: 'A partnership structure providing limited liability protection to all partners.',
    liability: 'limited',
    tax_type: 'pass-through',
    tax_rate_info: 'Pass-through taxation to partners. Partners pay self-employment tax.',
    min_members: 2,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Partnership',
    country_iso_code: 'US',
    country_name: 'United States',
    abbreviation: 'Partnership',
    full_name: 'General Partnership',
    description: 'Two or more individuals sharing ownership, management, profits, and unlimited personal liability.',
    liability: 'unlimited',
    tax_type: 'pass-through',
    tax_rate_info: 'Pass-through taxation. Partners report income on Schedule K-1.',
    min_members: 2,
    registration_required: false,
    annual_filing_required: false,
    audit_required: false
  },
  {
    legal_type: 'Sole Proprietorship',
    country_iso_code: 'US',
    country_name: 'United States',
    abbreviation: 'Sole Prop',
    full_name: 'Sole Proprietorship',
    description: 'The simplest business structure where one individual owns and operates the business with unlimited personal liability.',
    liability: 'unlimited',
    tax_type: 'pass-through',
    tax_rate_info: 'Business income reported on personal tax return (Schedule C). Self-employment tax applies.',
    min_members: 1,
    registration_required: false,
    annual_filing_required: false,
    audit_required: false
  },
  {
    legal_type: 'Nonprofit',
    country_iso_code: 'US',
    country_name: 'United States',
    abbreviation: 'Nonprofit',
    full_name: 'Nonprofit Corporation',
    description: 'Tax-exempt organization operated for charitable, educational, religious, or scientific purposes under 501(c)(3).',
    liability: 'limited',
    tax_type: 'exempt',
    tax_rate_info: 'Tax-exempt under IRS 501(c)(3) or similar status. Must file Form 990 annually.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Other',
    country_iso_code: 'US',
    country_name: 'United States',
    abbreviation: 'Other',
    full_name: 'Other',
    description: 'Other business structure not listed above (e.g., B-Corp, Cooperative, Trust).',
    liability: null,
    tax_type: 'other',
    tax_rate_info: null,
    min_members: 1,
    registration_required: null,
    annual_filing_required: null,
    audit_required: null
  },

  // ============================================
  // CANADA
  // ============================================
  {
    legal_type: 'Ltd',
    country_iso_code: 'CA',
    country_name: 'Canada',
    abbreviation: 'Ltd',
    full_name: 'Limited Company',
    description: 'A private limited company under Canadian law offering limited liability to shareholders.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Federal corporate tax (15%) plus provincial corporate tax (varies by province). Small business deduction available.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Inc',
    country_iso_code: 'CA',
    country_name: 'Canada',
    abbreviation: 'Inc',
    full_name: 'Incorporated',
    description: 'Canadian incorporated company with limited liability protection for shareholders.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Federal and provincial corporate income tax. Dividend tax credit available to shareholders.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Partnership',
    country_iso_code: 'CA',
    country_name: 'Canada',
    abbreviation: 'Partnership',
    full_name: 'General Partnership',
    description: 'Two or more partners sharing unlimited liability for business debts and obligations.',
    liability: 'unlimited',
    tax_type: 'pass-through',
    tax_rate_info: 'Partners report income on personal tax returns. No entity-level taxation.',
    min_members: 2,
    registration_required: false,
    annual_filing_required: false,
    audit_required: false
  },
  {
    legal_type: 'Sole Proprietorship',
    country_iso_code: 'CA',
    country_name: 'Canada',
    abbreviation: 'Sole Prop',
    full_name: 'Sole Proprietorship',
    description: 'Unincorporated business owned and operated by one individual.',
    liability: 'unlimited',
    tax_type: 'pass-through',
    tax_rate_info: 'Business income reported on personal T1 return. CPP contributions required.',
    min_members: 1,
    registration_required: false,
    annual_filing_required: false,
    audit_required: false
  },
  {
    legal_type: 'Nonprofit',
    country_iso_code: 'CA',
    country_name: 'Canada',
    abbreviation: 'NPO',
    full_name: 'Nonprofit Organization',
    description: 'Organization registered for charitable, educational, or public benefit purposes.',
    liability: 'limited',
    tax_type: 'exempt',
    tax_rate_info: 'Registered charities exempt from income tax. Must file T3010 annually.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Other',
    country_iso_code: 'CA',
    country_name: 'Canada',
    abbreviation: 'Other',
    full_name: 'Other',
    description: 'Other business structure not listed above (e.g., Cooperative, Trust).',
    liability: null,
    tax_type: 'other',
    tax_rate_info: null,
    min_members: 1,
    registration_required: null,
    annual_filing_required: null,
    audit_required: null
  },

  // ============================================
  // UNITED KINGDOM
  // ============================================
  {
    legal_type: 'Ltd',
    country_iso_code: 'GB',
    country_name: 'United Kingdom',
    abbreviation: 'Ltd',
    full_name: 'Private Limited Company',
    description: 'UK private limited company by shares, limited by liability with shares not publicly traded.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Corporation Tax on profits (19% main rate, 25% for profits over £250,000).',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'PLC',
    country_iso_code: 'GB',
    country_name: 'United Kingdom',
    abbreviation: 'PLC',
    full_name: 'Public Limited Company',
    description: 'UK public limited company that can offer shares to the public and trade on stock exchanges.',
    liability: 'limited',
    tax_type: 'corporate',
    tax_rate_info: 'Corporation Tax on profits. Subject to additional regulatory requirements.',
    min_members: 2,
    registration_required: true,
    annual_filing_required: true,
    audit_required: true
  },
  {
    legal_type: 'LLP',
    country_iso_code: 'GB',
    country_name: 'United Kingdom',
    abbreviation: 'LLP',
    full_name: 'Limited Liability Partnership',
    description: 'UK partnership structure combining partnership flexibility with limited liability protection.',
    liability: 'limited',
    tax_type: 'pass-through',
    tax_rate_info: 'Partners taxed individually on their share of profits. No corporation tax at entity level.',
    min_members: 2,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Partnership',
    country_iso_code: 'GB',
    country_name: 'United Kingdom',
    abbreviation: 'Partnership',
    full_name: 'General Partnership',
    description: 'Traditional partnership where partners share unlimited liability for business debts.',
    liability: 'unlimited',
    tax_type: 'pass-through',
    tax_rate_info: 'Partners pay income tax on their share of profits. Partnership files tax return (SA800).',
    min_members: 2,
    registration_required: false,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Sole Trader',
    country_iso_code: 'GB',
    country_name: 'United Kingdom',
    abbreviation: 'Sole Trader',
    full_name: 'Sole Trader',
    description: 'Self-employed individual trading under their own name or business name.',
    liability: 'unlimited',
    tax_type: 'pass-through',
    tax_rate_info: 'Income tax on profits via Self Assessment. National Insurance contributions required.',
    min_members: 1,
    registration_required: false,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Charity',
    country_iso_code: 'GB',
    country_name: 'United Kingdom',
    abbreviation: 'Charity',
    full_name: 'Charitable Incorporated Organization',
    description: 'Legal structure designed for charities, providing limited liability to members.',
    liability: 'limited',
    tax_type: 'exempt',
    tax_rate_info: 'Exempt from most taxes. Must be registered with Charity Commission.',
    min_members: 1,
    registration_required: true,
    annual_filing_required: true,
    audit_required: false
  },
  {
    legal_type: 'Other',
    country_iso_code: 'GB',
    country_name: 'United Kingdom',
    abbreviation: 'Other',
    full_name: 'Other',
    description: 'Other business structure not listed above (e.g., Community Interest Company, Trust).',
    liability: null,
    tax_type: 'other',
    tax_rate_info: null,
    min_members: 1,
    registration_required: null,
    annual_filing_required: null,
    audit_required: null
  },

  // ============================================
  // INDIA
  // ============================================
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

/**
 * Helper function to get legal types by country
 */
export function getLegalTypesByCountry(countryCode) {
  return LEGAL_TYPES_SEED_DATA.filter(
    item => item.country_iso_code === countryCode.toUpperCase()
  );
}

/**
 * Helper function to get all unique countries
 */
export function getCountries() {
  const countries = new Map();
  LEGAL_TYPES_SEED_DATA.forEach(item => {
    if (!countries.has(item.country_iso_code)) {
      countries.set(item.country_iso_code, item.country_name);
    }
  });
  return Array.from(countries, ([code, name]) => ({ code, name }));
}
