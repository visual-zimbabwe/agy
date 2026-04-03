$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$stdoutLog = Join-Path $runtimeLogDir "agy.localxpose.stdout.log"
$stderrLog = Join-Path $runtimeLogDir "agy.localxpose.stderr.log"
$pidFile = Join-Path $runtimeLogDir "agy.localxpose.pid"
$urlFile = Join-Path $runtimeLogDir "agy.localxpose.url.txt"
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
if ($existing) {
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 2
}

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
    return
}

if ($stderr) {
    Write-Output $stderr.Trim()
}

throw "LocalXpose did not reach a running state. See $stderrLog"
