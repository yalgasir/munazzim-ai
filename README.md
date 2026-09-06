# 🚀 Munazzim AI | Research Prototype (Ubuntu Lab Edition)

![Status](https://img.shields.io/badge/Status-Active%20Prototype-emerald)
![Environment](https://img.shields.io/badge/Environment-Ubuntu%20Lab-blue)
![NASA TRL](https://img.shields.io/badge/NASA%20TRL-6%20(Achieved)-indigo)
![Primary AI Engine](https://img.shields.io/badge/Primary%20AI-Qwen%203.5--2B--BF16-orange)
![Fallback AI Engine](https://img.shields.io/badge/Fallback%20AI-Ollama%20llama3.2--3b-teal)

Munazzim (Arabic for "Organizer") is an AI-assisted time management and productivity research prototype developed by a research organization. It explores the synergy between deterministic schedule computation and cognitive natural-language understanding, operating under the architectural principle: **Code = Facts, AI = Interpretation**.

> [!NOTE]
> **Research Prototype Scope**: This system is a TRL 6 research prototype demonstrated in a representative Ubuntu laboratory environment. It is **not** a commercial manufacturing system, cloud production service, or certified enterprise product.

---

## 🏛 Architecture & Philosophy

```
  ┌─────────────────────────────────────────────────────────────┐
  │                      Web Client (Browser)                   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ HTTP / Next.js UI & API
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 Next.js 15 Application Server               │
  │                     (Port 3001 / Ubuntu)                    │
  ├──────────────────────────────┬──────────────────────────────┤
  │ Deterministic Schedule Engine│ Multi-User Isolation         │
  │ • schedule-facts.ts          │ • Firebase Auth Session      │
  │ • Conflict detection         │ • Strict Owner UID scoping   │
  │ • Duration / Gap calculation │ • Standardized 401/404 handling│
  └──────────────┬───────────────┴──────────────┬───────────────┘
                 │                              │
       AI Gateway Calls               Persistence (Admin SDK)
                 ▼                              ▼
  ┌──────────────────────────────┐  ┌───────────────────────────┐
  │ Dual-Engine AI Gateway       │  │ Firebase Emulator Suite   │
  │ • Primary: Qwen 3.5-2B-BF16  │  │ • Firestore (Port 8081)   │
  │   (http://192.168.0.5)       │  │ • Auth (Port 9099)        │
  │   enable_thinking: false     │  │ • UI (Port 4000)          │
  │ • Fallback: Ollama llama3.2  │  └───────────────────────────┘
  │   (http://127.0.0.1:11434)   │
  └──────────────────────────────┘
```

### Core Architectural Principle: Code = Facts, AI = Interpretation
1. **Code = Facts**: The application layer calculates deterministic schedule metrics (total appointments, total tasks, duration minutes, conflicting overlaps, free windows) via `schedule-facts.ts`.
2. **AI = Interpretation**: The language model (Qwen 3.5-2B-BF16 or Ollama fallback) receives these verified facts as ground truth to generate natural-language advice, executive summaries, and action recommendations. The model does not perform arithmetic on schedule boundaries.

---

## 🛠 Technology Stack

| Layer | Component / Configuration |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, React 19) |
| **Language** | TypeScript (Strict typechecking) |
| **Database & Auth** | Firebase Emulator Suite (Firestore: 8081, Auth: 9099) |
| **Primary AI Engine** | Qwen 3.5-2B-BF16 (`http://192.168.0.5/v1/chat/completions`, `enable_thinking: false`) |
| **Fallback AI Engine** | Ollama `llama3.2:3b` (`http://127.0.0.1:11434/api/chat`) |
| **Tunnel & Remote Access**| Ngrok Secure Tunnel with HTTP Basic Authentication (`NGROK_BASIC_AUTH`) |
| **Backup Automation** | Daily Systemd User Timer (`munazzim-backup.timer`) exporting Firestore & Auth metadata |
| **Operating System** | Ubuntu Linux (Lab Environment) |

---

## 🚀 Laboratory Operations

### Quick Start
```bash
# Start all laboratory services (Firebase, Next.js, Ollama, Ngrok)
./start-munazzim.sh
```

### Controlled Shutdown
```bash
# Gracefully stop all services and clean orphan emulator processes
./stop-munazzim.sh
```

### Backup & Restore
```bash
# Trigger an immediate manual backup export
./backup-munazzim-data.sh

# Check automated backup timer status
systemctl --user status munazzim-backup.timer
```

---

## 📊 Verification & Readiness Status

- **TRL Assessment**: **TRL 6 (Demonstrated in Relevant Environment)**
- **Multi-User Isolation**: Verified (session cookie authentication, Firestore owner isolation, cross-user read/write prevention).
- **AI Dual-Engine Validation**: Verified end-to-end (Qwen primary application calls succeed in English, Arabic, and mixed queries; Ollama verified in fallback).
- **Data Resilience**: Verified backup export and isolated restore cycle.
- **Standards Alignment**: Aligned with ISO/IEC 27001:2022 information security principles (least privilege, authenticated APIs, isolated runtime environments). *Not a formal certification claim.*