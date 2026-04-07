$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$pidFile = Join-Path $runtimeLogDir "agy.pid"
$localToNetPidFile = Join-Path $runtimeLogDir "agy.localtonet-app.pid"
$escapedRepoRoot = [regex]::Escape($repoRoot)

$processes = Get-CimInstance Win32_Process |
    Where-Object {
        $_.Name -eq "node.exe" -and
        $_.CommandLine -match $escapedRepoRoot -and
        ($_.CommandLine -match "next\W+start" -or $_.CommandLine -match "start-server\.js")
    }

foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

Remove-Item $pidFile, $localToNetPidFile -Force -ErrorAction SilentlyContinue

$tunnelScript = Join-Path $PSScriptRoot "stop-agy-localxpose.ps1"
if (Test-Path $tunnelScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $tunnelScript
}

$localToNetScript = Join-Path $PSScriptRoot "stop-agy-localtonet.ps1"
if (Test-Path $localToNetScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $localToNetScript
}

Write-Output "agy stopped."
