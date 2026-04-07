$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeLogDir = Join-Path $repoRoot ".logs\runtime"
$pidFile = Join-Path $runtimeLogDir "agy.localtonet.pid"
$urlFile = Join-Path $runtimeLogDir "agy.localtonet.url.txt"
$publishedMarkdownFile = "F:\CloudData\NextcloudData\ncadmin\files\Documents\agy.md"
$mojoEnvFile = "D:\Dev\labs\mojo-release-tracker\.env"
$mojoCookieFile = "D:\Dev\labs\mojo-release-tracker\localtonet-cookies.txt"
$localToNetExe = Get-ChildItem -Path (Get-AppxPackage | Where-Object { $_.Name -eq "7826LocalTech.Localtonet" } | Select-Object -ExpandProperty InstallLocation) -Recurse -Filter "localtonet.exe" | Select-Object -First 1 -ExpandProperty FullName

function Get-LocalToNetToken {
    if ($env:LOCALTONET_TOKEN -and $env:LOCALTONET_TOKEN.Trim().Length -eq 33) {
        return $env:LOCALTONET_TOKEN
    }

    if (Test-Path $mojoEnvFile) {
        $tokenLine = Select-String -Path $mojoEnvFile -Pattern '^LOCALTONET_TOKEN=' | Select-Object -First 1
        if ($tokenLine) {
            $token = ($tokenLine.Line -replace '^LOCALTONET_TOKEN=', '').Trim()
            if ($token.Length -eq 33) {
                return $token
            }
        }
    }

    if ($env:LOCALTONET_TOKEN) {
        return $env:LOCALTONET_TOKEN.Trim()
    }

    throw "LOCALTONET_TOKEN was not found in the environment or $mojoEnvFile."
}

function Get-LocalToNetUrl {
    if ($env:LOCALTONET_PUBLIC_URL) {
        return $env:LOCALTONET_PUBLIC_URL.Trim()
    }

    if (Test-Path $mojoCookieFile) {
        $cookieLine = Select-String -Path $mojoCookieFile -Pattern 'localto\.net' | Select-Object -First 1
        if ($cookieLine) {
            $publicHost = ($cookieLine.Line -split '\s+')[0] -replace '^#HttpOnly_', ''
            if ($publicHost) {
                return "https://$publicHost"
            }
        }
    }

    return ""
}

if (-not $localToNetExe) {
    throw "LocaltoNet is not installed."
}

New-Item -ItemType Directory -Force -Path $runtimeLogDir | Out-Null

Get-Process -Name "localtonet" -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

$token = Get-LocalToNetToken
$process = Start-Process `
    -FilePath $localToNetExe `
    -ArgumentList @("--authtoken", $token) `
    -WorkingDirectory $repoRoot `
    -PassThru `
    -WindowStyle Hidden

$process.Id | Set-Content -Path $pidFile
Start-Sleep -Seconds 6

if ($process.HasExited) {
    throw "LocaltoNet exited unexpectedly."
}

$url = Get-LocalToNetUrl
if ($url) {
    $url | Set-Content -Path $urlFile
    "public link:<$url>" | Set-Content -Path $publishedMarkdownFile
    Write-Output "LocaltoNet running: $url"
} else {
    Write-Output "LocaltoNet running, but no public URL could be inferred automatically."
}
