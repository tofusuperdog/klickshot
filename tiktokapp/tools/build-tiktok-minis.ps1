$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$HiddenRoot = Join-Path $Root ".tiktok-build-disabled"
$ApiDir = Join-Path $Root "app\api"
$AppCatchAllDir = Join-Path $Root "app\app\[...slug]"
$DynamicRouteDirs = @(
  @{ Source = $ApiDir; Hidden = (Join-Path $HiddenRoot "api") },
  @{ Source = $AppCatchAllDir; Hidden = (Join-Path $HiddenRoot "app-slug") },
  @{ Source = (Join-Path $Root "app\watch\[id]"); Hidden = (Join-Path $HiddenRoot "watch-id") },
  @{ Source = (Join-Path $Root "app\category\[id]"); Hidden = (Join-Path $HiddenRoot "category-id") },
  @{ Source = (Join-Path $Root "app\genre\[id]"); Hidden = (Join-Path $HiddenRoot "genre-id") }
)

if (Test-Path -LiteralPath $HiddenRoot) {
  Remove-Item -LiteralPath $HiddenRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $HiddenRoot | Out-Null

try {
  foreach ($Route in $DynamicRouteDirs) {
    if (Test-Path -LiteralPath $Route.Source) {
      Move-Item -LiteralPath $Route.Source -Destination $Route.Hidden
    }
  }

  $env:TIKTOK_MINIS_BUILD = "1"
  if (-not $env:NEXT_PUBLIC_MINCHAP_API_BASE_URL) {
    try {
      $Tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2
      $NgrokUrl = $Tunnels.tunnels |
        Where-Object { $_.proto -eq "https" } |
        Select-Object -First 1 -ExpandProperty public_url

      if ($NgrokUrl) {
        $env:NEXT_PUBLIC_MINCHAP_API_BASE_URL = $NgrokUrl
      }
    } catch {
      $env:NEXT_PUBLIC_MINCHAP_API_BASE_URL = "https://api.minchapseries.com"
    }
  }

  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) {
    throw "next build failed with exit code $LASTEXITCODE"
  }

  $OutDir = Join-Path $Root "out"
  $ClientKey = "mnve2ugyyu44qay5"
  $ApiBase = $env:NEXT_PUBLIC_MINCHAP_API_BASE_URL
  $InitScript = @"
<script src="https://connect.tiktok-minis.com/drama/sdk.js"></script><script>
window.__MINCHAP_TIKTOK_CLIENT_KEY__ = "$ClientKey";
window.__MINCHAP_API_BASE_URL__ = "$ApiBase";
window.__MINCHAP_TIKTOK_SDK_READY__ = false;
if (window.TTMinis && window.__MINCHAP_TIKTOK_CLIENT_KEY__) {
  try {
    window.TTMinis.init({ clientKey: "$ClientKey" });
    window.__MINCHAP_TIKTOK_SDK_READY__ = true;
  } catch (error) {
    window.__MINCHAP_TIKTOK_INIT_ERROR__ = error && (error.message || String(error));
  }
}
</script>
"@

  Get-ChildItem -LiteralPath $OutDir -Recurse -Filter "*.html" | ForEach-Object {
    $Html = Get-Content -LiteralPath $_.FullName -Raw
    $Html = $Html -replace '<script src="https://connect\.tiktok-minis\.com/drama/sdk\.js"></script>', ''
    $Html = $Html -replace '<head>', "<head>$InitScript"
    [System.IO.File]::WriteAllText(
      $_.FullName,
      $Html,
      [System.Text.UTF8Encoding]::new($false)
    )
  }

  & minis.cmd build
  if ($LASTEXITCODE -ne 0) {
    throw "minis build failed with exit code $LASTEXITCODE"
  }
}
finally {
  Remove-Item Env:\TIKTOK_MINIS_BUILD -ErrorAction SilentlyContinue

  foreach ($Route in $DynamicRouteDirs) {
    if ((Test-Path -LiteralPath $Route.Hidden) -and -not (Test-Path -LiteralPath $Route.Source)) {
      Move-Item -LiteralPath $Route.Hidden -Destination $Route.Source
    }
  }

  if (Test-Path -LiteralPath $HiddenRoot) {
    Remove-Item -LiteralPath $HiddenRoot -Recurse -Force
  }
}
