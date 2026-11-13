@echo off
setlocal
cd /d "%~dp0"
set "TRACKER_ARCH=x64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "TRACKER_ARCH=arm64"
if /i "%PROCESSOR_ARCHITEW6432%"=="ARM64" set "TRACKER_ARCH=arm64"
set "TRACKER_NODE=%~dp0runtime\win-%TRACKER_ARCH%\node.exe"
if exist "%TRACKER_NODE%" goto run
where node >nul 2>nul
if errorlevel 1 (
 echo Bundled Node is missing. Download and extract the complete Application tracker ZIP.
 pause
 exit /b 1
)
set "TRACKER_NODE=node"
:run
"%TRACKER_NODE%" "%~dp0app\launch.mjs" --restart
if errorlevel 1 pause
