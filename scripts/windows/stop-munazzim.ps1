#requires -Version 5.1
# Windows shutdown orchestrator for Munazzim AI Time Manager.
# Invoked by STOP-MUNAZZIM.bat. Only stops Next.js and the Firebase
# emulators started for this project. Ollama is left running intentionally
# since it may be a shared local service used by other apps.

$ErrorActionPreference = 'Stop'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$LogDir = Join-Path $ProjectDir 'logs'
$PidDir = Join-Path $ProjectDir '.munazzim-run'

$NextPort = 3001
try {
  $pkg = Get-Content -Raw (Join-Path $ProjectDir 'package.json') | ConvertFrom-Json
  if ($pkg.scripts.dev -match '-p\s+(\d+)') { $NextPort = [int]$Matches[1] }
} catch {}

$AuthPort = 9099
$FirestorePort = 8081

function Test-PortListening([int]$Port) {
  $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return [bool]$conns
}

function Wait-PortClosed([int]$Port, [int]$MaxSeconds) {
  $deadline = (Get-Date).AddSeconds($MaxSeconds)
  while ((Get-Date) -lt $deadline) {
    if (-not (Test-PortListening -Port $Port)) { return $true }
    Start-Sleep -Seconds 1
  }
  return -not (Test-PortListening -Port $Port)
}

function Stop-ProcessTree([int]$ProcessId) {
  try { Get-CimInstance Win32_Process -Filter "ParentProcessId=$ProcessId" -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-ProcessTree -ProcessId $_.ProcessId } } catch {}
  try { Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue } catch {}
}

function Close-WindowGracefully([string]$Title) {
  $procs = Get-Process cmd -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq $Title }
  foreach ($p in $procs) {
    [void]$p.CloseMainWindow()
  }
  return [bool]$procs
}

function Stop-PidFromFile([string]$FileName) {
  $path = Join-Path $PidDir $FileName
  if (Test-Path $path) {
    $storedPid = (Get-Content $path -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($storedPid) { Stop-ProcessTree -ProcessId ([int]$storedPid) }
    Remove-Item $path -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "============================================================"
Write-Host "  Munazzim AI - Windows Shutdown"
Write-Host "============================================================"
Write-Host ""

# ============================================================
# [1/2] Stop Next.js
# ============================================================
Write-Host "[1/2] Stopping Next.js..."
$nextStatus = 'NOT RUNNING'
if (-not (Test-PortListening -Port $NextPort)) {
  Write-Host "  Next.js was not running."
} else {
  Write-Host "  Requesting graceful shutdown..."
  Close-WindowGracefully -Title 'Munazzim-NextJS' | Out-Null

  if (-not (Wait-PortClosed -Port $NextPort -MaxSeconds 10)) {
    Write-Host "  Still running - forcing stop..."
    Stop-PidFromFile -FileName 'next.pid'
    Get-NetTCPConnection -LocalPort $NextPort -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object { Stop-ProcessTree -ProcessId $_.OwningProcess }
    Wait-PortClosed -Port $NextPort -MaxSeconds 5 | Out-Null
  }

  if (Test-PortListening -Port $NextPort) {
    Write-Host "  WARNING: Next.js port $NextPort is still in use."
    $nextStatus = 'STILL RUNNING'
  } else {
    Write-Host "  Next.js stopped."
    $nextStatus = 'STOPPED'
  }
}
Remove-Item (Join-Path $PidDir 'next.pid') -Force -ErrorAction SilentlyContinue
Write-Host ""

# ============================================================
# [2/2] Stop Firebase Emulators (graceful, preserves emulator-data)
# ============================================================
Write-Host "[2/2] Stopping Firebase Emulators..."
$firebaseStatus = 'NOT RUNNING'
$authUp = Test-PortListening -Port $AuthPort
$firestoreUp = Test-PortListening -Port $FirestorePort

if (-not $authUp -and -not $firestoreUp) {
  Write-Host "  Firebase Emulators were not running."
} else {
  Write-Host "  Requesting graceful shutdown (preserves emulator-data on export)..."
  $closed = Close-WindowGracefully -Title 'Munazzim-Firebase-Emulators'

  if (-not (Wait-PortClosed -Port $FirestorePort -MaxSeconds 25)) {
    Write-Host "  WARNING: Firebase Emulator did not exit gracefully in time."
    Write-Host "  Data export may be incomplete. Check logs\firebase.log"
    Write-Host "  Forcing stop..."
    Stop-PidFromFile -FileName 'firebase.pid'
    Get-NetTCPConnection -LocalPort $FirestorePort -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object { Stop-ProcessTree -ProcessId $_.OwningProcess }
    Get-NetTCPConnection -LocalPort $AuthPort -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object { Stop-ProcessTree -ProcessId $_.OwningProcess }
    $firebaseStatus = 'FORCE STOPPED'
  } else {
    $logFile = Join-Path $LogDir 'firebase.log'
    if ((Test-Path $logFile) -and (Select-String -Path $logFile -Pattern 'Export complete' -Quiet)) {
      Write-Host "  Firebase stopped and emulator data exported successfully."
    } else {
      Write-Host "  Firebase stopped (export status unconfirmed - see firebase.log)."
    }
    $firebaseStatus = 'STOPPED'
  }
}
Remove-Item (Join-Path $PidDir 'firebase.pid') -Force -ErrorAction SilentlyContinue
Write-Host ""

# ============================================================
# Ollama status (not stopped intentionally)
# ============================================================
try {
  Invoke-WebRequest -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null
  Write-Host "Ollama: RUNNING (left running intentionally)"
} catch {
  Write-Host "Ollama: NOT RUNNING"
}
Write-Host ""

Write-Host "============================================================"
Write-Host "  Munazzim AI - Shutdown Summary"
Write-Host "============================================================"
Write-Host "  Next.js:             $nextStatus"
Write-Host "  Firebase Emulators:  $firebaseStatus"
Write-Host "============================================================"
