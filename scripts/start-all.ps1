# Master script for Spotify-Party (Golden Solution: Static Backend + Dynamic App)
$ErrorActionPreference = "Stop"

Write-Host "--- Starting Spotify-Party (Golden Solution) ---" -ForegroundColor Cyan

# 1. Start Backend Tunnel (Static Ngrok Domain)
Write-Host "Starting Static Backend Tunnel (ngrok)..." -ForegroundColor Yellow
$backendProcess = Start-Process "npx.cmd" -ArgumentList "ngrok", "http", "--domain=ripply-unconcentrated-lindy.ngrok-free.dev", "3000" -PassThru -NoNewWindow

# 2. Start Mobile Tunnel (Dynamic Cloudflare)
Write-Host "Starting Dynamic Mobile Tunnel (Cloudflare)..." -ForegroundColor Yellow
Remove-Item "cf_mobile.log" -ErrorAction SilentlyContinue
$mobileProcess = Start-Process "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:8081" -PassThru -NoNewWindow -RedirectStandardError "cf_mobile.log"

Write-Host "Waiting for Mobile URL..." -ForegroundColor Yellow

$mobileUrl = ""
$startTime = Get-Date

while ([string]::IsNullOrWhiteSpace($mobileUrl) -and ((Get-Date) - $startTime).TotalSeconds -lt 30) {
    if (Test-Path "cf_mobile.log") {
        if ((Get-Content "cf_mobile.log" -Raw) -match "https://[a-z0-9-]+\.trycloudflare\.com") { $mobileUrl = $matches[0] }
    }
    Start-Sleep -Seconds 1
}

if ([string]::IsNullOrWhiteSpace($mobileUrl)) {
    Write-Host "Error: Could not get mobile tunnel URL. Check cf_mobile.log." -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $mobileProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✅ Backend (Static): https://ripply-unconcentrated-lindy.ngrok-free.dev" -ForegroundColor Green
Write-Host "✅ Mobile (Dynamic): $mobileUrl" -ForegroundColor Green

# 3. Start Expo
Write-Host "Starting Expo..." -ForegroundColor Cyan
$env:EXPO_PACKAGER_PROXY_URL = $mobileUrl
cd mobile
npx.cmd expo start --clear

# Cleanup
if ($backendProcess) { Stop-Process -Id $backendProcess.Id -Force }
if ($mobileProcess) { Stop-Process -Id $mobileProcess.Id -Force }
