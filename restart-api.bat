@echo off
REM Restart Moleculer API Server

echo ============================================================
echo Restarting Moleculer API Server
echo ============================================================
echo.

echo Stopping any existing API process...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq api*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting API server on port 3000...
echo.
echo IMPORTANT: Keep this window open!
echo The API server will run here.
echo.
echo To stop: Press Ctrl+C or close this window
echo.
echo ============================================================
echo.

cd api
npm start
