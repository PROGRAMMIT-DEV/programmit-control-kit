@echo off
setlocal

where py >nul 2>&1
if %errorlevel%==0 (
  py -3 "%~dp0programmit-auto-memory.py" %*
  exit /b %errorlevel%
)

where python >nul 2>&1
if %errorlevel%==0 (
  python "%~dp0programmit-auto-memory.py" %*
  exit /b %errorlevel%
)

echo ERROR: PROGRAMMIT Control requiere Python 3.
exit /b 127
