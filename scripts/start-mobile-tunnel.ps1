# Script to start Expo with a stable Cloudflare tunnel (Restores QR Code)
$ErrorActionPreference = "Stop"

Write-Host "--- Start Mobile App Tunnel (Port 8081) ---" -ForegroundColor Cyan

# Clean old logs
Remove-Item "cloudflare_err.log" -ErrorAction SilentlyContinue
Remove-Item "cloudflare_out.log" -ErrorAction SilentlyContinue

# Start cloudflared for port 8081 in the background
$tunnelProcess = Start-Process "npx.cmd" -ArgumentList "-y", "cloudflared", "tunnel", "--url", "http://localhost:8081" -PassThru -NoNewWindow -RedirectStandardError "cloudflare_err.log" -RedirectStandardOutput "cloudflare_out.log"

# Start Backend Server (Node.js)
Write-Host "Starting Backend Server (Node.js)..." -ForegroundColor Yellow
$serverProcess = Start-Process "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "backend" -PassThru -NoNewWindow -RedirectStandardOutput "backend_server.log"

Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow

$tunnelUrl = ""
$startTime = Get-Date

while ([string]::IsNullOrWhiteSpace($tunnelUrl) -and ((Get-Date) - $startTime).TotalSeconds -lt 30) {
    $content = ""
    if (Test-Path "cloudflare_err.log") { $content += Get-Content "cloudflare_err.log" -Raw }
    if (Test-Path "cloudflare_out.log") { $content += Get-Content "cloudflare_out.log" -Raw }
    
    if ($content -match "https://[a-z0-9-]+\.trycloudflare\.com") {
        $tunnelUrl = $matches[0]
    }
    Start-Sleep -Seconds 1
}

if ([string]::IsNullOrWhiteSpace($tunnelUrl)) {
    Write-Host "Error: Could not get tunnel URL. Check cloudflare_err.log." -ForegroundColor Red
    if ($tunnelProcess) { Stop-Process -Id $tunnelProcess.Id -Force }
    exit 1
}

Write-Host "Tunnel Active: $tunnelUrl" -ForegroundColor Green
Write-Host "Starting Expo with QR Code..." -ForegroundColor Cyan

# Set the proxy URL environment variable and start expo
$env:EXPO_PACKAGER_PROXY_URL = $tunnelUrl
Set-Location -Path "mobile"
npx.cmd expo start --clear

# Cleanup tunnel and server on exit
Write-Host "Stopping tunnel and server..."
if ($tunnelProcess) { Stop-Process -Id $tunnelProcess.Id -Force }
if ($serverProcess) { Stop-Process -Id $serverProcess.Id -Force }
