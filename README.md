# AI Resume Builder

A fully local AI-powered resume management tool. Store your entire work history, control what's public or private, generate tailored resumes + cover letters + interview prep guides by pasting a job description, and export your profile for LinkedIn or Indeed.

Runs entirely on your machine via Docker + Ollama — no data leaves your system.

---

## Features

### Profile Tab
- **Work Experience** — add jobs with company, title, dates, and location; add unlimited bullet points per job describing your achievements and tasks
- **Per-bullet visibility toggle** — mark individual bullets public or private. **Private bullets are still used by the AI when generating resumes and cover letters**, but will never appear in LinkedIn/Indeed exports
- **Per-job visibility toggle** — same rule: private jobs are available to AI generation but excluded from social media exports
- **Skills** — categorized skill chips with optional proficiency ratings and public/private toggle
- **Education** — degrees and institutions with date ranges and visibility toggle
- **Profile header** — name, title, location, email, phone, LinkedIn URL, website, professional summary
- **Import** — upload a LinkedIn data export ZIP or paste any resume text; AI parses and merges it into your profile
- **Export for LinkedIn / Indeed** — formats your public-only profile data as copy-pasteable text for each platform

### Resume Builder Tab
- Paste any job description along with the company name and job title
- Click **Generate** — the AI will:
  1. Select the 8–12 most relevant bullets from your public experience
  2. Write a tailored, ATS-optimized resume
  3. Write a personalized cover letter
  4. Generate an interview prep guide (skill gaps, likely questions, what to study, questions to ask)
- Results appear in a tabbed view: **Resume | Cover Letter | Interview Prep**
- Each document can be copied to clipboard or downloaded as a `.txt` file
- **Generation history** — past generations are saved and accessible via the History button

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 |
| AI | Ollama (local LLM, default: `llama3.2`) |
| Proxy | nginx (API proxy) + Traefik (homelab routing) |
| Containerization | Docker Compose |

---

## Prerequisites

- Docker and Docker Compose
- Traefik running on the `proxy` Docker network (homelab only — `docker network create proxy`)
- Ollama model pulled (handled by `make setup`)

---

## First-Time Setup

```bash
git clone <repo>
cd ai-resume-builder
cp .env.example .env   # then edit .env — set DEV_PORT, review other values
make setup
```

`make setup` does the following:
1. Creates the `proxy` Docker network if it doesn't exist
2. Generates `.env` from `.env.example` with a random `POSTGRES_PASSWORD` and `JWT_SECRET` if `.env` doesn't exist
3. Starts all containers and waits for Postgres to be healthy
4. Runs database migrations
5. Pulls the default Ollama model (`llama3.2`)

---

## Development (laptop)

```bash
make dev
```

Starts all services in Docker. The frontend is accessible at `http://localhost:${DEV_PORT}` (set `DEV_PORT` in `.env`).

- All services run in containers — no local Node.js needed
- Backend source is volume-mounted so nodemon picks up changes without a rebuild
- Frontend changes require `make frontend` to rebuild the container

---

## Production (homelab)

```bash
make prod
```

Starts all services with `NODE_ENV=production`, skips the dev override file, and routes traffic through Traefik at `https://resume.tyrelparker.dev`.

To deploy after a `git pull`:

```bash
make deploy
```

---

## Makefile Targets

| Target | Description |
|---|---|
| `make setup` | Full first-time bootstrap |
| `make dev` | Start all services for laptop dev, print access URL |
| `make prod` | Start all services for production |
| `make deploy` | `git pull` + prod rebuild (homelab) |
| `make frontend` | Rebuild and restart only the frontend container |
| `make backend` | Rebuild and restart only the backend container |
| `make down` | Stop all services |
| `make logs` | Tail all container logs |
| `make migrate` | Run schema.sql then any pending migrations |
| `make reset-db` | Wipe and recreate the database, re-run setup |
| `make pull-model` | Pull the configured Ollama model |
| `make shell-db` | Open a psql shell into the database |
| `make cleanup` | Stop containers, remove volumes and local images |

---

## Changing the AI Model

The default model is `llama3.2` (3B, fast on laptop). For better quality:

```bash
# Pull a larger model
OLLAMA_MODEL=llama3.1:8b make pull-model

# Set it permanently in .env
OLLAMA_MODEL=llama3.1:8b

# Enable multi-pass agentic parsing for resume import (recommended with larger models)
AGENTIC_PARSE=true
```

---

## Environment Variables

See [.env.example](.env.example) for all variables.

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `resume` | Database user |
| `POSTGRES_PASSWORD` | *(generated)* | Database password |
| `POSTGRES_DB` | `resume` | Database name |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model for generation and parsing |
| `AGENTIC_PARSE` | `false` | Multi-pass resume parsing — enable on homelab with a larger model |
| `DEV_PORT` | — | Laptop only: port to bind the frontend on (`http://localhost:DEV_PORT`) |
| `RESTART_POLICY` | — | Laptop only: set to `no` to prevent containers starting on boot |

---

## Project Structure

```
ai-resume-builder/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── db/
│       │   ├── connection.js
│       │   ├── schema.sql          # baseline schema, run on every migrate
│       │   └── migrations/         # numbered SQL files: 001_description.sql
│       ├── routes/
│       │   ├── profile.js
│       │   ├── jobs.js
│       │   ├── skills.js
│       │   ├── education.js
│       │   ├── generate.js
│       │   ├── import.js
│       │   └── export.js
│       └── services/
│           └── ollama.js
├── frontend/
│   ├── Dockerfile                  # two-stage: Vite build → nginx
│   ├── nginx.conf                  # proxies /api/ → backend internally
│   ├── .env                        # committed — only contains VITE_API_URL=/api
│   └── src/
│       ├── App.jsx
│       ├── api/index.js
│       └── components/
├── docker-compose.yml
├── docker-compose.override.yml     # laptop dev: binds frontend port
├── Makefile
└── .env.example
```

---

## How the AI Generation Works

1. **Bullet selection** — all public bullets are sent to Ollama with the job description; the model returns the 8–12 most relevant IDs
2. **Parallel generation** — three Ollama calls run in parallel: resume, cover letter, interview prep guide
3. **Saved to DB** — each generation is stored so you can retrieve it from the History panel

Generation typically takes **1–3 minutes** depending on hardware and model size.

## How Resume Import Works

**LinkedIn ZIP** — upload your LinkedIn data export. The parser reads `Positions.csv`, `Skills.csv`, `Education.csv`, and `Profile.csv` directly (no AI needed).

**Paste text** — paste any resume or LinkedIn profile text. Ollama parses it into structured data. With `AGENTIC_PARSE=false` (default) a single prompt handles the full text. With `AGENTIC_PARSE=true` a multi-pass approach detects sections then parses each job individually — more accurate with larger models, too slow on 3B.

Imported data is merged non-destructively — existing records are never overwritten, only new ones added.
