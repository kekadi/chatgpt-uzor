# sync-claude-config.ps1
# Syncs local ~/.claude config files to the repo and pushes to GitHub

$source = "C:\Users\pekad\.claude"
$dest   = "$PSScriptRoot\config"
$repo   = $PSScriptRoot

# Ensure config folder exists
if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
}

# Files to sync
$files = @("CLAUDE.md", "settings.json")

foreach ($file in $files) {
    $src = Join-Path $source $file
    $dst = Join-Path $dest $file
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "Synced: $file"
    } else {
        Write-Host "Skipped (not found): $file"
    }
}

# Commit and push
Set-Location $repo
git add config/
git commit -m "sync claude config"
git push -u origin (git branch --show-current)

Write-Host "Done. Config synced and pushed."
