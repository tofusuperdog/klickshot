$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$OutDir = Join-Path $Root "out"
$ReleaseDir = Join-Path $Root "release"
$ZipPath = Join-Path $ReleaseDir "tiktok-code-version.zip"

if (-not (Test-Path -LiteralPath $OutDir)) {
  throw "Missing TikTok build output: $OutDir"
}

New-Item -ItemType Directory -Force -Path $ReleaseDir | Out-Null

if (Test-Path -LiteralPath $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}

$Forbidden = Get-ChildItem -LiteralPath $OutDir -Recurse -Force | Where-Object {
  $_.Name -like ".env*" -or
  $_.FullName -match "\\node_modules(\\|$)" -or
  $_.FullName -match "\\.git(\\|$)"
}

if ($Forbidden.Count -gt 0) {
  $Forbidden | Select-Object FullName
  throw "Refusing to package forbidden files."
}

$Items = Get-ChildItem -LiteralPath $OutDir -Force
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$CompressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
$OutUri = [System.Uri]::new(($OutDir.TrimEnd("\") + "\"))
$ZipArchive = [System.IO.Compression.ZipFile]::Open(
  $ZipPath,
  [System.IO.Compression.ZipArchiveMode]::Create
)

try {
  Get-ChildItem -LiteralPath $OutDir -Recurse -Force -File | ForEach-Object {
    if ($_.Length -eq 0) {
      return
    }

    $FileUri = [System.Uri]::new($_.FullName)
    $EntryName = [System.Uri]::UnescapeDataString(
      $OutUri.MakeRelativeUri($FileUri).ToString()
    )
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $ZipArchive,
      $_.FullName,
      $EntryName,
      $CompressionLevel
    ) | Out-Null
  }
}
finally {
  $ZipArchive.Dispose()
}

$Zip = Get-Item -LiteralPath $ZipPath
[PSCustomObject]@{
  Zip = $Zip.FullName
  SizeMB = [Math]::Round($Zip.Length / 1MB, 2)
}
