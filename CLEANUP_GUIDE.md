# Repository Cleanup Guide

This guide will help you reduce your repository size to under 100 MB so it can be imported into Gemini.

## Step 1: Commit the .gitignore file

The `.gitignore` file has been created. Now commit it:

```bash
git add .gitignore
git commit -m "Add .gitignore to exclude node_modules and build files"
```

## Step 2: Remove node_modules from Git (if already committed)

If `node_modules` is already tracked in Git, remove it:

```bash
# Remove node_modules from Git tracking (but keep it locally)
git rm -r --cached node_modules

# Commit the removal
git commit -m "Remove node_modules from repository"
```

## Step 3: Check for other large files

Check what's taking up space in your repository:

```bash
# See the largest files in your repository
git ls-files | xargs ls -la | sort -k5 -rn | head -20
```

Or on Windows PowerShell:
```powershell
git ls-files | ForEach-Object { Get-Item $_ | Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB,2)}} } | Sort-Object "Size(KB)" -Descending | Select-Object -First 20
```

## Step 4: Remove large media files (if needed)

If you have large video/image files that shouldn't be in the repo:

```bash
# Remove specific large files/folders from Git
git rm -r --cached AssetViewer/assets/videos/
git rm -r --cached AssetViewer/assets/cover\ page/

# Commit the removal
git commit -m "Remove large media files from repository"
```

**Note:** If these media files are essential for your project, consider:
- Using Git LFS (Large File Storage)
- Hosting them on a CDN or cloud storage
- Adding them to `.gitignore` and documenting where to get them

## Step 5: Push changes to GitHub

After cleaning up:

```bash
git push origin main
```

## Step 6: Verify repository size

Check your repository size on GitHub or locally:

```bash
# Get repository size
du -sh .git
```

## Additional Tips

1. **If you need to remove files from Git history** (for very large files already pushed):
   - Use `git filter-branch` or `git filter-repo` (recommended)
   - This rewrites history, so coordinate with collaborators

2. **For future commits:**
   - The `.gitignore` will prevent `node_modules` and other ignored files from being added
   - Always run `git status` before committing to verify what's being added

3. **If media files are needed:**
   - Uncomment the media file exclusions in `.gitignore` if you want to keep them locally but not in Git
   - Or use Git LFS for large binary files

## Quick Check Commands

```bash
# Check if node_modules is tracked
git ls-files | grep node_modules

# Check repository size
git count-objects -vH

# See what would be committed
git status
```

