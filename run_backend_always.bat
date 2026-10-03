@echo off
title LandTrace360 Always-On Backend Service
color 0A

echo =========================================================
echo    LandTrace360 Always-On Backend Watchdog Service
echo    Ports: Express (5000) ^| FastAPI (8000)
echo    Cloudflare Edge: https://landtrace360-api.same-trail.workers.dev
echo =========================================================

:: Ensure working directory is project root
cd /d "%~dp0"

:loop
echo [%date% %time%] Starting FastAPI Backend on port 8000...
start /B "" python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

echo [%date% %time%] Starting Express Coupled Backend on port 5000...
cd server
node index.js
cd ..

echo [%date% %time%] [WARNING] Backend process exited! Auto-restarting in 2 seconds...
timeout /t 2 /nobreak > nul
goto loop
