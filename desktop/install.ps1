<#
.SYNOPSIS
  Better Deezer installer bootstrap (Windows 10/11, no admin rights).

.DESCRIPTION
  One line in PowerShell:
    irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex

  This file is plain ASCII on purpose: "irm | iex" may decode it with the wrong
  charset. It downloads the release files to %TEMP%\BetterDeezer-setup (or uses
  the ones next to it in an extracted release zip) and runs setup.ps1 as a real
  file, which does the actual install. See setup.ps1 for what is installed.

  Options for setup.ps1 through environment variables (handy with iex):
    $env:BD_DEEZER_PATH = 'D:\Apps\Deezer\Deezer.exe'   unusual Deezer location
#>
$ErrorActionPreference = 'Stop'
$repo = 'Gabizoc/Better-Deezer'
$files = @('setup.ps1', 'patch.ps1', 'uninstall.ps1', 'better-deezer.user.js')
$here = $null
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'setup.ps1'))) { $here = $PSScriptRoot }

if (-not $here) {
  if ($PSVersionTable.PSVersion.Major -lt 5) { throw 'Better Deezer needs Windows PowerShell 5.1 or later.' }
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  $here = Join-Path $env:TEMP 'BetterDeezer-setup'
  $null = New-Item -ItemType Directory -Force -Path $here
  foreach ($f in $files) {
    Write-Host "  downloading $f"
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/$repo/releases/latest/download/$f" -OutFile (Join-Path $here $f)
  }
}

$argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $here 'setup.ps1'))
$ps = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
& $ps @argList
