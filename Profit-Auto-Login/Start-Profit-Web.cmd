@echo off
start "Profit Web" cmd /k "node \"%~dp0profit-local-proxy.js\""
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:47832/VNM/servlet/SvltLogin"
