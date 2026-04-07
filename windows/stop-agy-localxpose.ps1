$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$pidFile = Join-Path $runtimeLogDir "agy.localxpose.pid"
$monitorPidFile = Join-Path $runtimeLogDir "agy.localxpose.monitor.pid"
$urlFile = Join-Path $runtimeLogDir "agy.localxpose.url.txt"
$stateJsonFile = Join-Path $runtimeLogDir "agy.localxpose.state.json"
$stateHtmlFile = Join-Path $runtimeLogDir "agy.localxpose.state.html"

$process = Get-Process loclx -ErrorAction SilentlyContinue | Select-Object -First 1
if ($process) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
}

if (Test-Path $monitorPidFile) {
    $monitorPid = (Get-Content $monitorPidFile -Raw).Trim()
    if ($monitorPid) {
        Stop-Process -Id $monitorPid -Force -ErrorAction SilentlyContinue
    }
}

Remove-Item $pidFile, $monitorPidFile, $urlFile, $stateJsonFile, $stateHtmlFile -Force -ErrorAction SilentlyContinue

Write-Output "agy LocalXpose tunnel stopped."
