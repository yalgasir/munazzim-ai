# TRL 6 Security Test Evidence

**Execution date:** 2026-09-03
**Environment:** Ubuntu laboratory, branch `lab-ubuntu`

## Executed Checks

| Check | Command or method | Result | Evidence status |
| --- | --- | --- | --- |
| Branch and repository state | `git branch --show-current`; `git status --short` | Branch was `lab-ubuntu`. At inspection, the worktree contained the pre-existing untracked lab-environment documentation file. | PASS |
| Shell syntax | `bash -n start-munazzim.sh stop-munazzim.sh backup-munazzim-data.sh backup-munazzim.sh` | Passed. Scripts were not executed by this verification. | PASS |
| TypeScript validation | `npm run typecheck` | Passed (`tsc --noEmit`). | PASS |
| Build validation | Not run | A live `next dev` instance was already serving the laboratory application. A build was not run to avoid altering `.next` output while the lab runtime was active. | NOT VERIFIED |
| Dependency vulnerability audit | `npm audit --json` | 40 advisories: 1 critical, 14 high, 23 moderate, 2 low. Command exited 1 as expected when vulnerabilities were found. | GAP |
| Dependency freshness | `npm outdated --json` | Multiple installed packages have updates available, including Next.js, Firebase, OpenTelemetry, PostCSS, Sharp, and Zod. No updates were applied. | PARTIAL |
| Tracked secret hygiene | `git ls-files` filename scan; high-confidence token/key pattern scans of tracked content and local branch/tag history | No tracked `.env`, certificate/key, PID, backup, log, or emulator-data artifact found. No high-confidence token/key pattern match found. Generic terms occurred only in existing documentation and source references. | PASS |
| Git exclusions | `.gitignore` review | `.env*`, `node_modules`, `.next`, `backups`, `logs`, `emulator-data`, `.firebase`, and `*.pid` are ignored. | PASS |
| API rejection | Empty JSON POSTs to `/api/tasks`, `/api/appointments`, and `/api/ai/assistant` | Each endpoint returned HTTP 400. No valid creation payload was supplied. | PASS |
| API/AI code review | Static review of task, appointment, AI Assistant, AI Performance, AI log, Firebase, identity, and AI-flow modules | See findings below. Static inspection is not runtime authorization or penetration testing. | PARTIAL |
| Listening-port inspection | `ss -ltnp`; safe HTTP reachability checks | Next.js, Firestore Emulator, Auth Emulator, Emulator UI, Ollama, Ngrok local API, and Qwen endpoint were reachable. Binding observations are recorded below. | PARTIAL |
| Backup artifact inspection | Directory and metadata presence check only | Five local backup/export directories each contained Firestore, Auth, and Firebase metadata artifacts. | PASS |
| Auth Emulator session and isolation | Two disposable Email/Password Auth Emulator users; verified ID token to session endpoint; authenticated API exercise | Both sessions were established; user A created a disposable task, user B did not see it, user B update returned HTTP 404, and user A cleanup returned HTTP 200. | PASS |
| Authenticated API enforcement | Unauthenticated `GET /api/tasks` | Returned HTTP 401 with `Authentication required`. | PASS |
| Build validation | `npm run build` after remediation | Passed. Build reported a `@protobufjs/inquire` critical-dependency warning. | PASS WITH WARNING |
| Isolated Firestore Rules verification | `firebase emulators:exec --config firebase.security-test.json --only firestore 'node tests/security/firestore-rules.test.mjs'` | Rules loaded on temporary `127.0.0.1:18081`. Anonymous task read/write was denied; owner read/write was allowed; user A cross-user task read/write was denied. Equivalent appointment and AI-log ownership checks passed. | PASS |
| Isolated Firestore restore | `firebase emulators:exec --config firebase.restore-test.json --only firestore,auth --import backups/data/2026-08-30_10-59-14 ...` | Imported on temporary `127.0.0.1:18082`; Admin Firestore observed 3 tasks, 1 appointment, and 42 AI logs. | PASS |
| Isolated Auth restore | Same isolated import; Admin Auth `listUsers(100)` on `127.0.0.1:19099` | Emulator logged config/accounts import, but Admin Auth returned zero users. | NOT VERIFIED |
| Isolated Auth restore, nonempty backup | `firebase emulators:exec --config firebase.restore-test.json --only auth --import backups/data/shutdown-2026-09-03_13-08-01 ...` | Temporary Auth Emulator imported configuration/accounts; Admin Auth `listUsers(100)` returned 2 users. | PASS |
| AI negative paths and provider resilience | `npx tsx tests/security/ai-security.test.ts` | Ten assertions passed: malformed/empty JSON rejection, invalid task/appointment/analysis sanitization, duplicate suppression, Qwen-unavailable to Ollama fallback, dual-provider controlled failure, and JSON parser rejection. The tested AI flow has no Firestore write path. | PASS |
| Isolated Firebase unavailable | `FIRESTORE_EMULATOR_HOST=127.0.0.1:18083 timeout 15 node tests/security/firebase-failure-recovery.test.cjs` | No false success was emitted, but the Admin SDK write did not return a controlled error inside 15 seconds. | FAIL |
| Isolated Firebase recovery and endurance | `firebase emulators:exec --config firebase.failure-test.json --only firestore 'FIRESTORE_EMULATOR_HOST=127.0.0.1:18083 node tests/security/firebase-recovery-endurance.test.cjs'` | Recovery write/read passed. 26 operations: 26 successful, 5 expected duplicate-create rejections, 0 unexpected failures, 0 crashes, 0 duplicate writes, 0 corrupted writes. Temporary emulator stopped. | PASS |

## Observed Service Exposure

| Service | Observed binding/reachability | Classification from evidence |
| --- | --- | --- |
| Next.js | `*:3001`; HTTP 200 locally | LAN-accessible at process-binding layer; firewall exposure NOT VERIFIED. |
| Firestore Emulator | `*:8081`; HTTP 200 locally | LAN-accessible at process-binding layer. |
| Auth Emulator | `0.0.0.0:9099`; HTTP 200 locally | LAN-accessible at process-binding layer. |
| Emulator UI | `0.0.0.0:4000`; HTTP 200 locally | LAN-accessible at process-binding layer. |
| Ollama | `127.0.0.1:11434`; API HTTP 200 | Local-only by observed binding. |
| Ngrok inspection API | `127.0.0.1:4040`; API HTTP 200 | Local-only inspection service. Ngrok process is running; public tunnel and access policy NOT VERIFIED. |
| Qwen | `192.168.0.5/v1/models`; HTTP 200 | Reachable private-address/LAN service. Listener binding and access control NOT VERIFIED. |

## Static Review Findings

| Area | Finding | Status |
| --- | --- | --- |
| Demo identity | Auth Emulator token is verified server-side and used as the session identity. | PASS |
| Ownership checks | User A/user B exercise confirmed read isolation and cross-user update rejection at the API boundary. | PASS |
| Firestore rules | `firestore.rules` loaded into the isolated emulator; all task, appointment, and AI-log ownership allow/deny assertions passed. | PASS |
| AI controls | Canonical AI responses are JSON-parsed, schema-validated, sanitized, gated, and exact-deduplicated; malformed final JSON raises an error rather than creating schedule actions. | PARTIAL |
| AI schedule writes | AI Assistant returns proposals; task/appointment persistence is invoked after user action in the UI. | PASS for documented schedule-action confirmation |
| AI logs | The AI-log API writes prompt, analysis, recommendation, and model fields without content/schema limits; UI invokes it separately from schedule-action save. | GAP |
| Sensitive logging | AI flows now log and return only provider/attempt metadata rather than raw prompt/model-response content. Historical `next.log` content is not reclassified. | PARTIAL |
| Error handling | Main routes catch errors and return JSON status responses. Some routes return caught error messages to callers. | PARTIAL |
| Duplicate controls | Exact duplicate queries/in-memory filtering exist. The checks are non-transactional and concurrency behavior is NOT VERIFIED. | PARTIAL |
| Health reporting | Health route returns static component labels and does not probe dependencies. | GAP |

## Evidence Limits

This package did not perform destructive testing, penetration testing, authentication bypass testing, firewall changes, service reconfiguration of the live stack, external-system attacks, provider fault injection, Firebase-down testing, or endurance testing. No successful primary-Qwen application workflow was asserted from these checks.