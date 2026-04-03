param(
    [switch]$WithTunnel,
    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$stdoutLog = Join-Path $runtimeLogDir "agy.stdout.log"
$stderrLog = Join-Path $runtimeLogDir "agy.stderr.log"
$pidFile = Join-Path $runtimeLogDir "agy.pid"
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source

New-Item -ItemType Directory -Force -Path $runtimeLogDir | Out-Null

$supabasePlatformRoot = if ($env:SUPABASE_PLATFORM_ROOT) {
    $env:SUPABASE_PLATFORM_ROOT
} elseif (Test-Path "E:\supabase-platform") {
    "E:\supabase-platform"
} else {
    $null
}

if ($supabasePlatformRoot) {
    $supabaseStartScript = Join-Path $supabasePlatformRoot "windows\start-supabase.ps1"
    if (Test-Path $supabaseStartScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $supabaseStartScript
    }
}

if ($Rebuild -or -not (Test-Path (Join-Path $repoRoot ".next\BUILD_ID"))) {
    & $npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "agy build failed."
    }
}

$escapedRepoRoot = [regex]::Escape($repoRoot)
$existing = Get-CimInstance Win32_Process |
    Where-Object {
        $_.Name -eq "node.exe" -and
        $_.CommandLine -match $escapedRepoRoot -and
        ($_.CommandLine -match "next\W+start" -or $_.CommandLine -match "start-server\.js")
    }

foreach ($process in $existing) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

Remove-Item $stdoutLog, $stderrLog, $pidFile -Force -ErrorAction SilentlyContinue

$started = Start-Process `
    -FilePath $npm `
    -ArgumentList @("run", "start", "--", "--hostname", "127.0.0.1", "--port", "3000") `
    -WorkingDirectory $repoRoot `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog

$started.Id | Set-Content -Path $pidFile

$healthy = $false
for ($attempt = 0; $attempt -lt 45; $attempt += 1) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/" -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            $healthy = $true
            break
        }
    } catch {
        if ($started.HasExited) {
            break
        }
    }
}

if (-not $healthy) {
    $stderr = if (Test-Path $stderrLog) { Get-Content $stderrLog -Raw } else { "" }
    if ($stderr) {
        Write-Output $stderr.Trim()
    }
    throw "agy did not become ready on http://localhost:3000."
}

Write-Output "agy running: http://localhost:3000"
Write-Output "Logs: $stdoutLog"

if ($WithTunnel) {
    $tunnelScript = Join-Path $PSScriptRoot "start-agy-localxpose.ps1"
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $tunnelScript
}
