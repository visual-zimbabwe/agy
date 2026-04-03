param(
    [switch]$NoMonitor,
    [switch]$ForceRestart
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$stdoutLog = Join-Path $runtimeLogDir "agy.localxpose.stdout.log"
$stderrLog = Join-Path $runtimeLogDir "agy.localxpose.stderr.log"
$pidFile = Join-Path $runtimeLogDir "agy.localxpose.pid"
$urlFile = Join-Path $runtimeLogDir "agy.localxpose.url.txt"
$monitorPidFile = Join-Path $runtimeLogDir "agy.localxpose.monitor.pid"
$stateJsonFile = Join-Path $runtimeLogDir "agy.localxpose.state.json"
$stateHtmlFile = Join-Path $runtimeLogDir "agy.localxpose.state.html"
$token = $env:LOCALXPOSE_ACCESS_TOKEN

if (-not $token) {
    $token = [Environment]::GetEnvironmentVariable("LOCALXPOSE_ACCESS_TOKEN", "User")
}

if (-not $token) {
    $token = [Environment]::GetEnvironmentVariable("LOCALXPOSE_ACCESS_TOKEN", "Machine")
}

$loclx = Join-Path $env:APPDATA "npm\node_modules\loclx\bin\loclx.exe"
if (-not (Test-Path $loclx)) {
    $packagePath = Get-ChildItem `
        -Path (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages") `
        -Recurse `
        -Filter "loclx.exe" `
        -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
    if ($packagePath) {
        $loclx = $packagePath
    }
}

if (-not (Test-Path $loclx)) {
    throw "LocalXpose CLI not found. Install it with: npm install -g loclx"
}

if (-not $token) {
    throw "Set LOCALXPOSE_ACCESS_TOKEN in your user environment before starting the agy tunnel."
}

New-Item -ItemType Directory -Force -Path $runtimeLogDir | Out-Null

$existing = Get-Process loclx -ErrorAction SilentlyContinue
if ($existing -and $ForceRestart) {
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 2
}

if ($existing -and -not $ForceRestart) {
    $existingUrl = if (Test-Path $urlFile) { (Get-Content $urlFile -Raw).Trim() } else { "" }
    if ($existingUrl) {
        Write-Output "LocalXpose already running: $existingUrl"
    } else {
        Write-Output "LocalXpose already running."
    }
} else {
    Remove-Item $stdoutLog, $stderrLog, $pidFile, $urlFile -Force -ErrorAction SilentlyContinue

    $env:ACCESS_TOKEN = $token
    $process = Start-Process `
        -FilePath $loclx `
        -ArgumentList @("tunnel", "http", "--to", "localhost:3000", "--region", "us", "--https-redirect", "--rate-limit", "50") `
        -PassThru `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog

    $process.Id | Set-Content -Path $pidFile
    Start-Sleep -Seconds 6

    $stderr = if (Test-Path $stderrLog) { Get-Content $stderrLog -Raw } else { "" }
    $hostMatch = [regex]::Match($stderr, '(?<host>[a-z0-9-]+\.loclx\.io)\s+=>\s+\[running\]')

    if (-not $process.HasExited -and $hostMatch.Success) {
        $url = "https://$($hostMatch.Groups['host'].Value)"
        $url | Set-Content -Path $urlFile
        Write-Output "LocalXpose running: $url"
        Write-Output "Remote browsers only need the agy tunnel because Supabase is proxied through /supabase."
    } else {
        if ($stderr) {
            Write-Output $stderr.Trim()
        }

        throw "LocalXpose did not reach a running state. See $stderrLog"
    }
}

$currentUrl = if (Test-Path $urlFile) { (Get-Content $urlFile -Raw).Trim() } else { "" }
$updatedAt = (Get-Date).ToString("o")
$state = [ordered]@{
    status = if ($currentUrl) { "running" } else { "starting" }
    url = $currentUrl
    updatedAt = $updatedAt
    monitor = if (Test-Path $monitorPidFile) { "enabled" } else { "starting" }
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
  <p>Status: $($state.status)</p>
  <p>URL: <a href="$currentUrl">$currentUrl</a></p>
  <p>Updated: $updatedAt</p>
</body>
</html>
"@ | Set-Content -Path $stateHtmlFile

if (-not $NoMonitor) {
    $monitorScript = Join-Path $PSScriptRoot "watch-agy-localxpose.ps1"
    $monitorRunning = $false
    if (Test-Path $monitorPidFile) {
        $monitorPid = (Get-Content $monitorPidFile -Raw).Trim()
        if ($monitorPid) {
            $monitorRunning = $null -ne (Get-Process -Id $monitorPid -ErrorAction SilentlyContinue)
        }
    }

    if (-not $monitorRunning -and (Test-Path $monitorScript)) {
        $monitor = Start-Process `
            -FilePath "powershell.exe" `
            -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $monitorScript) `
            -PassThru `
            -WindowStyle Hidden
        $monitor.Id | Set-Content -Path $monitorPidFile
        Write-Output "LocalXpose monitor started."
    }
}
