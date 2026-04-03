$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$pidFile = Join-Path $runtimeLogDir "agy.pid"
$publicUrlFile = Join-Path $runtimeLogDir "agy.localxpose.url.txt"
$localToNetPidFile = Join-Path $runtimeLogDir "agy.localtonet-app.pid"
$localToNetUrlFile = Join-Path $runtimeLogDir "agy.localtonet.url.txt"
$tunnelStateFile = Join-Path $runtimeLogDir "agy.localxpose.state.json"
$monitorPidFile = Join-Path $runtimeLogDir "agy.localxpose.monitor.pid"
$escapedRepoRoot = [regex]::Escape($repoRoot)

$listeningProcessIds = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess |
    Select-Object -Unique

$process = Get-CimInstance Win32_Process |
    Where-Object {
        $_.ProcessId -in $listeningProcessIds -and
        $_.Name -eq "node.exe" -and
        $_.CommandLine -match $escapedRepoRoot
    } |
    Select-Object -First 1

if ($process) {
    Write-Output "Status: running"
    Write-Output "PID: $($process.ProcessId)"
    Write-Output "Local URL: http://localhost:3000"
} else {
    Write-Output "Status: stopped"
    if (Test-Path $pidFile) {
        Write-Output "PID file exists but process is not running: $pidFile"
    }
}

if (Test-Path $publicUrlFile) {
    $publicUrl = (Get-Content $publicUrlFile -Raw).Trim()
    if ($publicUrl) {
        Write-Output "Public URL: $publicUrl"
    }
}

if (Test-Path $tunnelStateFile) {
    $tunnelState = Get-Content $tunnelStateFile -Raw | ConvertFrom-Json
    Write-Output "Tunnel Status: $($tunnelState.status)"
    if ($tunnelState.reason) {
        Write-Output "Tunnel Reason: $($tunnelState.reason)"
    }
    if ($tunnelState.updatedAt) {
        Write-Output "Tunnel Updated: $($tunnelState.updatedAt)"
    }
}

if (Test-Path $monitorPidFile) {
    $monitorPid = (Get-Content $monitorPidFile -Raw).Trim()
    if ($monitorPid -and (Get-Process -Id $monitorPid -ErrorAction SilentlyContinue)) {
        Write-Output "Tunnel Monitor: running"
        Write-Output "Tunnel Monitor PID: $monitorPid"
    } else {
        Write-Output "Tunnel Monitor: stale pid file"
    }
}

$localToNetProcessIds = (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue).OwningProcess |
    Select-Object -Unique
$localToNetProcess = Get-CimInstance Win32_Process |
    Where-Object {
        $_.ProcessId -in $localToNetProcessIds -and
        $_.Name -eq "node.exe" -and
        $_.CommandLine -match $escapedRepoRoot
    } |
    Select-Object -First 1

if ($localToNetProcess) {
    Write-Output "LocaltoNet Listener PID: $($localToNetProcess.ProcessId)"
    Write-Output "LocaltoNet Target: http://localhost:5000"
} elseif (Test-Path $localToNetPidFile) {
    Write-Output "LocaltoNet listener pid file exists but process is not running: $localToNetPidFile"
}

if (Test-Path $localToNetUrlFile) {
    $localToNetUrl = (Get-Content $localToNetUrlFile -Raw).Trim()
    if ($localToNetUrl) {
        Write-Output "LocaltoNet URL: $localToNetUrl"
    }
}
