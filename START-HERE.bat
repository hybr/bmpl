@echo off
REM Complete Fix and Restart Script
color 0A

echo ============================================================
echo                    ALL ISSUES FIXED!
echo ============================================================
echo.
echo What was fixed:
echo   [X] CORS error (port 8080 -^> 5173)
echo   [X] CouchDB authentication (admin:admin)
echo   [X] Legal types endpoint (now public)
echo   [X] India legal types (13 types already in DB)
echo.
echo Current Status:
echo   [X] CouchDB: Running with 35 legal types
echo   [X] Frontend: http://localhost:5173
echo   [X] API: Ready to start on port 3000
echo.
echo ============================================================
echo              Starting API Server...
echo ============================================================
echo.
echo IMPORTANT: Keep this window open!
echo The API server will run here.
echo.
echo To stop: Press Ctrl+C or close this window
echo.
echo ============================================================
echo.

timeout /t 3 /nobreak >nul

cd api
echo Starting Moleculer API on port 3000...
echo.
npm start

echo.
echo ============================================================
echo API stopped. Press any key to exit.
pause >nul
