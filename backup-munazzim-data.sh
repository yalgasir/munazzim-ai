#!/usr/bin/env bash

#############################################################################
# Munazzim Daily Backup Script
# 
# Purpose:
#   Safely export running Firebase Emulator data (Firestore + Auth) to a
#   timestamped backup directory while the emulator and Next.js are running.
#
# Usage:
#   ./backup-munazzim-data.sh
#
# Schedule:
#   Intended to run via systemd timer daily at 16:00 (4 PM) local time
#
# Backup Directory:
#   $HOME/Desktop/munazzim-ai/backups/data/YYYY-MM-DD_HH-MM-SS/
#
# Restore Usage:
#   firebase emulators:start --import=$HOME/Desktop/munazzim-ai/backups/data/YYYY-MM-DD_HH-MM-SS
#
#############################################################################

set -euo pipefail

# Project configuration
PROJECT_DIR="$HOME/Desktop/munazzim-ai"
BACKUPS_DIR="$PROJECT_DIR/backups/data"
LOGS_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOGS_DIR/backup.log"
RETENTION_DAYS=30

# Emulator endpoints (must be running)
FIRESTORE_PORT=8081
AUTH_PORT=9099

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

#############################################################################
# Logging Functions
#############################################################################

log_info() {
  local message="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local formatted="[${timestamp}] [INFO] $message"
  echo "$formatted" >> "$LOG_FILE"
  echo "$formatted" >&2
}

log_error() {
  local message="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local formatted="[${timestamp}] [ERROR] $message"
  echo "$formatted" >> "$LOG_FILE"
  echo -e "${RED}${formatted}${NC}" >&2
}

log_success() {
  local message="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local formatted="[${timestamp}] [SUCCESS] $message"
  echo "$formatted" >> "$LOG_FILE"
  echo -e "${GREEN}${formatted}${NC}" >&2
}

log_warning() {
  local message="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local formatted="[${timestamp}] [WARNING] $message"
  echo "$formatted" >> "$LOG_FILE"
  echo -e "${YELLOW}${formatted}${NC}" >&2
}

#############################################################################
# Safety Checks
#############################################################################

check_firebase_cli() {
  log_info "Checking Firebase CLI availability..."
  if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI not found. Install with: npm install -g firebase-tools"
    return 1
  fi
  log_info "Firebase CLI found: $(firebase --version)"
  return 0
}

check_firestore_emulator() {
  log_info "Checking Firestore Emulator on port $FIRESTORE_PORT..."
  if ! timeout 3 bash -c "echo > /dev/tcp/127.0.0.1/$FIRESTORE_PORT" 2>/dev/null; then
    log_error "Firestore Emulator not reachable on port $FIRESTORE_PORT"
    return 1
  fi
  log_info "Firestore Emulator is running"
  return 0
}

check_auth_emulator() {
  log_info "Checking Auth Emulator on port $AUTH_PORT..."
  if timeout 3 bash -c "echo > /dev/tcp/127.0.0.1/$AUTH_PORT" 2>/dev/null; then
    log_info "Auth Emulator is running"
    return 0
  else
    log_warning "Auth Emulator not reachable on port $AUTH_PORT (may not be running)"
    return 0 # Not critical
  fi
}

check_project_dir() {
  log_info "Checking project directory: $PROJECT_DIR"
  if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Project directory not found: $PROJECT_DIR"
    return 1
  fi
  if [ ! -f "$PROJECT_DIR/firebase.json" ]; then
    log_error "firebase.json not found in $PROJECT_DIR"
    return 1
  fi
  log_info "Project directory is valid"
  return 0
}

#############################################################################
# Backup Operations
#############################################################################

create_backup_directory() {
  # Create timestamped backup directory
  local timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
  local backup_path="$BACKUPS_DIR/$timestamp"
  
  log_info "Creating backup directory: $backup_path"
  mkdir -p "$BACKUPS_DIR" || {
    log_error "Failed to create backups directory"
    return 1
  }
  
  mkdir -p "$backup_path" || {
    log_error "Failed to create timestamped backup directory"
    return 1
  }
  
  echo "$backup_path"
}

export_emulator_data() {
  local backup_path="$1"
  
  log_info "Exporting Firestore and Auth Emulator data to: $backup_path"
  
  cd "$PROJECT_DIR"
  
  # Run firebase emulators:export
  # Note: This exports the running emulator state to the backup directory
  if firebase emulators:export "$backup_path" >> "$LOG_FILE" 2>&1; then
    log_info "Emulator export successful"
    return 0
  else
    log_error "Emulator export failed"
    return 1
  fi
}

verify_backup() {
  local backup_path="$1"
  
  log_info "Verifying backup contents..."
  
  # Check for firebase export metadata
  if [ ! -f "$backup_path/firebase-export-metadata.json" ]; then
    log_error "Missing firebase-export-metadata.json in backup"
    return 1
  fi
  log_info "✓ firebase-export-metadata.json found"
  
  # Check for Firestore export
  if [ ! -d "$backup_path/firestore_export" ]; then
    log_error "Missing firestore_export directory in backup"
    return 1
  fi
  log_info "✓ firestore_export directory found"
  
  # Check for Auth export (if available)
  if [ -d "$backup_path/auth_export" ]; then
    log_info "✓ auth_export directory found"
  else
    log_warning "auth_export directory not found (Auth may not have been running)"
  fi
  
  log_success "Backup verification passed"
  return 0
}

#############################################################################
# Retention Policy
#############################################################################

cleanup_old_backups() {
  log_info "Running retention cleanup (keeping last $RETENTION_DAYS daily backups)..."
  
  if [ ! -d "$BACKUPS_DIR" ]; then
    log_info "No backup directory to clean"
    return 0
  fi
  
  # Find and delete backups older than retention period
  local deleted_count=0
  while IFS= read -r -d '' backup_dir; do
    local backup_name=$(basename "$backup_dir")
    log_info "Deleting old backup: $backup_name"
    rm -rf "$backup_dir"
    ((deleted_count++))
  done < <(find "$BACKUPS_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETENTION_DAYS" -print0)
  
  if [ $deleted_count -gt 0 ]; then
    log_info "Deleted $deleted_count old backup(s)"
  else
    log_info "No backups older than $RETENTION_DAYS days to delete"
  fi
}

#############################################################################
# Main Execution
#############################################################################

main() {
  log_info "========================================"
  log_info "Munazzim Backup Started"
  log_info "========================================"
  
  # Ensure logs directory exists
  mkdir -p "$LOGS_DIR"
  
  # Run all safety checks
  if ! check_project_dir; then
    log_error "Project directory check failed"
    return 1
  fi
  
  if ! check_firebase_cli; then
    log_error "Firebase CLI check failed"
    return 1
  fi
  
  if ! check_firestore_emulator; then
    log_error "Firestore Emulator check failed"
    return 1
  fi
  
  check_auth_emulator # Warning only
  
  # Create timestamped backup directory
  local backup_path
  backup_path=$(create_backup_directory) || return 1
  
  # Export emulator data
  if ! export_emulator_data "$backup_path"; then
    log_error "Backup export failed"
    # Remove failed backup directory
    rm -rf "$backup_path"
    return 1
  fi
  
  # Verify backup contents
  if ! verify_backup "$backup_path"; then
    log_error "Backup verification failed"
    # Remove invalid backup directory
    rm -rf "$backup_path"
    return 1
  fi
  
  # Clean up old backups
  cleanup_old_backups
  
  # Report success
  log_success "========================================"
  log_success "Backup completed successfully!"
  log_success "Location: $backup_path"
  log_success "========================================"
  
  return 0
}

# Run main function
main "$@"
exit $?
