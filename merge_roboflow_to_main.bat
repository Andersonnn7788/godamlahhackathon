@echo off
echo ========================================
echo Merging Roboflow Branch to Main
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo Step 1: Checking current branch...
git branch --show-current
echo.

echo Step 2: Making sure we're on roboflow branch...
git checkout roboflow
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to checkout roboflow branch
    pause
    exit /b 1
)
echo.

echo Step 3: Restoring any deleted files...
git checkout roboflow -- .
echo.

echo Step 4: Checking status...
git status
echo.

echo Step 5: Adding all changes...
git add .
echo.

echo Step 6: Committing changes...
git commit -m "Complete roboflow integration with TOLONG SAYA functionality"
if %ERRORLEVEL% EQU 0 (
    echo Commit successful!
) else (
    echo No changes to commit or commit failed
)
echo.

echo Step 7: Pushing roboflow branch...
git push origin roboflow
echo.

echo Step 8: Switching to main branch...
git checkout main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to checkout main branch
    pause
    exit /b 1
)
echo.

echo Step 9: Pulling latest main...
git pull origin main
echo.

echo Step 10: Merging roboflow into main...
git merge roboflow -m "Merge roboflow branch with TOLONG SAYA functionality"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo MERGE CONFLICTS DETECTED!
    echo ========================================
    echo Please resolve conflicts manually:
    echo 1. Open conflicted files in your editor
    echo 2. Look for conflict markers (^<^<^<^<^<^<^<, =======, ^>^>^>^>^>^>^>)
    echo 3. Choose which version to keep
    echo 4. Remove conflict markers
    echo 5. Run: git add ^<resolved-file^>
    echo 6. Run: git commit -m "Resolved merge conflicts"
    echo 7. Run: git push origin main
    echo.
    pause
    exit /b 1
)
echo.

echo Step 11: Pushing merged main branch...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push to main
    echo You may need to resolve conflicts or force push
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS! Merge completed successfully!
echo ========================================
echo.
echo Your roboflow branch has been merged into main.
echo All TOLONG SAYA functionality is now in main branch.
echo.
echo Next steps:
echo 1. Get the video file from the old main branch
echo 2. Place it in frontend/public/videos/
echo 3. Test the application
echo.
pause

