@echo off
echo Adding .gitignore to Git...
git add .gitignore

echo.
echo Checking if node_modules is tracked in Git...
git ls-files node_modules >nul 2>&1
if %errorlevel% == 0 (
    echo node_modules is tracked. Removing from Git (keeping local files)...
    git rm -r --cached node_modules
) else (
    echo node_modules is not tracked. Good!
)

echo.
echo Committing changes...
git commit -m "Add .gitignore to exclude node_modules and build files"

echo.
echo Done! Your .gitignore is now committed.
echo.
echo Next steps:
echo 1. If node_modules was removed, you may want to push: git push origin main
echo 2. Check repository size with: git count-objects -vH
echo.
pause

