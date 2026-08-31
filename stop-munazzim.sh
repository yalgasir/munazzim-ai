#!/usr/bin/env bash

PROJECT_DIR="$HOME/Desktop/munazzim-ai"
LOG_DIR="$PROJECT_DIR/logs"
NEXT_PORT=3001

cd "$PROJECT_DIR"

echo "======================================"
echo "Stopping Munazzim safely..."
echo "======================================"

echo "[1/5] Stopping Ngrok..."

NGROK_PIDS=$(pgrep -f "ngrok http $NEXT_PORT" || true)

if [ -n "$NGROK_PIDS" ]; then
  kill $NGROK_PIDS 2>/dev/null || true
  sleep 1
  echo "Ngrok stopped."
else
  echo "Ngrok not running."
fi

rm -f "$PROJECT_DIR/.ngrok.pid"


echo "[2/5] Stopping Next.js..."

NEXT_PIDS=$(pgrep -f "$PROJECT_DIR/node_modules/.bin/next dev -p $NEXT_PORT" || true)

if [ -n "$NEXT_PIDS" ]; then
  kill $NEXT_PIDS 2>/dev/null || true
  sleep 2
fi

NEXT_SERVER_PIDS=$(ss -ltnp 2>/dev/null | awk -v port=":$NEXT_PORT" '$4 ~ port {print $NF}' | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true)

if [ -n "$NEXT_SERVER_PIDS" ]; then
  kill $NEXT_SERVER_PIDS 2>/dev/null || true
  sleep 1
fi

if ss -ltn 2>/dev/null | grep -q ":$NEXT_PORT "; then
  echo "WARNING: Port $NEXT_PORT is still in use."
else
  echo "Next.js stopped."
fi

rm -f "$PROJECT_DIR/.next.pid"


echo "[3/5] Stopping Firebase Emulator safely..."

FIREBASE_PID=$(
  pgrep -f "firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data" |
  head -1 || true
)

EXPORT_OK=false

if [ -n "$FIREBASE_PID" ]; then

  echo "Sending SIGINT to Firebase PID $FIREBASE_PID..."
  kill -INT "$FIREBASE_PID"

  echo "Waiting for Firebase export..."

  for i in {1..40}; do
    if ! kill -0 "$FIREBASE_PID" 2>/dev/null; then
      break
    fi

    sleep 1
  done

  if kill -0 "$FIREBASE_PID" 2>/dev/null; then

    echo ""
    echo "WARNING: Firebase is still running."
    echo "DO NOT turn off the computer yet."
    echo "Check:"
    echo "$LOG_DIR/firebase.log"

  else

    echo "Firebase process stopped."

    if tail -100 "$LOG_DIR/firebase.log" 2>/dev/null | grep -q "Export complete"; then
      echo "Firebase data export completed successfully."
      EXPORT_OK=true
    else
      echo "WARNING: Could not confirm Firebase export."
      echo "Automatic backup will NOT run."
    fi

  fi

else

  echo "Firebase Emulator not running."

fi

rm -f "$PROJECT_DIR/.firebase.pid"


echo "[4/5] Creating automatic backup..."

if [ "$EXPORT_OK" = true ]; then

  SHUTDOWN_BACKUP_DIR="$PROJECT_DIR/backups/data/shutdown-$(date +"%Y-%m-%d_%H-%M-%S")"

  mkdir -p "$SHUTDOWN_BACKUP_DIR"
  cp -a "$PROJECT_DIR/emulator-data/." "$SHUTDOWN_BACKUP_DIR/"

  if [ -d "$SHUTDOWN_BACKUP_DIR" ] && [ -n "$(find "$SHUTDOWN_BACKUP_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
    echo "Shutdown backup completed successfully."
    echo "Location: $SHUTDOWN_BACKUP_DIR"
  else
    echo "WARNING: Shutdown backup was not created or is empty."
  fi

else

  echo "WARNING: Shutdown backup skipped because Firebase export was not confirmed."

fi


echo "[5/5] Checking final status..."

if ss -ltn 2>/dev/null | grep -q ":$NEXT_PORT "; then
  echo "Next.js:   STILL RUNNING"
else
  echo "Next.js:   STOPPED"
fi

if ss -ltn 2>/dev/null | grep -q ':8081 '; then
  echo "Firestore: STILL RUNNING"
else
  echo "Firestore: STOPPED"
fi

if ss -ltn 2>/dev/null | grep -q ':9099 '; then
  echo "Auth:      STILL RUNNING"
else
  echo "Auth:      STOPPED"
fi

if curl -s http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
  echo "Ngrok:     STILL RUNNING"
else
  echo "Ngrok:     STOPPED"
fi

if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "Ollama:    RUNNING"
else
  echo "Ollama:    NOT RUNNING"
fi

echo ""
echo "Ollama is intentionally left running."

echo ""
echo "======================================"
echo "Munazzim shutdown finished."
echo "======================================"
