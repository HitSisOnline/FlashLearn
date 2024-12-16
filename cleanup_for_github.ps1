# FlashLearn GitHub Upload Cleanup Script
# Run this before uploading to remove any AI-revealing files

Write-Host "Cleaning up FlashLearn for GitHub upload..." -ForegroundColor Green

# Remove this cleanup script itself
if (Test-Path "cleanup_for_github.ps1") {
    Remove-Item "cleanup_for_github.ps1" -Force
    Write-Host "✓ Removed cleanup script" -ForegroundColor Yellow
}

# Remove GitHub upload guide (contains AI references)
if (Test-Path "GITHUB_UPLOAD_GUIDE.md") {
    Remove-Item "GITHUB_UPLOAD_GUIDE.md" -Force
    Write-Host "✓ Removed GitHub upload guide" -ForegroundColor Yellow
}

# Stage the cleanup
git add -A
git commit -m "Clean up development files for public release"

Write-Host "✓ Repository cleaned and ready for GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create new GitHub repository" -ForegroundColor White
Write-Host "2. git remote add origin <your-repo-url>" -ForegroundColor White
Write-Host "3. git push -u origin master" -ForegroundColor White
Write-Host ""
Write-Host "Your FlashLearn portfolio project is ready! 🎉" -ForegroundColor Green
