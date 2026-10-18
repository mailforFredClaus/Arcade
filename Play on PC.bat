@echo off
title Arcade
cd /d "%~dp0"
echo Starting the arcade. Your browser will open in a moment.
echo Keep this window open while you play; close it to stop.
echo.
start "" /b cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:8080/"
node tools\serve.mjs
pause
