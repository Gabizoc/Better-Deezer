#Requires -Version 5.1
<#
.SYNOPSIS
  Removes Better Deezer (desktop). Deezer itself is not touched.

.DESCRIPTION
  Stops the launcher, removes the shortcuts, the Settings > Apps entry and
  %LOCALAPPDATA%\BetterDeezer. Started from Settings > Apps, or:
    powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\BetterDeezer\uninstall.ps1"

.PARAMETER Quiet
  No questions, no pause at the end.
#>
[CmdletBinding()]
param([switch]$Quiet)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Continue'

$Dest = Join-Path $env:LOCALAPPDATA 'BetterDeezer'
$French = (Get-UICulture).TwoLetterISOLanguageName -eq 'fr'
function T {
  param([string]$Fr, [string]$En)
  if ($French) { return $Fr } else { return $En }
}

if (-not $Quiet) {
  $answer = Read-Host (T 'Désinstaller Better Deezer ? (O/n)' 'Uninstall Better Deezer? (Y/n)')
  if ($answer -match '^(n|no|non)$') { return }
}

# 1. Stop the launcher (a hidden powershell.exe running launcher.ps1 from our folder).
$launchers = Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe' OR Name = 'pwsh.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and $_.CommandLine -like '*BetterDeezer*launcher.ps1*' }
foreach ($p in $launchers) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }

# 2. Shortcuts and Settings > Apps entry.
$shortcuts = @(
  (Join-Path ([Environment]::GetFolderPath('Programs')) 'Better Deezer.lnk'),
  (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Better Deezer.lnk')
)
foreach ($s in $shortcuts) { if (Test-Path $s) { Remove-Item -Force $s } }
Remove-Item -Recurse -Force 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\BetterDeezer' -ErrorAction SilentlyContinue

# 3. Files. This script may live in the folder: delete it from a detached cmd once we exit.
if (Test-Path $Dest) {
  $inside = $PSCommandPath -and $PSCommandPath.StartsWith($Dest, [StringComparison]::OrdinalIgnoreCase)
  if ($inside) {
    Start-Process -FilePath 'cmd.exe' -WindowStyle Hidden -ArgumentList @('/c', "timeout /t 2 /nobreak >nul & rmdir /s /q `"$Dest`"")
  } else {
    Remove-Item -Recurse -Force $Dest
  }
}

Write-Host (T 'Better Deezer est désinstallé. Deezer fonctionne normalement (vos réglages Better Deezer restent dans Deezer jusqu''à ce que vous vidiez son cache).' 'Better Deezer is uninstalled. Deezer works as usual (Better Deezer settings stay in Deezer''s storage until you clear its cache).') -ForegroundColor Green
if (-not $Quiet) { Start-Sleep -Seconds 3 }
