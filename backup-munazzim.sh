#!/usr/bin/env bash

set -u

PROJECT_DIR="$HOME/Desktop/munazzim-ai"
SOURCE_DIR="$PROJECT_DIR/emulator-data"
BACKUP_ROOT="$PROJECT_DIR/backups"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

mkdir -p "$BACKUP_ROOT"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "ERROR: emulator-data not found."
  exit 1
fi

echo "======================================"
echo "Creating Munazzim backup..."
echo "======================================"

mkdir -p "$BACKUP_DIR"

cp -a "$SOURCE_DIR" "$BACKUP_DIR/"

echo ""
echo "Backup created:"
echo "$BACKUP_DIR/emulator-data"

echo ""
echo "Cleaning old backups..."

mapfile -t BACKUPS < <(
  find "$BACKUP_ROOT" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    -printf '%T@ %p\n' |
  sort -nr |
  cut -d' ' -f2-
)

TOTAL=${#BACKUPS[@]}

if [ "$TOTAL" -gt 10 ]; then
  for ((i=10; i<TOTAL; i++)); do
    OLD_BACKUP="${BACKUPS[$i]}"

    echo "Deleting old backup:"
    echo "$OLD_BACKUP"

    rm -rf -- "$OLD_BACKUP"
  done
else
  echo "No old backups need deletion."
fi

echo ""
echo "Backups kept:"
find "$BACKUP_ROOT" \
  -mindepth 1 \
  -maxdepth 1 \
  -type d |
sort -r |
head -10

echo ""
echo "======================================"
echo "Backup complete."
echo "======================================"
