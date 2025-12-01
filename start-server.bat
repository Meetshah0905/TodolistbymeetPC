@echo off
echo Starting local web server for Focus List app...
echo.
echo The app will be available at: http://localhost:8000
echo Navigate to: http://localhost:8000/AssetViewer/background-music.html
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
python -m http.server 8000
