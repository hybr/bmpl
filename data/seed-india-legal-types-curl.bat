@echo off
REM Seed India Legal Types to CouchDB using cURL
REM Edit the COUCH_URL variable below with your actual credentials

REM ============================================================
REM CONFIGURATION - UPDATE THESE VALUES
REM ============================================================
SET COUCH_URL=http://admin:admin@127.0.0.1:5984
SET DB_NAME=bmpl_common

echo ============================================================
echo Seed India Legal Types to CouchDB
echo ============================================================
echo.
echo Using: %COUCH_URL%
echo Database: %DB_NAME%
echo.

REM Check if database exists, create if not
echo Checking/Creating database...
curl -X PUT "%COUCH_URL%/%DB_NAME%"
echo.
echo.

echo Seeding India legal types...
echo.

REM 1. Private Limited Company
echo Creating: Pvt. Ltd. (Private Limited Company)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:pvt-ltd" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:pvt-ltd\",\"type\":\"organization_legal_type\",\"legal_type\":\"Pvt. Ltd.\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Pvt. Ltd.\",\"full_name\":\"Private Limited Company\",\"description\":\"Most popular business structure in India offering limited liability with minimum 2 directors and 2 shareholders.\",\"liability\":\"limited\",\"tax_type\":\"corporate\",\"tax_rate_info\":\"Corporate tax rate: 25%% (for companies with turnover up to ₹400 crores) or 30%%. Alternative Minimum Tax may apply.\",\"min_members\":2,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":true,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 2. Public Limited Company
echo Creating: Ltd. (Public Limited Company)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:ltd" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:ltd\",\"type\":\"organization_legal_type\",\"legal_type\":\"Ltd.\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Ltd.\",\"full_name\":\"Public Limited Company\",\"description\":\"Public company that can raise capital from public and list on stock exchanges. Requires minimum 3 directors and 7 shareholders.\",\"liability\":\"limited\",\"tax_type\":\"corporate\",\"tax_rate_info\":\"Corporate tax rate: 25%% or 30%%. Subject to additional compliance and SEBI regulations if listed.\",\"min_members\":7,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":true,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 3. Limited Liability Partnership
echo Creating: LLP (Limited Liability Partnership)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:llp" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:llp\",\"type\":\"organization_legal_type\",\"legal_type\":\"LLP\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"LLP\",\"full_name\":\"Limited Liability Partnership\",\"description\":\"Hybrid structure combining benefits of partnership and limited liability. Popular among professionals and startups.\",\"liability\":\"limited\",\"tax_type\":\"corporate\",\"tax_rate_info\":\"Taxed at 30%% plus surcharge and cess. No Dividend Distribution Tax. Partners taxed on profit share.\",\"min_members\":2,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":false,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 4. One Person Company
echo Creating: OPC (One Person Company)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:opc" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:opc\",\"type\":\"organization_legal_type\",\"legal_type\":\"OPC\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"OPC\",\"full_name\":\"One Person Company\",\"description\":\"Company structure for single entrepreneurs, introduced in Companies Act 2013. Requires one nominee.\",\"liability\":\"limited\",\"tax_type\":\"corporate\",\"tax_rate_info\":\"Corporate tax rate: 25%% or 30%% plus surcharge and cess.\",\"min_members\":1,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":true,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~6,2%.000Z\"}"
echo.

REM 5. Partnership Firm
echo Creating: Partnership (Partnership Firm)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:partnership" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:partnership\",\"type\":\"organization_legal_type\",\"legal_type\":\"Partnership\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Partnership\",\"full_name\":\"Partnership Firm\",\"description\":\"Traditional partnership governed by Indian Partnership Act, 1932. Partners have unlimited liability.\",\"liability\":\"unlimited\",\"tax_type\":\"pass-through\",\"tax_rate_info\":\"Firm taxed at 30%% plus surcharge and cess. Partners also taxed on profit distribution.\",\"min_members\":2,\"registration_required\":false,\"annual_filing_required\":true,\"audit_required\":false,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 6. Sole Proprietorship
echo Creating: Sole Proprietorship
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:sole-proprietorship" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:sole-proprietorship\",\"type\":\"organization_legal_type\",\"legal_type\":\"Sole Proprietorship\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Proprietorship\",\"full_name\":\"Sole Proprietorship\",\"description\":\"Simplest business structure where individual owns and runs the business. No separate legal entity.\",\"liability\":\"unlimited\",\"tax_type\":\"pass-through\",\"tax_rate_info\":\"Business income taxed as per individual income tax slabs (up to 30%% plus surcharge and cess).\",\"min_members\":1,\"registration_required\":false,\"annual_filing_required\":false,\"audit_required\":false,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 7. Section 8 Company
echo Creating: Section 8 Company (Nonprofit)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:section-8-company" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:section-8-company\",\"type\":\"organization_legal_type\",\"legal_type\":\"Section 8 Company\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Sec 8\",\"full_name\":\"Section 8 Company (Nonprofit)\",\"description\":\"Company registered under Section 8 of Companies Act for charitable purposes. Profits used for promoting objectives.\",\"liability\":\"limited\",\"tax_type\":\"exempt\",\"tax_rate_info\":\"Exempt from income tax under Section 12A/12AA if registered. Must file annual returns.\",\"min_members\":2,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":true,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 8. Hindu Undivided Family
echo Creating: HUF (Hindu Undivided Family)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:huf" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:huf\",\"type\":\"organization_legal_type\",\"legal_type\":\"HUF\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"HUF\",\"full_name\":\"Hindu Undivided Family\",\"description\":\"Unique Indian business structure for Hindu families. Managed by Karta (head of family) on behalf of family members.\",\"liability\":\"unlimited\",\"tax_type\":\"corporate\",\"tax_rate_info\":\"Taxed as separate entity with same income tax slabs as individuals (up to 30%% plus surcharge and cess).\",\"min_members\":1,\"registration_required\":false,\"annual_filing_required\":true,\"audit_required\":false,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 9. Private Trust
echo Creating: Trust (Private Trust)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:trust" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:trust\",\"type\":\"organization_legal_type\",\"legal_type\":\"Trust\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Trust\",\"full_name\":\"Private Trust\",\"description\":\"Legal arrangement where trustee holds property/assets for beneficiaries. Can be charitable or private.\",\"liability\":\"limited\",\"tax_type\":\"exempt\",\"tax_rate_info\":\"Charitable trusts exempt under Section 11 if registered. Private trusts taxed at maximum marginal rate.\",\"min_members\":1,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":false,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~6,2%.000Z\"}"
echo.

REM 10. Registered Society
echo Creating: Society (Registered Society)
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:society" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:society\",\"type\":\"organization_legal_type\",\"legal_type\":\"Society\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Society\",\"full_name\":\"Registered Society\",\"description\":\"Registered under Societies Registration Act, 1860 for charitable, literary, or scientific purposes.\",\"liability\":\"limited\",\"tax_type\":\"exempt\",\"tax_rate_info\":\"Exempt from income tax if registered under Section 12A/12AA. Must maintain proper accounts.\",\"min_members\":7,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":false,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 11. Producer Company
echo Creating: Producer Company
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:producer-company" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:producer-company\",\"type\":\"organization_legal_type\",\"legal_type\":\"Producer Company\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Producer Co.\",\"full_name\":\"Producer Company\",\"description\":\"Specialized company for farmers/producers to collectively improve their economic conditions. Governed by Part IXA of Companies Act.\",\"liability\":\"limited\",\"tax_type\":\"corporate\",\"tax_rate_info\":\"Corporate tax at 25%% or 30%%. Eligible for various agricultural exemptions and benefits.\",\"min_members\":10,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":true,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 12. Cooperative Society
echo Creating: Cooperative Society
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:cooperative-society" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:cooperative-society\",\"type\":\"organization_legal_type\",\"legal_type\":\"Cooperative Society\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Co-op\",\"full_name\":\"Cooperative Society\",\"description\":\"Member-owned organization registered under state cooperative acts. Common in agriculture, housing, and credit sectors.\",\"liability\":\"limited\",\"tax_type\":\"corporate\",\"tax_rate_info\":\"Lower tax rate (22%% plus surcharge) for cooperatives. Special deductions available under Section 80P.\",\"min_members\":10,\"registration_required\":true,\"annual_filing_required\":true,\"audit_required\":true,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

REM 13. Other
echo Creating: Other
curl -X PUT "%COUCH_URL%/%DB_NAME%/organization_legal_type:in:other" ^
  -H "Content-Type: application/json" ^
  -d "{\"_id\":\"organization_legal_type:in:other\",\"type\":\"organization_legal_type\",\"legal_type\":\"Other\",\"country_iso_code\":\"IN\",\"country_name\":\"India\",\"abbreviation\":\"Other\",\"full_name\":\"Other\",\"description\":\"Other business structure not listed above (e.g., Joint Venture, Branch Office, Subsidiary).\",\"liability\":null,\"tax_type\":\"other\",\"tax_rate_info\":null,\"min_members\":1,\"registration_required\":null,\"annual_filing_required\":null,\"audit_required\":null,\"is_active\":true,\"is_seed_data\":true,\"createdBy\":\"system\",\"createdAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\",\"updatedAt\":\"%date:~-4,4%-%date:~-10,2%-%date:~-7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z\"}"
echo.

echo.
echo ============================================================
echo Seeding Complete!
echo ============================================================
echo.
echo Verifying India legal types in database...
curl "%COUCH_URL%/%DB_NAME%/_design/common/_view/by_country?key=\"IN\""
echo.
echo.
echo ============================================================
echo Total: 13 India legal types created
echo ============================================================
pause
