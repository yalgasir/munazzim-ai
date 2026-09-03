# ISO/IEC 27001:2022-Aligned TRL 6 Security Assessment

**Assessment date:** 2026-09-03
**Environment:** Ubuntu laboratory (`lab-ubuntu`)
**Scope:** Munazzim research prototype security verification for TRL 6
**Overall result:** **PARTIAL**

## Scope and Terminology

This is a prototype-scoped verification package aligned with applicable ISO/IEC 27001:2022 information-security principles. It is not an ISO/IEC 27001 certification, formal compliance, conformity, or production-readiness assessment.

## Summary

The Ubuntu laboratory prototype has useful defensive controls: Firebase Auth Emulator users receive verified server sessions, the API derives its user ID from the verified session rather than a fixed guest value, and a two-user exercise demonstrated task isolation and cross-user mutation rejection. Local API validation rejects empty requests, AI outputs pass structured parsing and sanitizer/schema boundaries, and raw prompt/model-response logging was removed from AI flows while retaining provider metadata. The recorded laboratory stack is reachable and the operational scripts pass shell syntax validation.

The evidence is insufficient for a TRL 6 security-verification pass. Prototype Firestore Rules now exist but have not been loaded into a restarted emulator because the existing server persistence layer still uses the unauthenticated Firebase Web SDK; reloading the rules before migrating that layer would disrupt server persistence. Emulator services bind beyond loopback, the dependency audit reports known vulnerabilities, and backup restore has not been exercised. These are documented gaps, not claims of a failed production system.

## Evidence Status

| Security area | Status | Evidence and assessment |
| --- | --- | --- |
| Access control and identity | PARTIAL | API routes ignore submitted user IDs and check stored ownership, but `getCurrentUserId()` always returns `public-guest`; real authentication and user isolation are not demonstrated. |
| API input validation | PARTIAL | Empty JSON requests to task, appointment, and AI Assistant endpoints returned HTTP 400. Date/time checks are implemented, but broad malformed-input and size-limit coverage is NOT VERIFIED. |
| AI output boundary | PARTIAL | Structured JSON parsing, Zod schemas, sanitization, intent gating, and confirmation before AI task/appointment writes are implemented. Semantic correctness and all failure cases are NOT VERIFIED. |
| Secret and configuration hygiene | PASS | `.env*`, runtime directories, logs, backups, emulator data, and PID files are ignored. No high-confidence secret pattern or sensitive filename was found in tracked files or local branch/tag history. This is not a guarantee that no secret exists. |
| Network/service exposure | PARTIAL | Live inspection found Next.js on all interfaces, Firestore on all interfaces, Auth/UI on `0.0.0.0`, and Ollama/Ngrok API on loopback. Network firewall, Qwen host exposure, and current public tunnel access are NOT VERIFIED. |
| Dependency security | GAP | `npm audit` reported 40 advisories: 1 critical, 14 high, 23 moderate, and 2 low. Impact and remediation were not assessed in this package. |
| Git hygiene | PASS | Current tracked-file scan found no `.env`, keys, backups, logs, emulator data, or PID artifacts; the required local exclusions are in `.gitignore`. |
| Backup and recovery | PARTIAL | Four local export artifacts contain Firestore, Auth, and metadata directories/files. Backup scripts were reviewed and passed syntax validation. Restore is NOT VERIFIED. |
| Logging and traceability | PARTIAL | Operational logs exist for backup, Firebase, Next.js, and Ngrok. AI flows no longer log or return raw model-response content; historical log retention and access controls are NOT VERIFIED. |
| Availability and resilience | PARTIAL | Qwen endpoint and Ollama were reachable; Qwen-first/Ollama-fallback behavior and bounded provider timeouts are implemented. This is not high availability, and recovery/endurance evidence is NOT VERIFIED. |

## Access-Control Findings

- **PASS (prototype data-path control):** Task and appointment routes derive the server-side user ID, ignore client-provided user IDs on create, query by the derived ID, and verify stored ownership before update or delete.
- **PARTIAL (identity):** The derived ID is a fixed demo identity, `public-guest`, for every request. The route boundary is not a real authentication, token-verification, authorization, or multi-user isolation boundary.
- **NOT VERIFIED:** Firestore Security Rules evaluation, authenticated browser behavior, role boundaries, and cross-user isolation testing.
- **NOT APPLICABLE in this laboratory assessment:** Enterprise IAM, organizational access governance, and production tenant administration.

## Environment Exposure Findings

Live `ss` inspection recorded `*:3001` for Next.js, `*:8081` for Firestore Emulator, and `0.0.0.0:9099`/`0.0.0.0:4000` for Auth Emulator and Emulator UI. Ollama was bound to `127.0.0.1:11434`; Ngrok's local inspection API was bound to `127.0.0.1:4040`. The configured Qwen endpoint is the reachable private-address service `192.168.0.5`.

Consequently, Next.js and emulator services are LAN-accessible at the process-binding layer unless host or network controls restrict them. Ollama and the Ngrok inspection API are local-only by binding. Ngrok is required in the laboratory environment and is retained; its running local API was reachable, but this package does not assert the current public tunnel URL, access policy, or remote-user authorization.

## TRL 6 Security Conclusion

**PARTIAL.** The documented verification establishes meaningful prototype controls and live laboratory evidence, but does not yet demonstrate the identity, access-control, service-exposure, logging-protection, dependency-remediation, and backup-restore evidence needed for a TRL 6 security-verification pass. The production-readiness items listed in the gaps document are not automatic TRL 6 blockers.