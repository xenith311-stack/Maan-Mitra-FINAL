#!/bin/bash

# Script to fix repository structure by moving contents from "New Version 3" to root

echo "🔧 Fixing repository structure..."

# Remove the "New Version 3" folder from git tracking
git rm -r "New Version 3" --cached 2>/dev/null || true

# Add all current files to git (they're already in the right place locally)
git add .

# Commit the restructure
git commit -m "🔧 Fix repository structure: Move all files from 'New Version 3' to root

- Moved all project files from subdirectory to root level
- Fixed theme system files location
- Updated repository structure for proper deployment
- All components, styles, and configurations now in correct paths"

echo "✅ Repository structure fixed!"
echo "📁 All files are now in the root directory"
echo "🚀 Ready to push to GitHub"