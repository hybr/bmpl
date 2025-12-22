@echo off
REM System Status Check Script

echo ============================================================
echo BMPL System Status Check
echo ============================================================
echo.

REM Check Node.js
echo [1/6] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    node --version
    echo    Status: OK
) else (
    echo    Status: NOT FOUND
    echo    Please install Node.js from https://nodejs.org/
)
echo.

REM Check CouchDB
echo [2/6] Checking CouchDB...
curl -s http://127.0.0.1:5984/ >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    curl -s http://127.0.0.1:5984/ | findstr "couchdb"
    echo    Status: RUNNING
) else (
    echo    Status: NOT RUNNING
    echo    Please start CouchDB
)
echo.

REM Check API
echo [3/6] Checking Moleculer API...
curl -s http://localhost:3000/ >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    http://localhost:3000/
    echo    Status: RESPONDING
) else (
    echo    Status: NOT RUNNING
    echo    Start with: cd api ^&^& npm start
)
echo.

REM Check CouchDB Authentication
echo [4/6] Checking CouchDB Authentication...
curl -s http://admin:password@127.0.0.1:5984/_all_dbs >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    Credentials: admin:password
    echo    Status: AUTHENTICATED
) else (
    echo    Credentials: admin:password
    echo    Status: FAILED - Need correct credentials
    echo    See: QUICK-FIX.md
)
echo.

REM Check bmpl_common database
echo [5/6] Checking bmpl_common database...
curl -s -f http://admin:password@127.0.0.1:5984/bmpl_common >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    Database: bmpl_common
    echo    Status: EXISTS
) else (
    echo    Database: bmpl_common
    echo    Status: NOT FOUND or AUTHENTICATION FAILED
)
echo.

REM Check dependencies
echo [6/6] Checking API Dependencies...
if exist "api\node_modules" (
    echo    node_modules: EXISTS
    echo    Status: INSTALLED
) else (
    echo    node_modules: NOT FOUND
    echo    Run: cd api ^&^& npm install
)
echo.

echo ============================================================
echo Summary
echo ============================================================
echo.
echo Read these files for next steps:
echo  1. STATUS.md          - Current state and what's working
echo  2. QUICK-FIX.md       - Fix CouchDB credentials
echo  3. FIX-API-CONNECTION.md - Detailed troubleshooting
echo.
echo To seed India legal types (if CouchDB is fixed):
echo  - Run: seed-india-legal-types.bat
echo.
echo OR use browser console (no CouchDB needed):
echo  - Open browser console (F12)
echo  - Run: await window.seedDataService.seedLegalTypes()
echo.
echo ============================================================
pause
