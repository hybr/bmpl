@echo off
REM Test API Endpoints

echo ============================================================
echo Testing API Endpoints
echo ============================================================
echo.

echo [1/4] Testing API is running...
curl -s http://localhost:3000/ >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    Status: RUNNING
) else (
    echo    Status: NOT RUNNING
    echo    Please start API first: START-HERE.bat
    pause
    exit /b 1
)
echo.

echo [2/4] Testing Legal Types Endpoint...
curl -s http://localhost:3000/api/common/legal-types?country=IN > test-response.json 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    Status: SUCCESS
    findstr /C:"success" test-response.json >nul
    if %ERRORLEVEL% EQU 0 (
        echo    Response: API returned data
    )
) else (
    echo    Status: FAILED
)
echo.

echo [3/4] Checking India Legal Types...
findstr /C:"Pvt. Ltd." test-response.json >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    Status: FOUND India legal types!
    echo.
    echo    Sample types found:
    findstr /C:"legal_type" test-response.json | findstr /C:"IN" | head -5
) else (
    echo    Status: No India types found (might be auth issue)
)
echo.

echo [4/4] Testing CouchDB Connection...
curl -s http://admin:admin@127.0.0.1:5984/_all_dbs >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    Status: CONNECTED
    echo    Credentials: admin:admin working
) else (
    echo    Status: FAILED
    echo    CouchDB authentication issue
)
echo.

del test-response.json >nul 2>nul

echo ============================================================
echo Test Complete
echo ============================================================
echo.
echo Next Steps:
echo  1. If all tests passed: Refresh browser (Ctrl+Shift+R)
echo  2. If tests failed: Check API is running (START-HERE.bat)
echo.
pause
