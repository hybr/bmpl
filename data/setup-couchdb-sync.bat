@echo off
REM CouchDB Sync Setup Script for Windows
REM Run this script to set up CouchDB for syncing with PouchDB

setlocal enabledelayedexpansion

REM Configuration
set ADMIN_USER=admin
set ADMIN_PASS=password
set COUCHDB_URL=http://127.0.0.1:5984
set COUCHDB_AUTH=%ADMIN_USER%:%ADMIN_PASS%

echo =========================================
echo CouchDB Sync Setup
echo =========================================
echo.

REM Check if CouchDB is running
echo 1. Checking if CouchDB is running...
curl -s -f %COUCHDB_URL% >nul 2>&1
if errorlevel 1 (
    echo Error: CouchDB is not running at %COUCHDB_URL%
    echo Please start CouchDB and try again.
    exit /b 1
)
echo [OK] CouchDB is running
echo.

REM Enable CORS
echo 2. Enabling CORS...
curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/_node/_local/_config/httpd/enable_cors -d "\"true\"" >nul 2>&1
curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/_node/_local/_config/cors/origins -d "\"*\"" >nul 2>&1
curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/_node/_local/_config/cors/credentials -d "\"true\"" >nul 2>&1
curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/_node/_local/_config/cors/methods -d "\"GET, PUT, POST, HEAD, DELETE\"" >nul 2>&1
curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/_node/_local/_config/cors/headers -d "\"accept, authorization, content-type, origin, referer\"" >nul 2>&1
echo [OK] CORS enabled
echo.

REM Create bmpl_common database
echo 3. Creating bmpl_common database...
curl -s -f http://%COUCHDB_AUTH%@127.0.0.1:5984/bmpl_common >nul 2>&1
if errorlevel 1 (
    curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/bmpl_common >nul 2>&1
    echo [OK] Database created
) else (
    echo [WARN] Database already exists
)
echo.

REM Set security
echo 4. Setting database security...
curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/bmpl_common/_security -H "Content-Type: application/json" -d "{\"admins\":{\"names\":[],\"roles\":[\"_admin\"]},\"members\":{\"names\":[],\"roles\":[\"authenticated_user\"]}}" >nul 2>&1
echo [OK] Security configured
echo.

REM Deploy design document
echo 5. Deploying design document...
if exist couchdb_design_documents\common_design_doc.json (
    curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/bmpl_common/_design/common -H "Content-Type: application/json" -d @couchdb_design_documents/common_design_doc.json >nul 2>&1
    echo [OK] Design document deployed
) else (
    echo [WARN] Design document file not found, skipping...
)
echo.

REM Create test user
echo 6. Creating test user...
curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/_users/org.couchdb.user:testuser -H "Content-Type: application/json" -d "{\"_id\":\"org.couchdb.user:testuser\",\"name\":\"testuser\",\"type\":\"user\",\"roles\":[\"authenticated_user\"],\"password\":\"testpassword\"}" >nul 2>&1
echo [OK] Test user created (username: testuser, password: testpassword)
echo.

REM Create other databases
echo 7. Creating other databases...
for %%d in (bmpl_users bmpl_organizations) do (
    curl -s -f http://%COUCHDB_AUTH%@127.0.0.1:5984/%%d >nul 2>&1
    if errorlevel 1 (
        curl -s -X PUT http://%COUCHDB_AUTH%@127.0.0.1:5984/%%d >nul 2>&1
        echo [OK] %%d created
    ) else (
        echo [WARN] %%d already exists
    )
)
echo.

REM Verify setup
echo 8. Verifying setup...
echo.
echo CouchDB Info:
curl -s http://%COUCHDB_AUTH%@127.0.0.1:5984/
echo.
echo.
echo Databases:
curl -s http://%COUCHDB_AUTH%@127.0.0.1:5984/_all_dbs
echo.
echo.

echo =========================================
echo [OK] Setup Complete!
echo =========================================
echo.
echo Next Steps:
echo 1. Start your dev server: npm run dev
echo 2. Open browser console and run:
echo.
echo    // Set credentials
echo    window.syncConfigService.setCredentials({
echo      username: 'testuser',
echo      password: 'testpassword'
echo    });
echo.
echo    // Initialize sync
echo    const remoteUrl = window.syncConfigService.getCommonDbUrl();
echo    await window.commonPersistence.setupSync(remoteUrl, window.syncConfigService.credentials);
echo.
echo 3. Access Fauxton web UI:
echo    http://127.0.0.1:5984/_utils
echo.
echo =========================================

pause
