$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$pidFile = Join-Path $runtimeLogDir "agy.localtonet.pid"
$urlFile = Join-Path $runtimeLogDir "agy.localtonet.url.txt"

Get-Process -Name "localtonet" -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Remove-Item $pidFile, $urlFile -Force -ErrorAction SilentlyContinue

Write-Output "agy LocaltoNet tunnel stopped."
