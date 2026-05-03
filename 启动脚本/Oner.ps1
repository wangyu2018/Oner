$ErrorActionPreference = "SilentlyContinue"
$onerDir = "D:\AI牛逼\oner"

Write-Host "Starting Oner..."
Write-Host ""

# Start backend
$backend = Start-Process -WindowStyle Hidden -FilePath "cmd" -ArgumentList "/c node server.js" -WorkingDirectory "$onerDir\backend" -PassThru
Write-Host "  [1/3] Backend started"

# Start frontend
$frontend = Start-Process -WindowStyle Hidden -FilePath "cmd" -ArgumentList "/c npx vite" -WorkingDirectory "$onerDir\frontend" -PassThru
Write-Host "  [2/3] Frontend started"

Start-Sleep -Seconds 4

# Start Electron
$env:NODE_ENV = "development"
Write-Host "  [3/3] Desktop launching..."
$electron = Start-Process -FilePath "cmd" -ArgumentList "/c npx electron ." -WorkingDirectory "$onerDir\electron" -PassThru -NoNewWindow

Write-Host ""
Write-Host "Oner is running. Close the app to stop all services."
Write-Host ""

# Wait for Electron to close
$electron.WaitForExit()

# Cleanup: kill processes by port
Write-Host "Shutting down..."
$ports = @(3000, 5173)
foreach ($port in $ports) {
    netstat -ano | findstr ":$port " | ForEach-Object {
        $parts = $_ -split "\s+"
        $pid = $parts[-1]
        if ($pid -match "^\d+$") {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "All services stopped."
Start-Sleep -Seconds 1
