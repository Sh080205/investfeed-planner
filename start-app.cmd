@echo off
rem ===== InvestFeed + Planner launcher =====
rem Double-click to start the server (if not running) and open the browser.
cd /d "%~dp0"

rem If the server is already listening on port 3000, just open the browser
netstat -ano | findstr "LISTENING" | findstr ":3000 " >nul
if not errorlevel 1 (
  start "" "http://localhost:3000"
  exit /b 0
)

rem Start the server minimized, give it a moment, then open the browser
start "InvestFeed + Planner" /min cmd /c "node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"
exit /b 0
