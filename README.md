# Quanta Learn — Backend

Matches the stack from the SIH pitch deck: Node + Express, PostgreSQL (Supabase), JWT auth, and Bloch (LLM-powered AI tutor).

## Setup

```
npm install
cp .env.example .env
```

Fill in `.env`:
- `DATABASE_URL` — get this from Supabase: **Project Settings → Database → Connection string (URI)**
- `JWT_SECRET` — any random long string
- `ANTHROPIC_API_KEY` — optional, only needed for Bloch (the AI tutor) to work

Run it:
```
node server.js
```
The database tables are created automatically on first run — no manual SQL needed.

## API Routes

### Auth
- `POST /api/auth/signup` — `{ name, email, password }` → returns `{ token, user }`
- `POST /api/auth/login` — `{ email, password }` → returns `{ token, user }`

Send the token on every request after that:
```
Authorization: Bearer <token>
```

### Lessons
- `GET /api/lessons` — the learning map (all 16 chapters)
- `GET /api/lessons/:id` — one lesson's challenges (no answers leaked)

### Challenges (requires auth)
- `POST /api/challenges/:id/submit` — `{ circuit? , answer?, hints_used }` → grades it, saves XP to Postgres
- `GET /api/users/me/progress` — your XP, level, and completed lessons

### Circuit sandbox (no auth needed)
- `POST /api/circuit/run` — `{ qubits, ops, shots? }` → run any circuit, get probabilities

### Bloch, the AI tutor
- `POST /api/bloch/ask` — `{ message, context? }` → returns `{ reply }`
  Needs `ANTHROPIC_API_KEY` set. Bloch is instructed to nudge with questions/analogies, never hand out direct answers — matching the pitch deck.

## What's inside
- `lib/quantumSim.js` — statevector simulator (X, H, Z, CNOT), up to 3 qubits
- `lib/grading.js` — 3 grading types: exact answer / circuit structure / probability-range
- `lib/db.js` — Postgres connection + auto schema creation
- `lib/auth.js` — JWT signing + auth middleware
- `data/lessons.json` — all 16 chapters, seeded and tested

## Deploying
1. Push to GitHub (already done)
2. Import into Vercel
3. In Vercel: **Project Settings → Environment Variables** — add `DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`
4. Redeploy
