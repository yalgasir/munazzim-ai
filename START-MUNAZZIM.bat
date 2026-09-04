@echo off
REM ============================================================
REM  START-MUNAZZIM.bat
REM  Windows startup script for Munazzim AI Time Manager.
REM  Double-click to run. Delegates to scripts\windows\start-munazzim.ps1
REM  for reliable process, port, and HTTP readiness checks.
REM ============================================================
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\start-munazzim.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
echo.
pause
exit /b %EXIT_CODE%
