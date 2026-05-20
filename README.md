# Adoptify

Adoptify is a diagnostic-led Pocket FDE for Salesforce Agentforce adoption. It helps an admin connect a Salesforce org, scan readiness, identify blockers, choose a first achievable use case, and turn the existing mission curriculum into a personalized activation plan.

## What It Does

- Reads Salesforce orgs through each user's own coding agent (Claude Code, Cursor, etc.) — Adoptify never holds Salesforce credentials. Each user gets a per-account API token they paste (along with the auto-generated prompt) into their agent; the agent runs `sf` CLI locally and POSTs results back to Adoptify's ingest endpoints.
- Encrypts each user's Adoptify API token at rest with AES-GCM (key derived from `AUTH_SECRET`).
- A best-effort read-only org scan for objects, flows, Apex, Knowledge, Agentforce/bot metadata, permissions, Data Cloud signals, channels, and API limits — produced by the user's agent and validated server-side.
- Shows scan confidence so users can see which probes were exact and which were blocked or unavailable.
- Captures diagnostic intake answers and recommends top first-agent use cases.
- Shows a personalized activation plan before the generic mission curriculum.
- Includes an assistant that can use diagnostic, org scan, mission, and activation-plan context.

## Local Setup

Requirements:

- Node.js 18+; Heroku currently resolves this app to active LTS.
- npm
- PostgreSQL

Install dependencies:

```bash
npm ci
```

Create a local env file:

```bash
cp env.example .env.local
```

Fill in the required environment variables, then run:

```bash
npm run dev
```

The app runs locally at `http://localhost:3000`.

## Required Environment Variables

`DATABASE_URL`
: PostgreSQL connection string. Heroku Postgres sets this automatically when attached.

`AUTH_SECRET`
: 32+ byte random secret used for AES-GCM token encryption and HMAC signing. Generate one with `openssl rand -base64 48`.

`APP_URL`
: Public base URL for the app, for example `http://localhost:3000` locally or `https://<your-heroku-app>.herokuapp.com` in Heroku.

`OPENROUTER_API_KEY`
: OpenRouter API key for assistant responses.

`OPENROUTER_MODEL`
: Model id. The current default is `anthropic/claude-sonnet-4.6`.

No Salesforce environment variables are required. Adoptify never authenticates to Salesforce itself.

## How org access works

1. Each user signs into Adoptify and visits **Settings**. Adoptify mints them an **Adoptify API token** (`adp_…`) and stores its hash + AES-GCM encrypted copy keyed to their account.
2. The user clicks **Copy connect prompt** (or any per-mission "Copy prompt" button). Adoptify generates a fresh markdown prompt with the token embedded and copies it to the clipboard.
3. The user pastes the prompt into a coding agent (Claude Code, Cursor, ChatGPT with shell access, etc.) on a machine that already has `sf` CLI installed and an org logged in (`sf org login web`). The agent runs SOQL/Tooling queries locally, assembles a JSON payload, and POSTs to:
   - `POST /api/ingest/scan` — full org snapshot
   - `POST /api/ingest/verify` — single setup-checklist rule result
   - `POST /api/ingest/knowledge-check` — knowledge source check
4. Adoptify validates the bearer token, scopes the write to the resolved user, stores the snapshot in `org_assessments`, and the page polling `/api/org/scan/latest` (or `/api/progress`) picks up the change automatically.

The user's Salesforce credentials never leave their machine. Adoptify only sees the structured JSON the agent chose to POST.

To rotate a token, click **Regenerate** in Settings — any prompt already pasted into a coding agent will start returning 401, and the user re-copies a fresh prompt.

## Heroku Deployment

This repo includes:

- `next.config.ts` with `output: "standalone"`
- `Procfile` using `node .next/standalone/server.js`
- `heroku-postbuild` that builds Next and copies static/public assets into the standalone output

Typical Heroku setup:

```bash
heroku create <your-heroku-app>
heroku addons:create heroku-postgresql:essential-0 --app <your-heroku-app>
heroku config:set APP_URL=https://<your-heroku-app>.herokuapp.com --app <your-heroku-app>
heroku config:set AUTH_SECRET=<generated-secret> --app <your-heroku-app>
heroku config:set OPENROUTER_API_KEY=<openrouter-key> --app <your-heroku-app>
git push heroku main
```

## Verification

Run:

```bash
npm run lint
npm run build
```

For a production-style local smoke test that matches Heroku's standalone server:

```bash
npm run heroku-postbuild
npm run start
```

After deployment:

1. Sign up or log in.
2. Go to Settings → grab your Adoptify API token if you want to inspect it (the prompt copy buttons embed it automatically).
3. Click **Copy connect prompt** and paste into your coding agent on a machine with `sf` CLI authed to the target org.
4. Wait a few seconds — your synced org appears in Settings and a fresh score lands on Missions → Pre-Agent Setup → Org Details.
5. Open any setup-checklist or knowledge-audit step to use **Copy verify prompt** for finer-grained checks.
6. Review headline metrics, scan confidence, and findings.

## Known Assumptions

- V1 is focused on Agentforce Stage 1-2: discovery through first activation.
- The org scan is read-only and best-effort.
- Some Salesforce setup/tooling objects may be unavailable depending on the connected user's permissions and org edition.
- The latest connected org for a user is treated as the active org.
- Multi-org switching is not fully built yet.

## Troubleshooting

Ingest POST returns 401
: Token has been rotated, or the user copied a stale prompt. Have them open Settings and click any Copy-prompt button to grab a fresh one.

Coding agent hangs on `sf data query`
: Make sure the user has run `sf org login web` and the default-org alias matches the org they want to sync. Have the agent run `sf org display --json` first.

Org scan looks incomplete
: Check the Scan confidence panel. Blocked probes usually mean the user's `sf` CLI auth lacks Tooling API access for that object — the agent will record those as `blocked` but still ingest everything else.

Heroku starts but assets are missing
: Confirm `heroku-postbuild` completed and the `Procfile` is using `.next/standalone/server.js`.
