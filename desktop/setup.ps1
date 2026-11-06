<#
.SYNOPSIS
  setup.ps1: installs Better Deezer for the Deezer desktop app (Windows 10/11, no admin rights).

.DESCRIPTION
  Normally started by install.ps1 (the ASCII bootstrap used by
  "irm .../install.ps1 | iex"). Can be run directly from a release folder:
    powershell -ExecutionPolicy Bypass -File setup.ps1

  What it does:
    - copies launcher.ps1, uninstall.ps1 and better-deezer.user.js to
      %LOCALAPPDATA%\BetterDeezer (from this folder, or the latest GitHub release),
    - finds Deezer.exe (%LOCALAPPDATA%\Programs\deezer-desktop, then Program Files),
    - creates "Better Deezer" shortcuts in the Start menu and on the desktop,
    - registers an uninstaller in Settings > Apps (current user only).
  Deezer itself is not modified.

.PARAMETER DeezerPath
  Full path to Deezer.exe if it is installed somewhere unusual.
  With "irm | iex", set $env:BD_DEEZER_PATH instead.

.PARAMETER NoDesktopShortcut
  Only create the Start menu shortcut.

.PARAMETER NoLaunch
  Do not start Better Deezer at the end.
#>
[CmdletBinding()]
param(
  [string]$DeezerPath = $env:BD_DEEZER_PATH,
  [switch]$NoDesktopShortcut,
  [switch]$NoLaunch
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$Repo = 'Gabizoc/Better-Deezer'

$Dest = Join-Path $env:LOCALAPPDATA 'BetterDeezer'
$Files = @('launcher.ps1', 'uninstall.ps1', 'better-deezer.user.js')
$French = (Get-UICulture).TwoLetterISOLanguageName -eq 'fr'

function T {
  param([string]$Fr, [string]$En)
  if ($French) { return $Fr } else { return $En }
}

function Step {
  param([string]$Message)
  Write-Host "  > $Message" -ForegroundColor Magenta
}

function Find-Deezer {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\deezer-desktop\Deezer.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Deezer\Deezer.exe'),
    (Join-Path $env:ProgramFiles 'Deezer\Deezer.exe')
  )
  if (${env:ProgramFiles(x86)}) { $candidates += (Join-Path ${env:ProgramFiles(x86)} 'Deezer\Deezer.exe') }
  foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
  $keys = @(
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
  )
  foreach ($k in $keys) {
    $entries = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue |
      Where-Object { $_.PSObject.Properties['DisplayName'] -and $_.DisplayName -like 'Deezer*' }
    foreach ($e in $entries) {
      if ($e.PSObject.Properties['InstallLocation'] -and $e.InstallLocation) {
        $exe = Join-Path $e.InstallLocation 'Deezer.exe'
        if (Test-Path $exe) { return $exe }
      }
    }
  }
  return $null
}

function New-Shortcut {
  param([string]$Path, [string]$Launcher, [string]$Icon)
  $shell = New-Object -ComObject WScript.Shell
  $lnk = $shell.CreateShortcut($Path)
  $lnk.TargetPath = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
  $lnk.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "{0}"' -f $Launcher
  $lnk.WorkingDirectory = Split-Path -Parent $Launcher
  $lnk.IconLocation = "$Icon,0"
  $lnk.Description = 'Deezer with Better Deezer'
  $lnk.WindowStyle = 7 # minimized: no console flash
  $lnk.Save()
}

Write-Host ''
Write-Host '  Better Deezer' -ForegroundColor White
Write-Host ('  ' + (T 'Installation pour l''application Deezer (Windows)' 'Install for the Deezer desktop app (Windows)')) -ForegroundColor DarkGray
Write-Host ''

# 1. Deezer
if (-not $DeezerPath) { $DeezerPath = Find-Deezer }
if (-not $DeezerPath -or -not (Test-Path $DeezerPath)) {
  Write-Warning (T 'Deezer.exe introuvable. Installez Deezer depuis https://www.deezer.com/desktop ou indiquez son chemin.' 'Deezer.exe not found. Install Deezer from https://www.deezer.com/desktop or give its path.')
  $DeezerPath = (Read-Host (T 'Chemin complet de Deezer.exe (Entrée pour annuler)' 'Full path to Deezer.exe (Enter to cancel)')).Trim('"', ' ')
  if (-not $DeezerPath -or -not (Test-Path $DeezerPath)) { throw (T 'Installation annulée : Deezer.exe introuvable.' 'Install cancelled: Deezer.exe not found.') }
}
Step ((T 'Deezer trouvé : ' 'Deezer found: ') + $DeezerPath)

# 2. Files: next to this script (release zip) or from the latest release
$null = New-Item -ItemType Directory -Force -Path $Dest
$here = $null
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'launcher.ps1'))) { $here = $PSScriptRoot }
foreach ($f in $Files) {
  $target = Join-Path $Dest $f
  if ($here -and (Test-Path (Join-Path $here $f))) {
    Copy-Item -Force (Join-Path $here $f) $target
  } elseif ($here -and $f -eq 'better-deezer.user.js' -and (Test-Path (Join-Path $here "..\dist\$f"))) {
    Copy-Item -Force (Join-Path $here "..\dist\$f") $target # running from a clone after npm run build
  } else {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $url = "https://github.com/$Repo/releases/latest/download/$f"
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $target
  }
  Unblock-File -Path $target -ErrorAction SilentlyContinue
}
Step ((T 'Fichiers installés dans ' 'Files installed in ') + $Dest)

$version = 'unknown'
$header = Get-Content -TotalCount 6 -Encoding UTF8 (Join-Path $Dest 'better-deezer.user.js')
foreach ($line in $header) { if ($line -match '@version\s+(\S+)') { $version = $Matches[1] } }

@{ DeezerPath = $DeezerPath; Version = $version; InstalledAt = (Get-Date).ToString('s') } |
  ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $Dest 'config.json')

# 3. Shortcuts
$launcher = Join-Path $Dest 'launcher.ps1'
$startMenu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Better Deezer.lnk'
New-Shortcut -Path $startMenu -Launcher $launcher -Icon $DeezerPath
Step (T 'Raccourci ajouté au menu Démarrer' 'Start menu shortcut added')
if (-not $NoDesktopShortcut) {
  New-Shortcut -Path (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Better Deezer.lnk') -Launcher $launcher -Icon $DeezerPath
  Step (T 'Raccourci ajouté au bureau' 'Desktop shortcut added')
}

# 4. Settings > Apps entry (per user, no admin)
$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\BetterDeezer'
$null = New-Item -Force -Path $key
$uninstall = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "{0}"' -f (Join-Path $Dest 'uninstall.ps1')
$props = @{
  DisplayName = 'Better Deezer'
  DisplayVersion = $version
  Publisher = 'Better Deezer contributors'
  DisplayIcon = "$DeezerPath,0"
  InstallLocation = $Dest
  UninstallString = $uninstall
  QuietUninstallString = "$uninstall -Quiet"
  URLInfoAbout = "https://github.com/$Repo"
}
foreach ($name in $props.Keys) { $null = New-ItemProperty -Force -Path $key -Name $name -Value $props[$name] -PropertyType String }
$null = New-ItemProperty -Force -Path $key -Name 'NoModify' -Value 1 -PropertyType DWord
$null = New-ItemProperty -Force -Path $key -Name 'NoRepair' -Value 1 -PropertyType DWord
Step (T 'Désinstallation disponible dans Paramètres > Applications' 'Uninstall available in Settings > Apps')

Write-Host ''
Write-Host ('  ' + (T "Better Deezer $version est installé. Lancez « Better Deezer » depuis le menu Démarrer." ('Better Deezer {0} is installed. Start "Better Deezer" from the Start menu.' -f $version))) -ForegroundColor Green
Write-Host ('  ' + (T 'Le raccourci Deezer d''origine lance toujours Deezer sans modification.' 'The original Deezer shortcut still starts plain Deezer.')) -ForegroundColor DarkGray
Write-Host ''

if (-not $NoLaunch) {
  Start-Process -FilePath (Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe') -WindowStyle Hidden -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', "`"$launcher`"")
}
