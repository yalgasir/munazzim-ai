# Munazzim Ubuntu Laboratory Environment

## Scope

This document records the current Ubuntu laboratory environment used for Munazzim prototype operation. It describes the operational configuration, hardened management scripts, and verified laboratory state at TRL 6. It does not establish commercial production readiness or ISO certification.

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
| Qwen model | `/models/Qwen3.5-2B-BF16.gguf` (`enable_thinking: false`) |
| Fallback AI provider | Ollama at `http://127.0.0.1:11434/api/chat` |
| Ollama model | `llama3.2:3b` |

Qwen is the primary provider and has been verified end-to-end at the application layer across English, Arabic, and mixed schedule queries. Ollama is configured and verified as a seamless fallback provider.

## Firebase Emulator Environment

Munazzim uses the Firebase Emulator environment for laboratory operation.

| Emulator component | Current port |
| --- | --- |
| Firestore Emulator | `8081` |
| Auth Emulator | `9099` |
| Emulator UI | `4000` |

The Firestore and Auth emulators are configured in `firebase.json` to bind to `0.0.0.0`; the Emulator UI is enabled. The Firebase project alias in `.firebaserc` is `ai-time-manager-9dfc1`.

## Operational Scripts

| Purpose | Script | Hardening details |
| --- | --- | --- |
| Startup | `start-munazzim.sh` | Launches background services with `setsid` so child processes decouple from the launcher shell and survive terminal exit. |
| Controlled shutdown | `stop-munazzim.sh` | Gracefully shuts down services and explicitly terminates orphan processes bound to ports 8081, 9099, 3001, 4000, and 4040. |
| Firebase emulator export backup | `backup-munazzim-data.sh` | Exports running emulator data to timestamped archives under `backups/data/` and verifies export metadata. |
| Automated Backup Unit | `systemd/user/munazzim-backup.service` | Configured as an unprivileged user unit (without invalid `User=%u` directives), triggered daily by `munazzim-backup.timer`. |

`start-munazzim.sh` manages the laboratory services, including Ngrok. Ngrok is part of the laboratory environment and must not be removed. When `NGROK_BASIC_AUTH` is configured, the startup script starts an Ngrok tunnel for the Next.js port; when it is absent, the script leaves Ngrok stopped and reports the missing setting.

## Backup Export and Restore

Backup creation is automated via the user-level systemd timer. Complete round-trip restore has been verified by launching an isolated emulator instance importing from backup archives (`firebase emulators:exec --config firebase.restore-test.json --only firestore,auth --import ...`).

## Git-Excluded Local Artifacts

Existing `.gitignore` coverage keeps local runtime artifacts out of Git, including `node_modules`, `.next`, `backups`, `logs`, `emulator-data`, `.env*` files, `.firebase`, and `*.pid` files. These exclusions remain part of the laboratory setup.

## Security and TRL 6

TRL 6 security verification is aligned with applicable **ISO/IEC 27001:2022 information-security principles** (least privilege, secure boundary, authenticated endpoints, session isolation). This is prototype-scoped security verification; it does not claim formal ISO/IEC 27001 certification or compliance.