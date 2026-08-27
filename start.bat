@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "PROJECT_DIR=%~dp0images\Book\Birthday book"

if not exist "%PROJECT_DIR%\start.bat" (
	echo Birthday Book startup file was not found:
	echo %PROJECT_DIR%\start.bat
	pause
	exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
	echo Python was not found. Install Python and run this file again.
	pause
	exit /b 1
)

title Birthday Website and Book
echo Starting the full Birthday website on http://localhost:8085
echo Starting the interactive book on http://localhost:3000
echo.

start "Birthday Book - Next.js" cmd /k call "%PROJECT_DIR%\start.bat"

set "WAIT_COUNT=0"
:wait_for_book
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if not errorlevel 1 goto book_ready
set /a WAIT_COUNT+=1
if %WAIT_COUNT% GEQ 60 goto book_timeout
timeout /t 1 /nobreak >nul
goto wait_for_book

:book_ready
echo Birthday Book is ready.
start "" "http://localhost:8085"
goto start_main_site

:book_timeout
echo Birthday Book did not become ready within 60 seconds.
start "" "http://localhost:8085"

:start_main_site

cd /d "%ROOT_DIR%"
python -m http.server 8085

endlocal


