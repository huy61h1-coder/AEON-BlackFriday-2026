@echo off
start "Profit Auto Login" cmd /k "node \"%~dp0local-web-server.js\""
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:47831"
