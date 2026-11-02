@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Profit-AutoLogin.ps1"
if errorlevel 1 (
  echo.
  echo Dang nhap chua thanh cong. Xem thong bao ben tren.
  pause
)
