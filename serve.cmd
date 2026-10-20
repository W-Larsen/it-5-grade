@echo off
rem Local preview of the whole site (home page, lessons, game) exactly as on GitHub Pages.
rem Double-click, or run:  serve.cmd [port]      (default port 8080)  -  stop with Ctrl+C
cd /d "%~dp0"
set PORT=%1
if "%PORT%"=="" set PORT=8080

python tools\build-site.py
if errorlevel 1 (
  echo Build failed. Is Python installed and on PATH?
  pause
  exit /b 1
)

echo.
echo Site is ready: http://localhost:%PORT%/   (Ctrl+C to stop)
start "" http://localhost:%PORT%/
python -m http.server %PORT% --directory _site
