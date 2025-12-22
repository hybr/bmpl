@echo off
REM Seed India Legal Types to CouchDB
REM This script populates the bmpl_common database with Indian organization legal types

echo ============================================================
echo Seed India Legal Types to CouchDB
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if CouchDB is running
echo Checking if CouchDB is running...
curl -s http://127.0.0.1:5984/ >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: CouchDB is not running at http://127.0.0.1:5984/
    echo Please start CouchDB first
    pause
    exit /b 1
)
echo CouchDB is running!
echo.

REM Check if bmpl_common database exists
echo Checking if bmpl_common database exists...
curl -s -f http://admin:password@127.0.0.1:5984/bmpl_common >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: bmpl_common database does not exist
    echo Creating database...
    curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_common
    echo.
)
echo Database exists!
echo.

REM Check if nano is installed
cd api
call npm list nano >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing nano package...
    call npm install nano
    echo.
)
cd ..

REM Run the seeding script
echo Running seeding script...
echo.
node scripts/seed-india-legal-types.js %*

echo.
echo ============================================================
echo Done!
echo ============================================================
pause
