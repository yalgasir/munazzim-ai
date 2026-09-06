# Munazzim Current Technical Documentation

**Document status:** Evidence-based prototype assessment (Ubuntu Lab Edition)

## Purpose and Scope

Munazzim is an integrated research prototype/MVP for AI-assisted task, appointment, and schedule-performance workflows. This document records available implementation, functional-exercise, and laboratory-demonstration evidence. It is not a production-readiness, security-certification, or formal compliance assessment.

## Current Readiness Position

| Assessment level | Status |
| --- | --- |
| TRL 3 | PASS |
| TRL 4 | PASS |
| TRL 5 | PASS |
| TRL 6 | PASS |

TRL 6 PASS means that the integrated prototype has been demonstrated in its documented relevant laboratory environment. It does **not** mean the system is production ready, certified, or qualified for operational commercial deployment.

## Documented Prototype Evidence

### Integrated application workflows

- The application provides task and appointment workflows and AI-assisted proposals that require user confirmation before proposed schedule actions are persisted.
- AI Assistant and AI Performance functionality were functionally exercised end-to-end through the Next.js application routes (`/api/ai/assistant`, `/api/ai/performance`).
- Deterministic schedule metrics (total appointments, total tasks, duration minutes, conflicting overlaps, free windows) are computed by code (`schedule-facts.ts`) and presented as ground truth to the AI model (**Code = Facts, AI = Interpretation**).
- Task and appointment persistence, validation/sanitizer behavior, and exact duplicate-handling cases were functionally verified with the Firestore Emulator.
- Standardized HTTP 401 unauthenticated response is enforced across all API endpoints when a valid user session is not present.

### AI and deterministic controls

- The central AI gateway supports a primary Qwen endpoint with sequential fallback to local Ollama.
- Primary Qwen (Qwen 3.5-2B-BF16 at `http://192.168.0.5/v1/chat/completions`) was verified end-to-end via the application layer in English, Arabic, and mixed prompts, using `enable_thinking: false` for direct, structured responses.
- Ollama (`llama3.2:3b`) is verified as a local fallback provider.
- Provider-facing structured-output requests are followed by local parsing, schema validation, sanitization, intent gating, and duplicate removal. Invalid model output is rejected rather than converted into schedule actions.

### Relevant laboratory environment & operational hardening

- The Ubuntu laboratory stack runs Next.js (port 3001), Firestore Emulator (port 8081), Auth Emulator (port 9099), Emulator UI (port 4000), Ollama (port 11434), and an Ngrok tunnel (`https://ether-kick-dash.ngrok-free.dev`) protected by HTTP Basic Authentication.
- Startup (`start-munazzim.sh`) uses `setsid` to ensure long-running services survive script termination without SIGHUP termination.
- Controlled shutdown (`stop-munazzim.sh`) scans active listening ports (8081, 9099, 3001, 4000, 4040) and eliminates lingering orphan processes.
- Backup export is automated via a systemd user service and timer (`munazzim-backup.timer`). Round-trip backup restoration was verified into an isolated test emulator instance.
- Bounded endurance and recovery testing (26 operations across rapid writes and restart cycles) demonstrated zero data corruption or unhandled crashes.

## Evidence Boundaries

The following are future production-readiness or higher-TRL activities:

- Production Firebase cloud deployment or real third-party Google Calendar OAuth sync;
- Enterprise-scale multi-tenant load and latency stress testing under thousands of concurrent users;
- Continuous cross-region disaster recovery replication;
- Formal ISO/IEC 27001 third-party audit and organizational certification.

## ISO Terminology

The applicable information-security standard is **ISO/IEC 27001:2022, Information security, cybersecurity and privacy protection — Information security management systems — Requirements**. ISO 7001 is a different standard concerning registered public-information graphical symbols. Munazzim is aligned with ISO/IEC 27001 information-security principles for research prototypes (least privilege, secure boundary, authenticated endpoints, session isolation); it is not claimed to be formally certified or compliant.