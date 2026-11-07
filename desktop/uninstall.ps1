#Requires -Version 5.1
<#
.SYNOPSIS
  Removes Better Deezer (desktop) and puts Deezer back to its original behaviour.

.DESCRIPTION
  Takes the hook out of Deezer's app.asar (patch.ps1 -Remove), removes the logon
  entry, the Settings > Apps entry and %LOCALAPPDATA%\BetterDeezer. Started from
  Settings > Apps, or:
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
  $answer = Read-Host (T 'Désinstaller Better Deezer ? Deezer sera fermé s''il est ouvert. (O/n)' 'Uninstall Better Deezer? Deezer will be closed if it is open. (Y/n)')
  if ($answer -match '^(n|no|non)$') { return }
}

# 1. Unpatch Deezer. Even if this fails (Deezer uninstalled, updated...), keep cleaning up:
#    without the skin file next to it, a leftover hook does nothing.
$patch = Join-Path $Dest 'patch.ps1'
if (Test-Path $patch) {
  try { & $patch -Remove } catch { Write-Warning ((T 'Deezer n''a pas pu être restauré : ' 'Could not restore Deezer: ') + $_) }
}

# 2. Logon entry, Settings > Apps entry, shortcuts and process of the old launcher (before 1.1).
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'BetterDeezer' -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\BetterDeezer' -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe' OR Name = 'pwsh.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and $_.CommandLine -like '*BetterDeezer*launcher.ps1*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
foreach ($s in @(
    (Join-Path ([Environment]::GetFolderPath('Programs')) 'Better Deezer.lnk'),
    (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Better Deezer.lnk'))) {
  if (Test-Path $s) { Remove-Item -Force $s }
}

# 3. Files. This script may live in the folder: delete it from a detached cmd once we exit.
if (Test-Path $Dest) {
  $inside = $PSCommandPath -and $PSCommandPath.StartsWith($Dest, [StringComparison]::OrdinalIgnoreCase)
  if ($inside) {
    Start-Process -FilePath 'cmd.exe' -WindowStyle Hidden -ArgumentList @('/c', "timeout /t 2 /nobreak >nul & rmdir /s /q `"$Dest`"")
  } else {
    Remove-Item -Recurse -Force $Dest
  }
}

Write-Host (T 'Better Deezer est désinstallé. Deezer est revenu à l''origine (vos réglages Better Deezer restent dans Deezer jusqu''à ce que vous vidiez son cache).' 'Better Deezer is uninstalled. Deezer is back to normal (Better Deezer settings stay in Deezer''s storage until you clear its cache).') -ForegroundColor Green
if (-not $Quiet) { Start-Sleep -Seconds 3 }
