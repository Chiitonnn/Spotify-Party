# Master script for Spotify-Party (Golden Solution: Static Backend + Dynamic App)
$ErrorActionPreference = "Stop"

Write-Host "--- Starting Spotify-Party (Golden Solution) ---" -ForegroundColor Cyan

# 1. Clean old logs
Remove-Item "ngrok_backend.log", "cf_mobile.log" -ErrorAction SilentlyContinue

# 2. Start Backend Tunnel (Static Ngrok Domain)
Write-Host "Starting Static Backend Tunnel (ngrok)..." -ForegroundColor Yellow
$backendProcess = Start-Process "npx.cmd" -ArgumentList "ngrok", "http", "--domain=ripply-unconcentrated-lindy.ngrok-free.dev", "3000", "--log=stdout" -PassThru -NoNewWindow -RedirectStandardOutput "ngrok_backend.log"

# 2.5 Start Actual Backend Server (Node.js)
Write-Host "Starting Backend Server (Node.js)..." -ForegroundColor Yellow
$serverProcess = Start-Process "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "backend" -PassThru -NoNewWindow -RedirectStandardOutput "backend_server.log"

# 3. Start Mobile Tunnel (Dynamic Cloudflare)
Write-Host "Starting Dynamic Mobile Tunnel (Cloudflare)..." -ForegroundColor Yellow
$mobileProcess = Start-Process "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:8081" -PassThru -NoNewWindow -RedirectStandardError "cf_mobile.log"

Write-Host "Waiting for Mobile URL..." -ForegroundColor Yellow

$mobileUrl = ""
$startTime = Get-Date

while ([string]::IsNullOrWhiteSpace($mobileUrl) -and ((Get-Date) - $startTime).TotalSeconds -lt 30) {
    if (Test-Path "cf_mobile.log") {
        $content = Get-Content "cf_mobile.log" -Raw
        if ($content -and ($content -match "(https://[a-z0-9-]+\.trycloudflare\.com)")) {
            $mobileUrl = $matches[1]
        }
    }
    Start-Sleep -Seconds 1
}

if ([string]::IsNullOrWhiteSpace($mobileUrl)) {
    Write-Host "Error: Could not get mobile tunnel URL. Check cf_mobile.log." -ForegroundColor Red
    if (Test-Path "ngrok_backend.log") { Write-Host "Checking ngrok log..." ; Get-Content "ngrok_backend.log" -Tail 5 }
    if ($backendProcess) { Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($mobileProcess) { Stop-Process -Id $mobileProcess.Id -Force -ErrorAction SilentlyContinue }
    exit 1
}

Write-Host "✅ Backend (Static): https://ripply-unconcentrated-lindy.ngrok-free.dev" -ForegroundColor Green
Write-Host "✅ Mobile (Dynamic): $mobileUrl" -ForegroundColor Green

# 3. Start Expo
Write-Host "Starting Expo..." -ForegroundColor Cyan
$env:EXPO_PACKAGER_PROXY_URL = $mobileUrl
Set-Location -Path "mobile"
npx.cmd expo start --clear

# Cleanup
if ($backendProcess) { Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue }
if ($mobileProcess) { Stop-Process -Id $mobileProcess.Id -Force -ErrorAction SilentlyContinue }
if ($serverProcess) { Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue }
