param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$OutDir = "docs/baselines/2026-02-11",
  [int]$TimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$resolvedOutDir = if ([System.IO.Path]::IsPathRooted($OutDir)) {
  $OutDir
} else {
  Join-Path $projectRoot $OutDir
}

function Resolve-BrowserPath {
  $candidates = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw "No supported browser found. Install Edge or Chrome."
}

function Wait-ForServer {
  param([string]$Url, [int]$TimeoutSec)

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Seconds 2
      continue
    }
  }

  throw "Timed out waiting for $Url"
}

New-Item -ItemType Directory -Force $resolvedOutDir | Out-Null

$browser = Resolve-BrowserPath
Wait-ForServer -Url "$BaseUrl/" -TimeoutSec $TimeoutSeconds

$targets = @(
  @{ Name = "home-desktop.png"; Url = "$BaseUrl/"; Size = "1440,900" },
  @{ Name = "login-desktop.png"; Url = "$BaseUrl/login"; Size = "1440,900" },
  @{ Name = "signup-desktop.png"; Url = "$BaseUrl/signup"; Size = "1440,900" },
  @{ Name = "wall-desktop.png"; Url = "$BaseUrl/wall?snapshot=baseline"; Size = "1440,900" },
  @{ Name = "home-mobile.png"; Url = "$BaseUrl/"; Size = "390,844" },
  @{ Name = "login-mobile.png"; Url = "$BaseUrl/login"; Size = "390,844" },
  @{ Name = "signup-mobile.png"; Url = "$BaseUrl/signup"; Size = "390,844" },
  @{ Name = "wall-mobile.png"; Url = "$BaseUrl/wall?snapshot=baseline"; Size = "390,844" }
)

foreach ($target in $targets) {
  $outPath = Join-Path $resolvedOutDir $target.Name
  & $browser `
    --headless=new `
    --disable-gpu `
    --hide-scrollbars `
    --no-first-run `
    --no-default-browser-check `
    --screenshot="$outPath" `
    --window-size=$($target.Size) `
    $($target.Url) | Out-Null
}

Write-Host "Captured baseline screenshots in $resolvedOutDir"
