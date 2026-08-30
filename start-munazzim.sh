#!/usr/bin/env bash

set -u
# Load private Munazzim settings
if [ -f "$HOME/.munazzim-env" ]; then
  source "$HOME/.munazzim-env"
fi

PROJECT_DIR="$HOME/Desktop/munazzim-ai"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"

echo "======================================"
echo "Starting Munazzim services..."
echo "======================================"

echo "[1/5] Checking Qwen lab endpoint..."
if curl -s --connect-timeout 3 http://192.168.0.5/v1/models >/dev/null 2>&1; then
  echo "Qwen lab endpoint reachable."
else
  echo "WARNING: Qwen lab endpoint is not reachable."
  echo "Munazzim will continue with the Ollama fallback."
fi

echo "[2/5] Checking Ollama..."
if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "Ollama already running."
else
  echo "Starting Ollama..."
  nohup ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
  sleep 2
fi

echo "[3/5] Checking Firebase Emulator..."
if ss -ltn 2>/dev/null | grep -q ':8081 ' || ss -ltn 2>/dev/null | grep -q ':9099 '; then
  echo "Firebase Emulator already running."
else
  echo "Starting Firebase Emulator..."

  nohup firebase emulators:start \
    --import=./emulator-data \
    --export-on-exit=./emulator-data \
    > "$LOG_DIR/firebase.log" 2>&1 &

  echo $! > "$PROJECT_DIR/.firebase.pid"

  sleep 5
fi

echo "[4/5] Checking Next.js..."
if curl -s -I http://127.0.0.1:3000 >/dev/null 2>&1; then
  echo "Next.js already running."
else
  echo "Starting Next.js..."

  nohup npm run dev \
    > "$LOG_DIR/next.log" 2>&1 &

  echo $! > "$PROJECT_DIR/.next.pid"

  sleep 4
fi

echo "[5/5] Checking Ngrok..."
if curl -s http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
  echo "Ngrok already running."
else
  if [ -z "${NGROK_BASIC_AUTH:-}" ]; then
    echo ""
    echo "WARNING: NGROK_BASIC_AUTH is not set."
    echo "Ngrok will NOT start."
    echo ""
    echo "Set it first like this:"
    echo 'export NGROK_BASIC_AUTH="munazzim:YOUR_PASSWORD"'
  else
    echo "Starting Ngrok..."

    nohup ngrok http 3000 \
      --basic-auth="$NGROK_BASIC_AUTH" \
      > "$LOG_DIR/ngrok.log" 2>&1 &

    echo $! > "$PROJECT_DIR/.ngrok.pid"

    sleep 3
  fi
fi

echo ""
echo "======================================"
echo "Munazzim status"
echo "======================================"

if curl -s --connect-timeout 3 http://192.168.0.5/v1/models >/dev/null 2>&1; then
  echo "Qwen:      RUNNING"
else
  echo "Qwen:      NOT REACHABLE"
fi

if curl -s -I http://127.0.0.1:3000 >/dev/null 2>&1; then
  echo "Next.js:   RUNNING"
else
  echo "Next.js:   NOT RUNNING"
fi

if ss -ltn 2>/dev/null | grep -q ':8081 '; then
  echo "Firestore: RUNNING"
else
  echo "Firestore: NOT RUNNING"
fi

if ss -ltn 2>/dev/null | grep -q ':9099 '; then
  echo "Auth:      RUNNING"
else
  echo "Auth:      NOT RUNNING"
fi

if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "Ollama:    RUNNING"
else
  echo "Ollama:    NOT RUNNING"
fi

if curl -s http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
  echo "Ngrok:     RUNNING"

  NGROK_URL=$(
    curl -s http://127.0.0.1:4040/api/tunnels |
    grep -o 'https://[^"]*ngrok-free.app\|https://[^"]*ngrok-free.dev' |
    head -1
  )

  if [ -n "$NGROK_URL" ]; then
    echo "Remote:    $NGROK_URL"
  fi
else
  echo "Ngrok:     NOT RUNNING"
fi

echo ""
echo "Local:"
echo "http://localhost:3000"

echo ""
echo "Logs:"
echo "$LOG_DIR"

echo ""
echo "Use ./stop-munazzim.sh to stop safely."
