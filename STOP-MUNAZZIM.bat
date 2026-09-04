@echo off
REM ============================================================
REM  STOP-MUNAZZIM.bat
REM  Windows shutdown script for Munazzim AI Time Manager.
REM  Stops only the Next.js dev server and Firebase emulators
REM  started by START-MUNAZZIM.bat. Ollama is left running
REM  intentionally, since it may be a shared local service.
REM  Delegates to scripts\windows\stop-munazzim.ps1.
REM ============================================================
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\stop-munazzim.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
echo.
pause
exit /b %EXIT_CODE%
