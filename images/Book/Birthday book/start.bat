@echo off
setlocal

cd /d "%~dp0"
title Birthday Book - Next.js Dev Server

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js LTS and run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js LTS and run this file again.
  pause
  exit /b 1
)

if not exist package.json (
  echo package.json was not found in:
  echo %CD%
  pause
  exit /b 1
)

if not exist node_modules\.bin\next.cmd (
  echo Dependencies are missing. Installing from package-lock.json...
  call npm.cmd ci
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    echo Close any running Next.js or Node.js process and try again.
    pause
    exit /b 1
  )
)

REM Reuse an already running dev server instead of starting a duplicate.
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo The Birthday Book server is already running.
  start "" "http://localhost:3000"
  exit /b 0
)

if exist .next\dev\lock del /q .next\dev\lock >nul 2>nul

echo.
echo Birthday Book is starting...
echo Open http://localhost:3000 in your browser.
echo Keep this window open while using the app.
echo.
start "" "http://localhost:3000"
call npm.cmd run dev

if errorlevel 1 (
  echo.
  echo The development server stopped unexpectedly.
  pause
)

endlocal
