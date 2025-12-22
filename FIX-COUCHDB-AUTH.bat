@echo off
REM Fix CouchDB Authentication
REM This script helps you find and set the correct CouchDB credentials

echo ============================================================
echo Fix CouchDB Authentication
echo ============================================================
echo.
echo Your API cannot connect to CouchDB because the password is wrong.
echo Current credentials in api\.env: admin:password
echo.
echo ============================================================
echo OPTION 1: Open Fauxton and Find Credentials
echo ============================================================
echo.
echo 1. Opening Fauxton in your browser...
start http://127.0.0.1:5984/_utils
echo.
echo 2. Try logging in with different credentials
echo    Common defaults:
echo      - admin / admin
echo      - admin / password
echo      - couchdb / couchdb
echo.
echo 3. If login works, come back here and enter those credentials
echo.
pause
echo.
echo ============================================================
echo Enter Your CouchDB Credentials
echo ============================================================
echo.
set /p COUCH_USER=Enter CouchDB username (default: admin):
if "%COUCH_USER%"=="" set COUCH_USER=admin

set /p COUCH_PASS=Enter CouchDB password:
if "%COUCH_PASS%"=="" (
    echo ERROR: Password cannot be empty!
    pause
    exit /b 1
)

echo.
echo Testing credentials: %COUCH_USER%:***
echo.

REM Test the credentials
curl -s -f "http://%COUCH_USER%:%COUCH_PASS%@127.0.0.1:5984/_all_dbs" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ SUCCESS! Credentials work!
    echo.
    echo Updating api\.env...

    REM Backup original .env
    copy api\.env api\.env.backup >nul 2>nul

    REM Update the COUCHDB_URL line
    powershell -Command "(Get-Content api\.env) -replace 'COUCHDB_URL=http://.*@127.0.0.1:5984', 'COUCHDB_URL=http://%COUCH_USER%:%COUCH_PASS%@127.0.0.1:5984' | Set-Content api\.env"

    echo ✅ api\.env updated!
    echo Backup saved to: api\.env.backup
    echo.
    echo ============================================================
    echo NEXT STEP: Restart the API
    echo ============================================================
    echo.
    echo Option 1: Run restart-api.bat
    echo Option 2: cd api ^&^& npm start
    echo.
    pause
) else (
    echo ❌ FAILED! Credentials don't work.
    echo.
    echo The credentials you entered cannot access CouchDB.
    echo.
    echo Try again or use Option 2 below.
    echo.
    pause
)

echo.
echo ============================================================
echo OPTION 2: Create New Admin User in CouchDB
echo ============================================================
echo.
echo If you don't know the password, you can create a new admin:
echo.
echo Run this command:
echo curl -X PUT http://localhost:5984/_node/_local/_config/admins/admin -d "\"password\""
echo.
echo But this requires you to already be an admin!
echo.
pause

echo.
echo ============================================================
echo OPTION 3: Reset CouchDB (DANGEROUS - Deletes All Data!)
echo ============================================================
echo.
echo If nothing else works, you can reset CouchDB.
echo WARNING: This will delete ALL your CouchDB data!
echo.
echo Steps:
echo 1. Stop CouchDB service
echo 2. Delete: C:\Program Files\Apache CouchDB\data
echo 3. Restart CouchDB
echo 4. Setup wizard will run and let you create new admin
echo.
pause
