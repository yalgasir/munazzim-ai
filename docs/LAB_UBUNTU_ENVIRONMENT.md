# Munazzim Ubuntu Laboratory Environment

## Scope

This document records the current Ubuntu laboratory environment used for Munazzim prototype operation. It describes the existing operational configuration and does not establish production readiness, formal security compliance, or ISO certification.

## Branch Roles

- `lab-ubuntu` is the branch for laboratory/Ubuntu operational configuration.
- `main` remains the shared baseline.
- `windows` is reserved for Windows-specific operational setup.

## Application and AI Services

| Component | Current laboratory configuration |
| --- | --- |
| Operating system | Ubuntu laboratory environment |
| Next.js | `http://127.0.0.1:3001` |
| Primary AI provider | Qwen at `http://192.168.0.5/v1/chat/completions` |
| Qwen model | `/models/Qwen3.5-2B-BF16.gguf` |
| Fallback AI provider | Ollama at `http://127.0.0.1:11434/api/chat` |
| Ollama model | `llama3.2:3b` |

Qwen remains the configured primary provider. The existing operational flow checks its laboratory endpoint and continues with the Ollama fallback when Qwen is unreachable. These settings are documented as currently configured; this document does not claim a completed application-level Qwen verification.

## Firebase Emulator Environment

Munazzim uses the Firebase Emulator environment for laboratory operation.

| Emulator component | Current port |
| --- | --- |
| Firestore Emulator | `8081` |
| Auth Emulator | `9099` |
| Emulator UI | `4000` |

The Firestore and Auth emulators are configured in `firebase.json` to bind to `0.0.0.0`; the Emulator UI is enabled. The Firebase project alias in `.firebaserc` is `ai-time-manager-9dfc1`.

## Operational Scripts

| Purpose | Script |
| --- | --- |
| Startup | `start-munazzim.sh` |
| Controlled shutdown | `stop-munazzim.sh` |
| Firebase emulator export backup | `backup-munazzim-data.sh` |
| Local emulator-data copy backup | `backup-munazzim.sh` |

`start-munazzim.sh` manages the laboratory services, including Ngrok. Ngrok is part of the laboratory environment and must not be removed. When `NGROK_BASIC_AUTH` is configured, the startup script starts an Ngrok tunnel for the Next.js port; when it is absent, the script leaves Ngrok stopped and reports the missing setting.

`backup-munazzim-data.sh` is designed to export the running Firebase Emulator state into a timestamped backup and verifies the Firestore export metadata. It checks for an Auth export and reports when Auth data was not exported. `stop-munazzim.sh` requests emulator export during controlled shutdown and creates a shutdown copy only after it observes export completion. Backup restore remains a TRL 6 verification activity, not a completed claim.

## Git-Excluded Local Artifacts

Existing `.gitignore` coverage keeps local runtime artifacts out of Git, including `node_modules`, `.next`, `backups`, `logs`, `emulator-data`, `.env*` files, `.firebase`, and `*.pid` files. These exclusions remain part of the laboratory setup.

## Security and TRL 6

TRL 6 security verification is planned to be aligned with applicable **ISO/IEC 27001:2022 information-security principles**. This is prototype-scoped security-verification guidance only; it does not claim ISO/IEC 27001 certification, formal compliance, conformity, or production readiness.