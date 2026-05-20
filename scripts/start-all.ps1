# Master script for Spotify-Party (Golden Solution + Tunnel)
$ErrorActionPreference = "Stop"

Write-Host "--- Starting Spotify-Party (Golden Solution) ---" -ForegroundColor Cyan

# 1. Clean old logs
Remove-Item "ngrok_backend.log", "cf_mobile.log" -ErrorAction SilentlyContinue

# 2. Start Backend Tunnel (Read from .env)
Write-Host "Detecting Ngrok domain from .env..." -ForegroundColor Yellow
$envPath = "backend/.env"
$staticDomain = ""
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    foreach ($line in $envContent) {
        if ($line -match "BACKEND_URL=https://([a-z0-9-]+)\.ngrok-free\.dev") {
            $staticDomain = $matches[1]
            break
        }
    }
}

if (![string]::IsNullOrWhiteSpace($staticDomain)) {
    Write-Host "Starting Static Backend Tunnel (ngrok: $staticDomain)..." -ForegroundColor Yellow
    $backendTunnelProcess = Start-Process "npx.cmd" -ArgumentList "-y", "ngrok", "http", "--domain=$staticDomain.ngrok-free.dev", "3000" -PassThru -NoNewWindow
} else {
    Write-Host "No static domain found in .env, starting dynamic tunnel..." -ForegroundColor Yellow
    $backendTunnelProcess = Start-Process "npx.cmd" -ArgumentList "-y", "ngrok", "http", "3000" -PassThru -NoNewWindow
}

Start-Sleep -Seconds 2
# Verification si le tunnel a reussi a s'ouvrir
$checkTunnel = curl.exe -s http://localhost:4040/api/tunnels
if ($null -eq $checkTunnel -or $checkTunnel -notmatch "public_url") {
    Write-Host "Le tunnel n'a pas pu demarrer avec le domaine configure. Tentative en mode dynamique..." -ForegroundColor Yellow
    if ($backendTunnelProcess) { Stop-Process -Id $backendTunnelProcess.Id -Force -ErrorAction SilentlyContinue }
    $backendTunnelProcess = Start-Process "npx.cmd" -ArgumentList "-y", "ngrok", "http", "3000" -PassThru -NoNewWindow
}

# 2.5 Start Actual Backend Server (Node.js)
Write-Host "Starting Backend Server (Node.js)..." -ForegroundColor Yellow
$serverProcess = Start-Process "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "backend" -PassThru -NoNewWindow -RedirectStandardOutput "backend_server.log"

# --- DETECTION URL BACKEND ---
Start-Sleep -Seconds 5
$backendUrl = "Could not detect"
try {
    $tunnels = (curl.exe -s http://localhost:4040/api/tunnels | ConvertFrom-Json)
    if ($tunnels.tunnels.Length -gt 0) {
        $backendUrl = $tunnels.tunnels[0].public_url
    }
} catch {
    Write-Host "Warning: Could not contact Ngrok API on localhost:4040" -ForegroundColor Gray
}

# Choose color based on match with expected static domain
$backendColor = "Yellow"
if (![string]::IsNullOrWhiteSpace($staticDomain) -and $backendUrl -match $staticDomain) {
    $backendColor = "Green"
}

Write-Host " "
Write-Host "--- NETWORKING STATUS ---" -ForegroundColor Cyan
Write-Host "  Backend URL: $backendUrl" -ForegroundColor $backendColor
Write-Host "-------------------------" -ForegroundColor Cyan
Write-Host " "

# 3. Start Mobile Tunnel (Cloudflare) and Expo
Write-Host "Starting Mobile App Tunnel (Cloudflare on Port 8081)..." -ForegroundColor Cyan
Remove-Item "cloudflare_err.log" -ErrorAction SilentlyContinue
Remove-Item "cloudflare_out.log" -ErrorAction SilentlyContinue

$cloudflareProcess = Start-Process "npx.cmd" -ArgumentList "-y", "cloudflared", "tunnel", "--url", "http://localhost:8081" -PassThru -NoNewWindow -RedirectStandardError "cloudflare_err.log" -RedirectStandardOutput "cloudflare_out.log"

Write-Host "Waiting for Cloudflare tunnel URL..." -ForegroundColor Yellow
$cfTunnelUrl = ""
$startTime = Get-Date

while ([string]::IsNullOrWhiteSpace($cfTunnelUrl) -and ((Get-Date) - $startTime).TotalSeconds -lt 25) {
    if (Test-Path "cloudflare_err.log") { $content = Get-Content "cloudflare_err.log" -Raw }
    if (Test-Path "cloudflare_out.log") { $content += Get-Content "cloudflare_out.log" -Raw }
    
    if ($content -match "https://[a-z0-9-]+\.trycloudflare\.com") {
        $cfTunnelUrl = $matches[0]
    }
    Start-Sleep -Seconds 1
}

if ([string]::IsNullOrWhiteSpace($cfTunnelUrl)) {
    Write-Host "Attention: Impossible de recup l'URL Cloudflare. Lancement en local sans proxy proxy." -ForegroundColor Red
} else {
    Write-Host "Mobile Tunnel Active: $cfTunnelUrl" -ForegroundColor Green
    $env:EXPO_PACKAGER_PROXY_URL = $cfTunnelUrl
}

Write-Host "Starting Expo..." -ForegroundColor Cyan
Set-Location -Path mobile
npx.cmd expo start

# Cleanup
if ($backendTunnelProcess) { Stop-Process -Id $backendTunnelProcess.Id -Force -ErrorAction SilentlyContinue }
if ($serverProcess) { Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue }
if ($cloudflareProcess) { Stop-Process -Id $cloudflareProcess.Id -Force -ErrorAction SilentlyContinue }
