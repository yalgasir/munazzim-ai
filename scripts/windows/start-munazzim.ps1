#requires -Version 5.1
# Windows startup orchestrator for Munazzim AI Time Manager.
# Invoked by START-MUNAZZIM.bat. Safe to re-run (skips already-running services).

$ErrorActionPreference = 'Stop'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$LogDir = Join-Path $ProjectDir 'logs'
$PidDir = Join-Path $ProjectDir '.munazzim-run'
$DataDir = Join-Path $ProjectDir 'emulator-data'

foreach ($dir in @($LogDir, $PidDir, $DataDir)) {
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

# ---- read the Next.js dev port from package.json (falls back to 3001) ----
$NextPort = 3001
try {
  $pkg = Get-Content -Raw (Join-Path $ProjectDir 'package.json') | ConvertFrom-Json
  if ($pkg.scripts.dev -match '-p\s+(\d+)') { $NextPort = [int]$Matches[1] }
} catch {
  Write-Host "WARNING: Could not read package.json, defaulting Next.js port to 3001."
}

$OllamaModel = 'llama3.2:3b'
$OllamaUrl = 'http://127.0.0.1:11434'
$AuthPort = 9099
$FirestorePort = 8081

function Test-HttpUp([string]$Url, [int]$TimeoutSec = 2) {
  try {
    $resp = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
    return $true
  } catch [System.Net.WebException] {
    if ($_.Exception.Response) { return $true } # server answered with an HTTP error status - still "up"
    return $false
  } catch {
    return $false
  }
}

function Wait-HttpUp([string]$Url, [int]$MaxSeconds) {
  $deadline = (Get-Date).AddSeconds($MaxSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-HttpUp -Url $Url -TimeoutSec 2) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Test-PortListening([int]$Port) {
  $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return [bool]$conns
}

function Wait-PortListening([int]$Port, [int]$MaxSeconds) {
  $deadline = (Get-Date).AddSeconds($MaxSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortListening -Port $Port) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

Write-Host "============================================================"
Write-Host "  Munazzim AI - Windows Startup"
Write-Host "  Project: $ProjectDir"
Write-Host "  Next.js port: $NextPort"
Write-Host "  Logs: $LogDir"
Write-Host "============================================================"
Write-Host ""

$status = [ordered]@{
  Ollama    = 'NOT VERIFIED'
  Auth      = 'NOT VERIFIED'
  Firestore = 'NOT VERIFIED'
  NextJs    = 'NOT VERIFIED'
}

# ============================================================
# [1/3] Ollama
# ============================================================
Write-Host "[1/3] Checking Ollama..."
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaCmd) {
  Write-Host "  Ollama executable not found in PATH."
  $status.Ollama = 'NOT VERIFIED'
} else {
  if (Test-HttpUp -Url "$OllamaUrl/api/tags" -TimeoutSec 2) {
    Write-Host "  Ollama already running."
    $status.Ollama = 'PASS'
  } else {
    Write-Host "  Starting Ollama..."
    Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden `
      -RedirectStandardOutput (Join-Path $LogDir 'ollama.log') `
      -RedirectStandardError (Join-Path $LogDir 'ollama.err.log') | Out-Null
    if (Wait-HttpUp -Url "$OllamaUrl/api/tags" -MaxSeconds 20) {
      Write-Host "  Ollama: PASS"
      $status.Ollama = 'PASS'
    } else {
      Write-Host "  Ollama: FAIL - check logs\ollama.log"
      $status.Ollama = 'FAIL'
    }
  }

  if ($status.Ollama -eq 'PASS') {
    try {
      $tags = Invoke-RestMethod -Uri "$OllamaUrl/api/tags" -TimeoutSec 5
      $hasModel = $tags.models | Where-Object { $_.name -eq $OllamaModel }
      if ($hasModel) {
        Write-Host "  Model $OllamaModel`: present."
      } else {
        Write-Host "  WARNING: Model $OllamaModel not found. Pull it with: ollama pull $OllamaModel"
      }
    } catch {
      Write-Host "  WARNING: Could not verify installed Ollama models."
    }
  }
}
Write-Host ""

# ============================================================
# [2/3] Firebase Emulators (Auth + Firestore)
# ============================================================
Write-Host "[2/3] Checking Firebase Emulators..."
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
  Write-Host "  FAIL: firebase CLI not found in PATH. Install with: npm install -g firebase-tools"
  $status.Auth = 'FAIL'
  $status.Firestore = 'FAIL'
} else {
  $authUp = Test-PortListening -Port $AuthPort
  $firestoreUp = Test-PortListening -Port $FirestorePort

  if ($authUp -and $firestoreUp) {
    Write-Host "  Firebase Emulators already running."
    $status.Auth = 'PASS'
    $status.Firestore = 'PASS'
  } else {
    Write-Host "  Starting Firebase Emulators (auth, firestore)..."
    $logFile = Join-Path $LogDir 'firebase.log'
    $cmdLine = "/c title Munazzim-Firebase-Emulators && firebase emulators:start --only auth,firestore --import=""$DataDir"" --export-on-exit=""$DataDir"" > ""$logFile"" 2>&1"
    $p = Start-Process -FilePath 'cmd.exe' -ArgumentList $cmdLine -WindowStyle Minimized -PassThru
    $p.Id | Out-File -Encoding ascii (Join-Path $PidDir 'firebase.pid')

    $authReady = Wait-PortListening -Port $AuthPort -MaxSeconds 45
    $firestoreReady = Wait-PortListening -Port $FirestorePort -MaxSeconds 45

    $status.Auth = if ($authReady) { 'PASS' } else { 'FAIL' }
    $status.Firestore = if ($firestoreReady) { 'PASS' } else { 'FAIL' }

    Write-Host "  Auth Emulator: $($status.Auth)"
    Write-Host "  Firestore Emulator: $($status.Firestore)"
    if ($status.Auth -ne 'PASS' -or $status.Firestore -ne 'PASS') {
      Write-Host "  See logs\firebase.log for details."
    }
  }
}
Write-Host ""

# ============================================================
# [3/3] Next.js
# ============================================================
Write-Host "[3/3] Checking Next.js on port $NextPort..."
if (Test-PortListening -Port $NextPort) {
  Write-Host "  Next.js already running."
  $status.NextJs = 'PASS'
} else {
  Write-Host "  Starting Next.js..."
  $logFile = Join-Path $LogDir 'next.log'
  $cmdLine = "/c title Munazzim-NextJS && npm run dev > ""$logFile"" 2>&1"
  $p = Start-Process -FilePath 'cmd.exe' -ArgumentList $cmdLine -WorkingDirectory $ProjectDir -WindowStyle Minimized -PassThru
  $p.Id | Out-File -Encoding ascii (Join-Path $PidDir 'next.pid')

  if (Wait-PortListening -Port $NextPort -MaxSeconds 60) {
    Write-Host "  Next.js: PASS"
    $status.NextJs = 'PASS'
  } else {
    Write-Host "  Next.js: FAIL - check logs\next.log"
    $status.NextJs = 'FAIL'
  }
}
Write-Host ""

# ============================================================
# Summary
# ============================================================
Write-Host "============================================================"
Write-Host "  Munazzim AI - Startup Summary"
Write-Host "============================================================"
Write-Host "  Ollama:                $($status.Ollama)"
Write-Host "  Auth Emulator:         $($status.Auth)"
Write-Host "  Firestore Emulator:    $($status.Firestore)"
Write-Host "  Next.js (:$NextPort):        $($status.NextJs)"
Write-Host "============================================================"
Write-Host "  Logs directory: $LogDir"
Write-Host "============================================================"

if ($status.NextJs -eq 'PASS') {
  Write-Host "Opening application in default browser..."
  Start-Process "http://localhost:$NextPort"
} else {
  Write-Host "Next.js is not reachable - browser will not be opened."
}

Write-Host ""
Write-Host "Use STOP-MUNAZZIM.bat to stop Munazzim services safely."
