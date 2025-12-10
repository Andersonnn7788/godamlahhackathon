@echo off
echo ========================================
echo Creating Backup Before Merge
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Create backup branch name with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_BRANCH=roboflow-backup-%mydate%-%mytime%

echo Creating backup branch: %BACKUP_BRANCH%
echo.

REM Make sure we're on roboflow
git checkout roboflow
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to checkout roboflow branch
    pause
    exit /b 1
)

REM Create backup branch
git branch %BACKUP_BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create backup branch
    pause
    exit /b 1
)

REM Push backup to remote
git push origin %BACKUP_BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to push backup branch to remote
    echo Backup exists locally as: %BACKUP_BRANCH%
) else (
    echo Backup pushed to remote as: %BACKUP_BRANCH%
)

echo.
echo ========================================
echo Backup created successfully!
echo ========================================
echo.
echo Backup branch: %BACKUP_BRANCH%
echo.
echo If anything goes wrong during merge, you can restore with:
echo   git checkout %BACKUP_BRANCH%
echo.
pause

