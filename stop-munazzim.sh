#!/usr/bin/env bash

PROJECT_DIR="$HOME/Desktop/munazzim-ai"
LOG_DIR="$PROJECT_DIR/logs"

cd "$PROJECT_DIR"

echo "======================================"
echo "Stopping Munazzim safely..."
echo "======================================"

echo "[1/5] Stopping Ngrok..."

NGROK_PIDS=$(pgrep -f "ngrok http 3000" || true)

if [ -n "$NGROK_PIDS" ]; then
  kill $NGROK_PIDS 2>/dev/null || true
  sleep 1
  echo "Ngrok stopped."
else
  echo "Ngrok not running."
fi

rm -f "$PROJECT_DIR/.ngrok.pid"


echo "[2/5] Stopping Next.js..."

NEXT_PIDS=$(pgrep -f "$PROJECT_DIR/node_modules/.bin/next dev -p 3000" || true)

if [ -n "$NEXT_PIDS" ]; then
  kill $NEXT_PIDS 2>/dev/null || true
  sleep 2
fi

NEXT_SERVER_PIDS=$(pgrep -f "next-server" || true)

if [ -n "$NEXT_SERVER_PIDS" ]; then
  kill $NEXT_SERVER_PIDS 2>/dev/null || true
  sleep 1
fi

if ss -ltn 2>/dev/null | grep -q ':3000 '; then
  echo "WARNING: Port 3000 is still in use."
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

  if [ -x "$PROJECT_DIR/backup-munazzim.sh" ]; then

    "$PROJECT_DIR/backup-munazzim.sh"

  else

    echo "WARNING: backup-munazzim.sh is missing or not executable."

  fi

else

  echo "Backup skipped because a new Firebase export was not confirmed."

fi


echo "[5/5] Checking final status..."

if ss -ltn 2>/dev/null | grep -q ':3000 '; then
  echo "Next.js:   STILL RUNNING"
else
  echo "Next.js:   STOPPED"
fi

if ss -ltn 2>/dev/null | grep -q ':8080 '; then
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
