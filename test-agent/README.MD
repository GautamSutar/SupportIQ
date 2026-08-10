# SupportIQ — AI Agent Supervisor Workstation

A workstation that lets a human supervisor monitor AI customer-service agents in real time, take over conversations when needed, tune agent behavior, and manage reusable response templates.

## Overview

AI agents handle routine customer-service conversations automatically. This app is the control panel a human supervisor uses to watch those conversations, step in when the AI struggles or a customer needs a human touch, and configure how the AI behaves — all backed by real infrastructure, not mocked data.

## What's Real vs. Simulated

| Component | Status |
|---|---|
| AI agent responses | **Real** — calls OpenRouter's LLM API |
| Knowledge-base retrieval | **Real** — Pinecone vector search over indexed policy docs |
| Database | **Real** — MongoDB Atlas (cloud) |
| Live conversation updates | **Real** — MongoDB Change Streams pushed over WebSocket |
| Live dashboard metrics | **Real** — Server-Sent Events (SSE), recomputed every 2s from actual data |
| Voice input | **Real** — browser's native Web Speech API |
| "Agent Performance" tab numbers | **Static demo data** seeded once, not recalculated from live conversations |

## Project Flow

```
Supervisor opens Dashboard
        │
        ▼
Live metrics stream in via SSE (every 2s) ──► conversation table shows current state
        │
        ▼
Supervisor clicks a conversation ──► ConversationView opens
        │
        ▼
Take Over ──► POST /api/intervene ──► DB updated ──► Change Stream fires
        │                                                   │
        ▼                                                   ▼
Supervisor types or speaks (Web Speech API)      WebSocket broadcasts to all
        │                                        connected browsers instantly
        ▼
Optionally inserts a Template (variables auto-filled from
conversation context, highlighted, editable before sending)
        │
        ▼
Send message ──► POST /api/conversations/:id/messages
        │
        ▼
Return to AI with notes ──► POST /api/intervene/release ──► AI resumes
```

Separately, on the **Agent Config** page, a supervisor adjusts an agent's parameters (temperature, max tokens, top-p), toggles capabilities/knowledge-base access, sets escalation thresholds, and can save/load named presets — all persisted to MongoDB via `PATCH /api/agents/:id/config`.

On the **Templates** page, supervisors create/edit/delete reusable response templates with `{{variable}}` placeholders, categorize them, and optionally share them with the team.

## Architecture

```
Browser (React)                Backend (Node/Express)          External Services
┌───────────────┐  REST/HTTP   ┌──────────────────┐            ┌─────────────┐
│ Pages          │────────────►│ Routes            │───────────►│ MongoDB Atlas│
│ Components     │◄────────────│ Models (Mongoose) │            └─────────────┘
│ Context (state)│  WebSocket  │ Middleware         │───────────►┌─────────────┐
│ API client     │◄═══════════►│ WebSocket hub      │            │  OpenRouter  │
└───────────────┘   SSE        └──────────────────┘            │   (LLM)      │
                    ◄───────────────────┘                       └─────────────┘
                                                        ────────►┌─────────────┐
                                                                  │  Pinecone    │
                                                                  │(vector search)│
                                                                  └─────────────┘
```

See `backend-starter/` and `frontend-starter/` for the folder-by-folder breakdown — routes are split by resource (`conversations`, `agents`, `intervene`, `templates`, `analytics`), and the frontend follows a `pages → components → context → api` layering.

## Tech Stack

**Backend:** Node.js, Express, Mongoose, WebSocket (`ws`), Server-Sent Events, OpenRouter (LLM), Pinecone (vector DB)
**Frontend:** React, Chakra UI, Recharts, native Web Speech API
**Database:** MongoDB Atlas (cloud-hosted)
**Infra:** Docker + Docker Compose

## Setup Instructions

### Prerequisites
- Docker + Docker Compose
- Node.js v16+ (only needed if running outside Docker)
- A MongoDB Atlas cluster, OpenRouter API key, and Pinecone API key (put these in `backend-starter/.env` — see `.env` for the expected variable names: `MONGODB_URI`, `OPENROUTER_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`)

### Run with Docker (recommended)
```bash
cd test-agent
docker compose up -d
```
This builds and starts both containers:
- Backend → http://localhost:8080 (API docs at `/api-docs`)
- Frontend → http://localhost:3000

Check status:
```bash
docker compose ps
docker logs zangoh-supervisor-backend --tail 30
docker logs zangoh-supervisor-frontend --tail 30
```

### Run manually (without Docker)
Two terminals:
```bash
# Terminal 1
cd backend-starter
npm install
npm start

# Terminal 2
cd frontend-starter
npm install
npm start
```

### Seed / reset sample data
```bash
cd backend-starter
npm run seed
```
This clears and reloads sample conversations, agents, knowledge-base entries, and response templates into MongoDB Atlas.

### Stop everything
```bash
docker compose down
```

## API Endpoints

| Resource | Endpoints |
|---|---|
| Conversations | `GET /api/conversations`, `GET /:id`, `POST /:id/messages`, `PATCH /:id/status`, `POST /:id/tags` |
| Agents | `GET /api/agents`, `GET /:id`, `PATCH /:id/config`, `GET /:id/metrics`, `POST/DELETE /:id/presets` |
| Intervention | `POST /api/intervene`, `POST /api/intervene/release` |
| Templates | `GET/POST /api/templates`, `GET/PUT/DELETE /:id`, `POST /:id/render` |
| Analytics | `GET /api/analytics`, `GET /api/analytics/stream` (SSE, live) |
| Knowledge Base | `GET /api/knowledge-base` |
| LLM | `POST /api/llm/generate`, `POST /api/llm/sentiment`, `POST /api/llm/knowledge` |
| WebSocket | Broadcasts `new_conversation`, `conversation_updated`, `agent_update` from MongoDB Change Streams |

## Challenges Faced & Solutions

- **DNS SRV lookups failing for `mongodb+srv://`** — the local network's DNS resolver answered plain A-record queries fine but silently failed Node's SRV lookups (needed for Atlas connection strings), even though the OS-level resolver (`nslookup`) worked. Fixed by explicitly pointing Node's `dns` module at public resolvers (`8.8.8.8`, `1.1.1.1`) before connecting.
- **Fake "real-time" updates** — the original starter simulated random conversation activity that was never actually connected to the database (a destructuring bug pulled from the wrong export). Replaced with genuine MongoDB Change Streams so updates are only ever broadcast when something *actually* changed in the database.
- **Module-load-order bug with Pinecone** — `vectorDbSetup.js` read `process.env.PINECONE_API_KEY` at module-load time, but that ran before `dotenv.config()` had executed when the app was started outside Docker (Docker injects env vars at the container level, masking the issue there). Fixed by loading env vars at the top of that module directly, independent of require order elsewhere.
- **SSE vs. WebSocket choice** — used WebSocket (bidirectional) for conversation updates since either side may need to signal, and SSE (one-way) for dashboard metrics since the client only ever needs to receive, never send — matching the transport to the actual data-flow shape rather than using one mechanism for everything.
- **Popover clipped by a `overflow: auto` ancestor** — a mobile-responsiveness fix elsewhere accidentally clipped the conversation table's filter popover. Fixed by removing the redundant overflow rule and wrapping the popover in a `Portal` so it can't be clipped by ancestor layout again.

## Testing

```bash
cd testing
npm install
node test-runner.js
```
