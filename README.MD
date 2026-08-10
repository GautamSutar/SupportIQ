# SupportIQ

**Intelligent Support. Faster Resolution.**

A human-in-the-loop workstation for supervising AI customer-service agents — monitor conversations live, take over when it matters, speak instead of type, reuse smart response templates, and tune agent behavior, all backed by real infrastructure rather than mocked data.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Chakra UI](https://img.shields.io/badge/UI-Chakra-319795?logo=chakraui&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [What's Real vs. Simulated](#whats-real-vs-simulated)
- [Feature Tour](#feature-tour)
- [Project Flow](#project-flow)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Challenges Faced & Solutions](#challenges-faced--solutions)
- [Testing](#testing)

---

## Overview

AI agents now handle the bulk of routine customer-service conversations — but they still get stuck, misread a frustrated customer, or hit a question only a human can answer. **SupportIQ is the control room a human supervisor sits in** to watch that happen, step in the moment it's needed, and make the AI a little smarter every time.

Two entry points ship with the project:

| Route | What it is |
|---|---|
| `/` | A cinematic 3D marketing page introducing SupportIQ |
| `/dashboard` | The actual supervisor workstation |

---

## What's Real vs. Simulated

Full transparency on what's genuinely live versus illustrative demo data:

| Component | Status |
|---|---|
| AI agent responses | ✅ **Real** — calls OpenRouter's LLM API |
| Knowledge-base retrieval | ✅ **Real** — Pinecone vector search over indexed policy docs |
| Database | ✅ **Real** — MongoDB Atlas (cloud) |
| Live conversation updates | ✅ **Real** — MongoDB Change Streams pushed over WebSocket |
| Live dashboard metrics | ✅ **Real** — Server-Sent Events (SSE), recomputed every 2s from actual data |
| Voice input | ✅ **Real** — browser's native Web Speech API |
| "Agent Performance" tab numbers | ⚠️ **Static demo data**, seeded once — not recalculated from live conversations |

---

## Feature Tour

### 📊 Live Dashboard
Real-time conversation table, CSAT trend chart, resolution/escalation/response-time metrics — all streamed via SSE and refreshed every 2 seconds without a page reload.

### 💬 Intervention Workstation
Open any conversation, **take over** from the AI, and respond by typing *or speaking* (Web Speech API converts your voice to text live). Return control to the AI with handoff notes when you're done.

### 📝 Response Templates
Create reusable replies with `{{variable_name}}` placeholders, organize them by category, and share them with your team. Insert a template mid-conversation and its variables auto-fill from context — clearly highlighted so you always know what's real versus needs your input.

### ⚙️ Agent Configuration
Tune temperature, top-p, and max tokens; toggle capabilities and knowledge-base access; set escalation thresholds; save and reload named presets — all persisted to the database, not local state.

### 🎬 Cinematic Landing Page
A scroll-driven 3D experience at `/` — glass panels, depth-based parallax, and the SupportIQ logo animation — that hands off cleanly into the real dashboard.

---

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

---

## Architecture

```
   Browser (React)                  Backend (Node/Express)            External Services
  ┌─────────────────┐   REST/HTTP  ┌──────────────────────┐          ┌──────────────┐
  │ Pages             │────────────►│ Routes                │─────────►│ MongoDB Atlas │
  │ Components         │◄───────────│ Models (Mongoose)     │          └──────────────┘
  │ Context (state)      │ WebSocket │ Middleware             │─────────►┌──────────────┐
  │ API client            │◄════════►│ WebSocket hub           │         │  OpenRouter   │
  └─────────────────┘   SSE        └──────────────────────┘          │    (LLM)     │
                        ◄──────────────────────┘                     └──────────────┘
                                                              ────────►┌──────────────┐
                                                                        │   Pinecone    │
                                                                        │(vector search)│
                                                                        └──────────────┘
```

The frontend follows a `pages → components → context → api` layering — pages own screens, components are reused across them, `context/` is the single source of truth synced live over WebSocket, and `api/index.js` is the only file that knows the backend's shape.

The backend is split by resource (`conversations`, `agents`, `intervene`, `templates`, `analytics`), with a dedicated WebSocket hub that watches MongoDB Change Streams and broadcasts real mutations — not simulated ones.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React · Chakra UI · Recharts · native Web Speech API |
| **Backend** | Node.js · Express · Mongoose · `ws` (WebSocket) · Server-Sent Events |
| **Database** | MongoDB Atlas (cloud) |
| **AI** | OpenRouter (LLM) · Pinecone (vector search) |
| **Infra** | Docker · Docker Compose |

---

## Project Structure

```
test-agent/
├── backend-starter/
│   ├── server.js                 # Composition root — mounts routes, starts HTTP + WebSocket
│   ├── models/                   # Mongoose schemas (Conversation, Agent, ResponseTemplate…)
│   ├── routes/                   # One file per resource
│   ├── middleware/                # requestLogger, errorHandler
│   ├── websocket/socketHandler.js # Change-stream watcher → WebSocket broadcaster
│   ├── mockLlmApi.js              # Real OpenRouter calls (with local fallback)
│   ├── vectorDbSetup.js           # Pinecone indexing + retrieval
│   └── utils/seed.js              # Sample-data loader
│
├── frontend-starter/
│   ├── public/
│   │   ├── index.html             # React app shell
│   │   ├── landing.html           # Cinematic 3D marketing page
│   │   └── assets/                # Logo image/video
│   └── src/
│       ├── app.js                 # Routes: "/" → Landing, "/dashboard" → app
│       ├── pages/                 # Dashboard, ConversationView, AgentConfig, Templates…
│       ├── components/            # Header, Sidebar, TemplatePickerModal…
│       ├── context/                # AppDataContext, WebSocketContext
│       ├── api/index.js            # Every backend call, in one place
│       └── utils/                  # useSpeechRecognition, templateUtils, dateUtils
│
├── docker/                        # Dockerfiles
├── docker-compose.yaml
└── testing/test-runner.js
```

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Node.js v16+ (only if running outside Docker)
- A MongoDB Atlas cluster, an OpenRouter API key, and a Pinecone API key

### 1 · Run with Docker (recommended)

```bash
cd test-agent
docker compose up -d
```

| Service | URL |
|---|---|
| Landing page | http://localhost:3001 |
| Dashboard | http://localhost:3001/dashboard |
| Backend API | http://localhost:8080 |
| API docs (Swagger) | http://localhost:8080/api-docs |

> Port **3001** is used for the frontend (not the default 3000) to avoid clashing with other local dev servers — see `docker-compose.yaml`.

Check status:
```bash
docker compose ps
docker logs zangoh-supervisor-backend --tail 30
docker logs zangoh-supervisor-frontend --tail 30
```

### 2 · Run manually (without Docker)

```bash
# Terminal 1 — backend
cd backend-starter
npm install
npm start

# Terminal 2 — frontend
cd frontend-starter
npm install
npm start
```

### 3 · Seed / reset sample data

```bash
cd backend-starter
npm run seed
```
Clears and reloads sample conversations, agents, knowledge-base entries, and response templates into MongoDB Atlas.

### 4 · Stop everything

```bash
docker compose down
```

---

## Environment Variables

Set these in `backend-starter/.env` (never commit this file):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `OPENROUTER_API_KEY` | LLM calls for AI agent responses |
| `PINECONE_API_KEY` | Vector search for knowledge-base retrieval |
| `PINECONE_INDEX_NAME` | Target Pinecone index |

---

## API Reference

| Resource | Endpoints |
|---|---|
| **Conversations** | `GET /api/conversations` · `GET /:id` · `POST /:id/messages` · `PATCH /:id/status` · `POST /:id/tags` |
| **Agents** | `GET /api/agents` · `GET /:id` · `PATCH /:id/config` · `GET /:id/metrics` · `POST` / `DELETE /:id/presets` |
| **Intervention** | `POST /api/intervene` · `POST /api/intervene/release` |
| **Templates** | `GET` / `POST /api/templates` · `GET` / `PUT` / `DELETE /:id` · `POST /:id/render` |
| **Analytics** | `GET /api/analytics` · `GET /api/analytics/stream` *(SSE, live)* |
| **Knowledge Base** | `GET /api/knowledge-base` |
| **LLM** | `POST /api/llm/generate` · `POST /api/llm/sentiment` · `POST /api/llm/knowledge` |
| **WebSocket** | Broadcasts `new_conversation`, `conversation_updated`, `agent_update` — sourced from real MongoDB Change Streams |

Full interactive docs at [`/api-docs`](http://localhost:8080/api-docs) once the backend is running.

---

## Challenges Faced & Solutions

<details>
<summary><strong>DNS SRV lookups failing for <code>mongodb+srv://</code></strong></summary>
<br>
The local network's DNS resolver answered plain A-record queries fine but silently failed Node's SRV lookups (needed for Atlas connection strings), even though the OS-level resolver (<code>nslookup</code>) worked. Fixed by explicitly pointing Node's <code>dns</code> module at public resolvers (<code>8.8.8.8</code>, <code>1.1.1.1</code>) before connecting.
</details>

<details>
<summary><strong>Fake "real-time" updates in the original starter</strong></summary>
<br>
The starter simulated random conversation activity that was never actually connected to the database (a destructuring bug pulled from the wrong export). Replaced with genuine MongoDB Change Streams, so updates are only ever broadcast when something <em>actually</em> changed.
</details>

<details>
<summary><strong>Module-load-order bug with Pinecone</strong></summary>
<br>
<code>vectorDbSetup.js</code> read <code>process.env.PINECONE_API_KEY</code> at module-load time, before <code>dotenv.config()</code> had run when starting outside Docker (Docker injects env vars at the container level, masking the issue there). Fixed by loading env vars at the top of that module directly, independent of require order elsewhere.
</details>

<details>
<summary><strong>SSE vs. WebSocket — choosing the right transport for each job</strong></summary>
<br>
WebSocket (bidirectional) drives conversation updates since either side may need to signal; SSE (one-way) drives dashboard metrics since the client only ever receives. Matched the transport to the actual data-flow shape instead of using one mechanism everywhere.
</details>

<details>
<summary><strong>Popover clipped by a stray <code>overflow: auto</code></strong></summary>
<br>
A mobile-responsiveness fix elsewhere accidentally clipped the conversation table's filter popover. Fixed by removing the redundant overflow rule and wrapping the popover in a <code>Portal</code> so it can't be clipped by ancestor layout again.
</details>

<details>
<summary><strong>Port conflict with an unrelated local project</strong></summary>
<br>
Port 3000 was shared with a separate native dev server on the same machine, causing intermittent, hard-to-diagnose responses. Moved the frontend container to port <strong>3001</strong> in <code>docker-compose.yaml</code> to eliminate the conflict entirely.
</details>

---

## Testing

```bash
cd testing
npm install
node test-runner.js
```

---

<div align="center">

**SupportIQ** — built for the humans keeping AI honest.

</div>
