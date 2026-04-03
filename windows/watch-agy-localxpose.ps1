$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$urlFile = Join-Path $runtimeLogDir "agy.localxpose.url.txt"
$pidFile = Join-Path $runtimeLogDir "agy.localxpose.pid"
$monitorPidFile = Join-Path $runtimeLogDir "agy.localxpose.monitor.pid"
$stateJsonFile = Join-Path $runtimeLogDir "agy.localxpose.state.json"
$stateHtmlFile = Join-Path $runtimeLogDir "agy.localxpose.state.html"
$stdoutLog = Join-Path $runtimeLogDir "agy.localxpose.stdout.log"
$stderrLog = Join-Path $runtimeLogDir "agy.localxpose.stderr.log"
$appUrl = "http://localhost:3000"
$startScript = Join-Path $PSScriptRoot "start-agy-localxpose.ps1"

New-Item -ItemType Directory -Force -Path $runtimeLogDir | Out-Null
$PID | Set-Content -Path $monitorPidFile

function Update-State {
    param(
        [string]$Status,
        [string]$Url,
        [string]$Reason = ""
    )

    $updatedAt = (Get-Date).ToString("o")
    $state = [ordered]@{
        status = $Status
        url = $Url
        reason = $Reason
        updatedAt = $updatedAt
        monitor = "enabled"
    }
    $state | ConvertTo-Json | Set-Content -Path $stateJsonFile
@"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="60">
  <title>agy tunnel status</title>
</head>
<body>
  <h1>agy tunnel status</h1>
  <p>Status: $Status</p>
  <p>URL: <a href="$Url">$Url</a></p>
  <p>Reason: $Reason</p>
  <p>Updated: $updatedAt</p>
</body>
</html>
"@ | Set-Content -Path $stateHtmlFile
}

function Test-AppReady {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $appUrl -TimeoutSec 5
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch {
        return $false
    }
}

function Test-TunnelHealthy {
    param(
        [string]$Url
    )

    if (-not $Url) {
        return $false
    }

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 10
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            return $statusCode -ne 404
        }

        return $false
    }
}

function Test-TunnelProcess {
    $tunnelPid = if (Test-Path $pidFile) { (Get-Content $pidFile -Raw).Trim() } else { "" }
    if (-not $tunnelPid) {
        return $false
    }

    return $null -ne (Get-Process -Id $tunnelPid -ErrorAction SilentlyContinue)
}

Update-State -Status "starting" -Url "" -Reason "watchdog boot"

while ($true) {
    if (-not (Test-AppReady)) {
        Update-State -Status "waiting-for-app" -Url "" -Reason "localhost:3000 not ready"
        Start-Sleep -Seconds 10
        continue
    }

    $currentUrl = if (Test-Path $urlFile) { (Get-Content $urlFile -Raw).Trim() } else { "" }
    $tunnelHealthy = Test-TunnelHealthy -Url $currentUrl
    $tunnelProcessHealthy = Test-TunnelProcess

    if ($tunnelHealthy -and $tunnelProcessHealthy) {
        Update-State -Status "running" -Url $currentUrl -Reason "ok"
        Start-Sleep -Seconds 30
        continue
    }

    $reason = if (-not $currentUrl) {
        "missing url"
    } elseif (-not $tunnelProcessHealthy) {
        "tunnel process stopped"
    } else {
        "public url expired or unreachable"
    }

    Update-State -Status "restarting" -Url $currentUrl -Reason $reason

    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $startScript -NoMonitor -ForceRestart | Out-Null
    } catch {
        $stderrTail = if (Test-Path $stderrLog) { (Get-Content $stderrLog -Tail 20) -join "; " } else { "" }
        Update-State -Status "error" -Url $currentUrl -Reason "$reason; $stderrTail"
        Start-Sleep -Seconds 15
        continue
    }

    $newUrl = if (Test-Path $urlFile) { (Get-Content $urlFile -Raw).Trim() } else { "" }
    Update-State -Status "running" -Url $newUrl -Reason "restarted"
    Start-Sleep -Seconds 30
}
