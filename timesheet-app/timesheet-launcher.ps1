$appPath = "C:\Users\User\Dropbox\work\CC_Projects\timesheet\timesheet-app"

# Check if server is already running
$running = $false
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing
    $running = $true
} catch {}

if (-not $running) {
    Start-Process -FilePath "cmd" -ArgumentList "/k npm run start" -WorkingDirectory $appPath -WindowStyle Minimized
    # Wait for server to be ready
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 2
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing
            break
        } catch {}
    }
}

Start-Process "http://localhost:3000"
