# Master script for Spotify-Party (Golden Solution: Static Backend + Dynamic App)
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
# Vérification si le tunnel a réussi à s'ouvrir
$checkTunnel = curl.exe -s http://localhost:4040/api/tunnels
if ($null -eq $checkTunnel -or $checkTunnel -notmatch "public_url") {
    Write-Host "⚠️  Le tunnel n'a pas pu démarrer avec le domaine configuré. Tentative en mode dynamique..." -ForegroundColor Yellow
    if ($backendTunnelProcess) { Stop-Process -Id $backendTunnelProcess.Id -Force -ErrorAction SilentlyContinue }
    $backendTunnelProcess = Start-Process "npx.cmd" -ArgumentList "-y", "ngrok", "http", "3000" -PassThru -NoNewWindow
}

# 2.5 Start Actual Backend Server (Node.js)
Write-Host "Starting Backend Server (Node.js)..." -ForegroundColor Yellow
$serverProcess = Start-Process "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "backend" -PassThru -NoNewWindow -RedirectStandardOutput "backend_server.log"

# 3. Start Mobile Tunnel (Dynamic Cloudflare)
Write-Host "Starting Dynamic Mobile Tunnel (Cloudflare)..." -ForegroundColor Yellow
$mobileProcess = Start-Process "npx.cmd" -ArgumentList "-y", "cloudflared", "tunnel", "--url", "http://localhost:8081" -PassThru -NoNewWindow -RedirectStandardError "cf_mobile.log"

Write-Host "Waiting for tunnels to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Detect Actual Backend URL
$backendUrl = "Could not detect"
try {
    $tunnels = (curl.exe -s http://localhost:4040/api/tunnels | ConvertFrom-Json)
    if ($tunnels.tunnels.Length -gt 0) {
        $backendUrl = $tunnels.tunnels[0].public_url
    }
} catch {
    Write-Host "Warning: Could not contact Ngrok API on localhost:4040" -ForegroundColor Gray
}

# Detect Mobile URL
$mobileUrl = ""
if (Test-Path "cf_mobile.log") {
    $content = Get-Content "cf_mobile.log" -Raw
    if ($content -and ($content -match "(https://[a-z0-9-]+\.trycloudflare\.com)")) {
        $mobileUrl = $matches[1]
    }
}

Write-Host "`n--- NETWORKING STATUS ---" -ForegroundColor Cyan
Write-Host "📍 Backend URL: $backendUrl" -ForegroundColor (if ($backendUrl -match "ripply") { "Green" } else { "Yellow" })
Write-Host "📍 Mobile URL : $mobileUrl" -ForegroundColor Green
Write-Host "-------------------------`n" -ForegroundColor Cyan

if ($backendUrl -notmatch "ripply") {
    Write-Host "⚠️  ATTENTION: L'URL backend ne correspond pas au domaine statique." -ForegroundColor Red
    Write-Host "Si tu as une erreur 404, c'est parce que tu n'as pas réservé ce domaine sur ton compte Ngrok." -ForegroundColor Red
}

# 3. Start Expo
Write-Host "Starting Expo..." -ForegroundColor Cyan
$env:EXPO_PACKAGER_PROXY_URL = $mobileUrl
Set-Location -Path "mobile"
npx.cmd -y expo start --clear

# Cleanup
if ($backendTunnelProcess) { Stop-Process -Id $backendTunnelProcess.Id -Force -ErrorAction SilentlyContinue }
if ($mobileProcess) { Stop-Process -Id $mobileProcess.Id -Force -ErrorAction SilentlyContinue }
if ($serverProcess) { Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue }
