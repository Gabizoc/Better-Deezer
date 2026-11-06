#Requires -Version 5.1
<#
.SYNOPSIS
  Starts the Deezer desktop app with Better Deezer.

.DESCRIPTION
  Deezer's desktop app is Electron loading https://www.deezer.com: same DOM as
  the website. This launcher:
    1. closes a running Deezer (its single-instance lock would ignore our flags),
    2. starts Deezer.exe with --remote-debugging-port on a random free port,
       which Chromium binds to 127.0.0.1 only,
    3. connects to every deezer.com page over the Chrome DevTools Protocol
       (System.Net.WebSockets.ClientWebSocket, no dependency) and injects
       better-deezer.user.js now (Runtime.evaluate) and on every new document
       (Page.enable + Page.addScriptToEvaluateOnNewDocument),
    4. keeps the connections open while Deezer runs (scripts added by a CDP
       session are dropped when it disconnects) and re-injects within 2 s if a
       page ever comes back without Better Deezer.
  No Deezer file is modified, so Deezer's automatic updates keep working.

  Security: the debugging port listens on 127.0.0.1 only, on a random port, for
  as long as Deezer runs. Any program already running on this PC as you could
  connect to it during that time (it could anyway read your Deezer data).

.PARAMETER DeezerPath
  Full path to Deezer.exe. Default: config.json next to this script, then the
  usual install folders.

.PARAMETER Payload
  Path to better-deezer.user.js. Default: next to this script.

.PARAMETER KeepRunning
  Do not close an already running Deezer; just exit with a message.
#>
[CmdletBinding()]
param(
  [string]$DeezerPath,
  [string]$Payload,
  [switch]$KeepRunning
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataDir = Join-Path $env:LOCALAPPDATA 'BetterDeezer'
$null = New-Item -ItemType Directory -Force -Path $DataDir
$LogFile = Join-Path $DataDir 'launcher.log'

function Write-Log {
  param([string]$Message)
  $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
  Write-Verbose $line
}

# Keep the log small.
if ((Test-Path $LogFile) -and (Get-Item $LogFile).Length -gt 512KB) {
  Move-Item -Force $LogFile ($LogFile + '.old')
}

function Find-Deezer {
  $config = Join-Path $Root 'config.json'
  if (Test-Path $config) {
    try {
      $saved = (Get-Content -Raw -Encoding UTF8 $config | ConvertFrom-Json).DeezerPath
      if ($saved -and (Test-Path $saved)) { return $saved }
    } catch { Write-Log "config.json unreadable: $_" }
  }
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\deezer-desktop\Deezer.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Deezer\Deezer.exe'),
    (Join-Path $env:ProgramFiles 'Deezer\Deezer.exe')
  )
  if (${env:ProgramFiles(x86)}) { $candidates += (Join-Path ${env:ProgramFiles(x86)} 'Deezer\Deezer.exe') }
  foreach ($c in $candidates) { if (Test-Path $c) { return $c } }

  # Last resort: the uninstall entries written by Deezer's installer.
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

function Get-FreePort {
  $listener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback, 0)
  $listener.Start()
  $port = $listener.LocalEndpoint.Port
  $listener.Stop()
  return $port
}

# ---------- Chrome DevTools Protocol over a WebSocket ----------
$script:CdpId = 0

function Connect-Cdp {
  param([string]$Url)
  $ws = New-Object System.Net.WebSockets.ClientWebSocket
  $ws.Options.KeepAliveInterval = [TimeSpan]::FromSeconds(20)
  $ws.ConnectAsync([Uri]$Url, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  return $ws
}

function Receive-CdpMessage {
  param($Socket)
  # No timeout on purpose: cancelling a ClientWebSocket receive aborts the socket.
  $buffer = New-Object byte[] 65536
  $stream = New-Object System.IO.MemoryStream
  try {
    do {
      $segment = New-Object 'System.ArraySegment[byte]' -ArgumentList @(, $buffer)
      $result = $Socket.ReceiveAsync($segment, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
      if ($result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) { return $null }
      $stream.Write($buffer, 0, $result.Count)
    } while (-not $result.EndOfMessage)
    return [Text.Encoding]::UTF8.GetString($stream.ToArray())
  } finally {
    $stream.Dispose()
  }
}

# $ParamsJson is raw JSON: the payload is serialized once, not on every call.
function Invoke-Cdp {
  param($Socket, [string]$Method, [string]$ParamsJson = '{}')
  $script:CdpId++
  $id = $script:CdpId
  $message = '{"id":' + $id + ',"method":"' + $Method + '","params":' + $ParamsJson + '}'
  $bytes = [Text.Encoding]::UTF8.GetBytes($message)
  $segment = New-Object 'System.ArraySegment[byte]' -ArgumentList @(, $bytes)
  $Socket.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  # Read until our answer. Page events received since the last call are skipped here,
  # which also drains them (the main loop calls Test-Injected every 2 s).
  for ($i = 0; $i -lt 5000; $i++) {
    $raw = Receive-CdpMessage $Socket
    if ($null -eq $raw) { throw "CDP socket closed during $Method" }
    $reply = $raw | ConvertFrom-Json
    if ($reply.PSObject.Properties['id'] -and $reply.id -eq $id) {
      if ($reply.PSObject.Properties['error']) { throw "CDP $Method failed: $($reply.error.message)" }
      return $reply.result
    }
  }
  throw "CDP ${Method}: no answer"
}

function Test-Injected {
  param($Socket)
  $r = Invoke-Cdp $Socket 'Runtime.evaluate' '{"expression":"Boolean(window.__betterDeezer)","returnByValue":true}'
  return [bool]$r.result.value
}

# ---------- main ----------
try {
  if (-not $DeezerPath) { $DeezerPath = Find-Deezer }
  if (-not $DeezerPath -or -not (Test-Path $DeezerPath)) {
    throw 'Deezer.exe not found. Install Deezer, or run: launcher.ps1 -DeezerPath "C:\path\to\Deezer.exe"'
  }
  if (-not $Payload) { $Payload = Join-Path $Root 'better-deezer.user.js' }
  if (-not (Test-Path $Payload)) { throw "Payload not found: $Payload" }

  $source = Get-Content -Raw -Encoding UTF8 $Payload
  # One JSON string literal, reused for every injection.
  $sourceJson = ConvertTo-Json -InputObject $source -Compress
  Write-Log "start: $DeezerPath, payload $([math]::Round($source.Length / 1KB)) KB"

  $running = @(Get-Process -Name 'Deezer' -ErrorAction SilentlyContinue)
  if ($running.Count -gt 0) {
    if ($KeepRunning) { throw 'Deezer is already running. Close it (also from the tray icon) and start Better Deezer again.' }
    Write-Log "closing the running Deezer ($($running.Count) processes)"
    foreach ($p in $running) { try { $null = $p.CloseMainWindow() } catch { Write-Log "CloseMainWindow: $_" } }
    $deadline = (Get-Date).AddSeconds(5)
    while ((Get-Date) -lt $deadline -and @(Get-Process -Name 'Deezer' -ErrorAction SilentlyContinue).Count -gt 0) {
      Start-Sleep -Milliseconds 250
    }
    Get-Process -Name 'Deezer' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
  }

  $port = Get-FreePort
  $origin = "http://127.0.0.1:$port"
  $arguments = @("--remote-debugging-port=$port", "--remote-allow-origins=$origin")
  $null = Start-Process -FilePath $DeezerPath -ArgumentList $arguments -WorkingDirectory (Split-Path -Parent $DeezerPath) -PassThru
  Write-Log "Deezer started, DevTools on 127.0.0.1:$port"

  $endpoint = "$origin/json/list"
  $sockets = @{}
  $failures = 0
  $started = Get-Date

  while ($true) {
    $targets = $null
    try {
      $targets = @(Invoke-RestMethod -Uri $endpoint -TimeoutSec 3)
      $failures = 0
    } catch {
      $failures++
      $alive = @(Get-Process -Name 'Deezer' -ErrorAction SilentlyContinue).Count -gt 0
      # Give Deezer 60 s to open its port; afterwards, stop once it is gone.
      if ((-not $alive -and ((Get-Date) - $started).TotalSeconds -gt 10) -or ($failures -gt 30 -and ((Get-Date) - $started).TotalSeconds -gt 60)) {
        Write-Log 'Deezer closed, launcher exits'
        break
      }
      Start-Sleep -Seconds 2
      continue
    }

    foreach ($t in $targets) {
      if ($t.type -ne 'page' -or $t.url -notmatch '^https://([a-z0-9-]+\.)*deezer\.com/') { continue }
      $ws = $null
      if ($sockets.ContainsKey($t.id)) { $ws = $sockets[$t.id] }
      try {
        if ($null -eq $ws -or $ws.State -ne [System.Net.WebSockets.WebSocketState]::Open) {
          $ws = Connect-Cdp $t.webSocketDebuggerUrl
          $sockets[$t.id] = $ws
          # Page.enable is required: without it the script is accepted but never runs on reload
          # (verified by test/cdp-inject.mjs against Chromium).
          $null = Invoke-Cdp $ws 'Page.enable'
          $null = Invoke-Cdp $ws 'Page.addScriptToEvaluateOnNewDocument' ('{"source":' + $sourceJson + '}')
          Write-Log "attached to $($t.id) $($t.url)"
        }
        if (-not (Test-Injected $ws)) {
          $null = Invoke-Cdp $ws 'Runtime.evaluate' ('{"expression":' + $sourceJson + ',"allowUnsafeEvalBlockedByCSP":true}')
          Write-Log "injected into $($t.url)"
        }
      } catch {
        Write-Log "target $($t.id): $_"
        if ($ws) { try { $ws.Dispose() } catch { Write-Verbose 'dispose failed' } }
        $sockets.Remove($t.id)
      }
    }

    # Forget closed targets.
    $ids = @($targets | ForEach-Object { $_.id })
    foreach ($id in @($sockets.Keys)) {
      if ($ids -notcontains $id) {
        try { $sockets[$id].Dispose() } catch { Write-Verbose 'dispose failed' }
        $sockets.Remove($id)
      }
    }
    Start-Sleep -Seconds 2
  }
} catch {
  Write-Log "error: $_"
  # Visible feedback even when started hidden from the shortcut.
  try {
    Add-Type -AssemblyName PresentationFramework
    $null = [System.Windows.MessageBox]::Show("Better Deezer: $_`n`nLog: $LogFile", 'Better Deezer', 'OK', 'Warning')
  } catch {
    Write-Error $_
  }
  exit 1
}
