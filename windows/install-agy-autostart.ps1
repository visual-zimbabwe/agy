$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$startupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
$shortcutPath = Join-Path $startupDir "start-agy.cmd"
$cmdContent = "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"$repoRoot\\windows\\start-agy-stack.ps1`" -WithTunnel`r`n"

New-Item -ItemType Directory -Force -Path $startupDir | Out-Null
Set-Content -Path $shortcutPath -Value $cmdContent -NoNewline

Write-Output "Autostart installed: $shortcutPath"
