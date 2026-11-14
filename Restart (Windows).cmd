@echo off
setlocal
cd /d "%~dp0"
set "TRACKER_ARCH=x64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "TRACKER_ARCH=arm64"
if /i "%PROCESSOR_ARCHITEW6432%"=="ARM64" set "TRACKER_ARCH=arm64"
set "TRACKER_NODE=%~dp0runtime\win-%TRACKER_ARCH%\node.exe"
if exist "%TRACKER_NODE%" goto run
if /i "%TRACKER_ARCH%"=="arm64" (
 echo No Application tracker package exists yet for Windows ARM64.
) else (
 echo Windows x64 runtime missing. Download and extract Application-tracker-windows-x64.zip again.
)
pause
exit /b 1
:run
"%TRACKER_NODE%" "%~dp0app\launch.mjs" --restart
if errorlevel 1 pause
