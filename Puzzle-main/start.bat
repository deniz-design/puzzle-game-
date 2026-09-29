@echo off
REM Starts a local server for Puzzle Cam and opens it in your browser.
REM The app needs a local server: app.js is an ES module and the camera
REM needs a secure context, so opening index.html directly will not work.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
  node serve.mjs "%~dp0" 8000
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Node not found, falling back to Python.
  start "" http://127.0.0.1:8000/
  py -m http.server 8000 --bind 127.0.0.1
  goto :eof
)

echo Could not find Node.js or Python. Install Node.js from https://nodejs.org
pause
