# TOLAND WhatsApp Bridge Runner (Auto-Restart Daemon)
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "     TOLAND Denim - WhatsApp Automation Bridge Runner     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Sheikhpura, Barbigha, Khetalpura 811101 (Bihar)" -ForegroundColor DarkGray
Write-Host "Starting Baileys WebSocket daemon..." -ForegroundColor Yellow

$env:PORT = "8080"

while ($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting Baileys WhatsApp Bridge..." -ForegroundColor Cyan
    pnpm run bridge
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Bridge process stopped. Reconnecting in 5 seconds (Press Ctrl+C to terminate)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}
