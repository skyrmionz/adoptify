# Adoptify

Adoptify is a diagnostic-led Pocket FDE for Salesforce Agentforce adoption. It helps an admin connect a Salesforce org, scan readiness, identify blockers, choose a first achievable use case, and turn the existing mission curriculum into a personalized activation plan.

## What It Does

- Connects to Salesforce with the OAuth 2.0 Device Flow (the same flow `sf org login device` uses) for production or sandbox orgs — no callback URL or client secret required.
- Encrypts Salesforce access and refresh tokens at rest.
- Runs a best-effort read-only org scan for objects, flows, Apex, Knowledge, Agentforce/bot metadata, permissions, Data Cloud signals, channels, and API limits.
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

`SF_CLIENT_ID` (optional)
: Override the OAuth client id. Defaults to `PlatformCLI` — the same public client id Salesforce CLI uses for `sf org login device` — so no Connected App is required.

`SF_LOGIN_URL` (optional)
: Local override for the OAuth host. Defaults to `login.salesforce.com` for production and `test.salesforce.com` for sandbox based on the button clicked.

## Salesforce auth

Adoptify uses the OAuth 2.0 device flow with the public `PlatformCLI` client id — the same approach as `sf org login device`. There is no Connected App to create and no `client_secret`. Each user clicks Connect, sees a one-time user code, signs into their own Salesforce org at `login.salesforce.com`, and Adoptify stores the resulting tokens against their Adoptify account.

Caveats:

- The Salesforce login screen will show "Salesforce CLI" as the requesting application.
- Some orgs restrict which Connected Apps can request OAuth (permitted apps allowlist, IP restrictions). Users in such orgs may not be able to connect via `PlatformCLI`. To support those users, set `SF_CLIENT_ID` to the consumer key of your own Connected App and configure it as a public client with Device Flow enabled.

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
2. Go to Settings.
3. Connect a Salesforce production org or sandbox.
4. Open Missions -> Pre-Agent Setup -> Org Details.
5. Run Re-scan to generate a fresh org assessment.
6. Review headline metrics, scan confidence, and findings.

## Known Assumptions

- V1 is focused on Agentforce Stage 1-2: discovery through first activation.
- The org scan is read-only and best-effort.
- Some Salesforce setup/tooling objects may be unavailable depending on the connected user's permissions and org edition.
- The latest connected org for a user is treated as the active org.
- Multi-org switching is not fully built yet.

## Troubleshooting

`Salesforce rejected the device flow request`
: The user's org likely blocks the `PlatformCLI` Connected App via a permitted apps allowlist or IP restriction. Either ask their admin to allow it, or set `SF_CLIENT_ID` to a custom Connected App with Device Flow enabled.

Login code expired
: Codes are valid for ~10 minutes. Click Connect again to request a new code.

Org scan looks incomplete
: Check the Scan confidence panel. Blocked probes usually mean the connected Salesforce user lacks access to that metadata object.

Heroku starts but assets are missing
: Confirm `heroku-postbuild` completed and the `Procfile` is using `.next/standalone/server.js`.
