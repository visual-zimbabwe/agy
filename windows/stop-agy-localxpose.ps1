$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$pidFile = Join-Path $runtimeLogDir "agy.localxpose.pid"
$urlFile = Join-Path $runtimeLogDir "agy.localxpose.url.txt"

$process = Get-Process loclx -ErrorAction SilentlyContinue | Select-Object -First 1
if ($process) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
}

Remove-Item $pidFile, $urlFile -Force -ErrorAction SilentlyContinue

Write-Output "agy LocalXpose tunnel stopped."
