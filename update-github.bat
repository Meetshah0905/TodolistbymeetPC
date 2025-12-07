@echo off
echo ========================================
echo Updating GitHub with .gitignore
echo ========================================
echo.

echo Step 1: Adding .gitignore to Git...
git add .gitignore
if %errorlevel% neq 0 (
    echo ERROR: Failed to add .gitignore
    pause
    exit /b 1
)
echo ✓ .gitignore added successfully
echo.

echo Step 2: Committing changes...
git commit -m "Add .gitignore to exclude node_modules and build files"
if %errorlevel% neq 0 (
    echo WARNING: Commit failed. This might be normal if there are no changes.
    echo Checking status...
    git status
    pause
    exit /b 1
)
echo ✓ Changes committed successfully
echo.

echo Step 3: Pushing to GitHub...
echo (This may ask for your GitHub credentials)
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Push failed. Trying 'master' branch instead...
    git push origin master
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Push failed. Common issues:
        echo - Check your internet connection
        echo - Verify your GitHub credentials
        echo - Make sure you have push access to the repository
        pause
        exit /b 1
    )
)
echo.
echo ========================================
echo ✓ Successfully updated GitHub!
echo ========================================
echo.
echo Your .gitignore file is now on GitHub.
echo Check your repository to verify.
echo.
pause

