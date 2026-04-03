$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$pidFile = Join-Path $runtimeLogDir "agy.pid"
$publicUrlFile = Join-Path $runtimeLogDir "agy.localxpose.url.txt"
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
