#!/usr/bin/env bash

set -u
# Load private Munazzim settings
if [ -f "$HOME/.munazzim-env" ]; then
  source "$HOME/.munazzim-env"
fi

PROJECT_DIR="$HOME/Desktop/munazzim-ai"
LOG_DIR="$PROJECT_DIR/logs"
NEXT_PORT=3001

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
  nohup setsid ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
  sleep 2
fi

echo "[3/5] Checking Firebase Emulator..."
FIRESTORE_RUNNING=false
AUTH_RUNNING=false

if ss -ltn 2>/dev/null | grep -q ':8081 '; then
  FIRESTORE_RUNNING=true
fi

if ss -ltn 2>/dev/null | grep -q ':9099 '; then
  AUTH_RUNNING=true
fi

if [ "$FIRESTORE_RUNNING" = true ] && [ "$AUTH_RUNNING" = true ]; then
  echo "Firebase Emulator already running."
elif [ "$FIRESTORE_RUNNING" = false ] && [ "$AUTH_RUNNING" = false ]; then
  echo "Starting Firebase Emulator..."

  nohup setsid firebase emulators:start \
    --import=./emulator-data \
    --export-on-exit=./emulator-data \
    > "$LOG_DIR/firebase.log" 2>&1 &

  echo $! > "$PROJECT_DIR/.firebase.pid"

  sleep 5
else
  echo "WARNING: Firebase Emulator is partially running."
  echo "Firestore: $([ "$FIRESTORE_RUNNING" = true ] && echo RUNNING || echo NOT RUNNING)"
  echo "Auth:      $([ "$AUTH_RUNNING" = true ] && echo RUNNING || echo NOT RUNNING)"
  echo "Manual restart recommended."
fi

echo "[4/5] Checking Next.js..."
if curl -s -I "http://127.0.0.1:$NEXT_PORT" >/dev/null 2>&1; then
  echo "Next.js already running."
else
  echo "Starting Next.js..."

  nohup setsid npm run dev \
    > "$LOG_DIR/next.log" 2>&1 &

  echo $! > "$PROJECT_DIR/.next.pid"

  sleep 4
fi

echo "[5/5] Checking Ngrok..."
if curl -s http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
  NGROK_TARGET=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'http://localhost:[0-9]*\|http://127.0.0.1:[0-9]*' | head -1 || true)

  if echo "$NGROK_TARGET" | grep -q ":$NEXT_PORT$"; then
    echo "Ngrok already running for localhost:$NEXT_PORT."
  else
    echo "WARNING: Ngrok is running but is not targeting localhost:$NEXT_PORT."
    echo "Existing Ngrok target: ${NGROK_TARGET:-unknown}"
    echo "Not modifying another running Ngrok tunnel."
  fi
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

    nohup setsid ngrok http "$NEXT_PORT" \
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

if curl -s -I "http://127.0.0.1:$NEXT_PORT" >/dev/null 2>&1; then
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
echo "http://localhost:$NEXT_PORT"

echo ""
echo "Logs:"
echo "$LOG_DIR"

echo ""
echo "Use ./stop-munazzim.sh to stop safely."
