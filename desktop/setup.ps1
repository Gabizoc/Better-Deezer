<#
.SYNOPSIS
  setup.ps1: adds Better Deezer to the Deezer desktop app (Windows 10/11, no admin rights).

.DESCRIPTION
  Normally started by install.ps1 (the ASCII bootstrap used by
  "irm .../install.ps1 | iex"). Can be run directly from a release folder or a clone:
    powershell -ExecutionPolicy Bypass -File setup.ps1

  What it does (like Spicetify for Spotify: Deezer itself is patched, there is no other app):
    - copies patch.ps1, uninstall.ps1 and better-deezer.user.js to
      %LOCALAPPDATA%\BetterDeezer (from this folder, a clone's dist\, or the latest GitHub release),
    - finds Deezer.exe and runs patch.ps1, which adds a small hook to Deezer's
      resources\app.asar (Deezer is closed and restarted if it was running),
    - registers patch.ps1 -Quiet at logon (HKCU Run) to re-apply the hook after a Deezer update,
    - registers an uninstaller in Settings > Apps (current user only),
    - removes the shortcuts of the old launcher (versions before 1.1).

.PARAMETER DeezerPath
  Full path to Deezer.exe if it is installed somewhere unusual.
  With "irm | iex", set $env:BD_DEEZER_PATH instead.

.PARAMETER NoLaunch
  Do not start Deezer at the end.
#>
[CmdletBinding()]
param(
  [string]$DeezerPath = $env:BD_DEEZER_PATH,
  [switch]$NoLaunch
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$Repo = 'Gabizoc/Better-Deezer'

$Dest = Join-Path $env:LOCALAPPDATA 'BetterDeezer'
$Files = @('patch.ps1', 'uninstall.ps1', 'better-deezer.user.js')
$French = (Get-UICulture).TwoLetterISOLanguageName -eq 'fr'
$PowerShellExe = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'

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

Write-Host ''
Write-Host '  Better Deezer' -ForegroundColor White
Write-Host ('  ' + (T 'Installation dans l''application Deezer (Windows)' 'Install into the Deezer desktop app (Windows)')) -ForegroundColor DarkGray
Write-Host ''

# 1. Deezer
if (-not $DeezerPath) { $DeezerPath = Find-Deezer }
if (-not $DeezerPath -or -not (Test-Path $DeezerPath)) {
  Write-Warning (T 'Deezer.exe introuvable. Installez Deezer depuis https://www.deezer.com/desktop ou indiquez son chemin.' 'Deezer.exe not found. Install Deezer from https://www.deezer.com/desktop or give its path.')
  $DeezerPath = (Read-Host (T 'Chemin complet de Deezer.exe (Entrée pour annuler)' 'Full path to Deezer.exe (Enter to cancel)')).Trim('"', ' ')
  if (-not $DeezerPath -or -not (Test-Path $DeezerPath)) { throw (T 'Installation annulée : Deezer.exe introuvable.' 'Install cancelled: Deezer.exe not found.') }
}
Step ((T 'Deezer trouvé : ' 'Deezer found: ') + $DeezerPath)

# 2. Files: next to this script (release zip), a clone's dist\ (after npm run build), or the latest release
$null = New-Item -ItemType Directory -Force -Path $Dest
$here = $null
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'patch.ps1'))) { $here = $PSScriptRoot }
foreach ($f in $Files) {
  $target = Join-Path $Dest $f
  if ($here -and (Test-Path (Join-Path $here $f))) {
    Copy-Item -Force (Join-Path $here $f) $target
  } elseif ($here -and $f -eq 'better-deezer.user.js' -and (Test-Path (Join-Path $here "..\dist\$f"))) {
    Copy-Item -Force (Join-Path $here "..\dist\$f") $target
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

# 3. Old launcher (before 1.1): stop it, remove its shortcuts and files.
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe' OR Name = 'pwsh.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and $_.CommandLine -like '*BetterDeezer*launcher.ps1*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
foreach ($s in @(
    (Join-Path ([Environment]::GetFolderPath('Programs')) 'Better Deezer.lnk'),
    (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Better Deezer.lnk'),
    (Join-Path $Dest 'launcher.ps1'), (Join-Path $Dest 'launcher.log'), (Join-Path $Dest 'launcher.log.old'))) {
  if (Test-Path $s) { Remove-Item -Force $s }
}

# 4. Patch Deezer (closes and restarts it if it was running).
$patch = Join-Path $Dest 'patch.ps1'
try {
  & $patch -DeezerPath $DeezerPath
} catch {
  if ("$_" -match 'denied|refus') {
    throw (T "Impossible de modifier Deezer : accès refusé. Si Deezer est installé dans Program Files, relancez cette installation en administrateur." "Cannot modify Deezer: access denied. If Deezer is installed in Program Files, run this install as administrator.")
  }
  throw
}
Step (T 'Deezer modifié : Better Deezer est intégré à l''application' 'Deezer patched: Better Deezer is now part of the app')

# 5. Re-apply after Deezer updates (an update replaces app.asar): quietly at each logon.
$run = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$null = New-ItemProperty -Force -Path $run -Name 'BetterDeezer' -PropertyType String -Value ('"{0}" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "{1}" -Quiet' -f $PowerShellExe, $patch)
Step (T 'Réapplication automatique après les mises à jour de Deezer (à l''ouverture de session)' 'Re-applied automatically after Deezer updates (at sign-in)')

# 6. Settings > Apps entry (per user, no admin)
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
Write-Host ('  ' + (T "Better Deezer $version est installé. Ouvrez Deezer comme d'habitude." "Better Deezer $version is installed. Open Deezer as usual.")) -ForegroundColor Green
Write-Host ''

if (-not $NoLaunch -and @(Get-Process -Name 'Deezer' -ErrorAction SilentlyContinue).Count -eq 0) {
  Start-Process -FilePath $DeezerPath -WorkingDirectory (Split-Path -Parent $DeezerPath)
}
