# Adoptify

Adoptify is a diagnostic-led Pocket FDE for Salesforce Agentforce adoption. It helps an admin connect a Salesforce org, scan readiness, identify blockers, choose a first achievable use case, and turn the existing mission curriculum into a personalized activation plan.

## What It Does

- Connects to Salesforce with OAuth Web Server Flow for production or sandbox orgs.
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

`SF_CLIENT_ID`
: Salesforce Connected App Consumer Key.

`SF_CLIENT_SECRET`
: Salesforce Connected App Consumer Secret.

`SF_REDIRECT_URI`
: OAuth callback URL. Must exactly match the Salesforce Connected App callback, for example `https://<your-heroku-app>.herokuapp.com/api/oauth/callback`.

`SF_LOGIN_URL`
: Optional local override. OAuth start routes use `login.salesforce.com` for production and `test.salesforce.com` for sandbox based on the button clicked.

## Salesforce Connected App

Use one Adoptify-owned Salesforce Connected App. End users should not create their own Connected App.

Required settings:

- Callback URL: `https://<your-heroku-app>.herokuapp.com/api/oauth/callback`
- OAuth scopes: `api`, `refresh_token`, `openid`
- IP Relaxation: `Relax IP restrictions`

Do not request broad scopes such as `full`, `write`, `chatter_api`, or `custom_permissions`.

Users still need to approve OAuth for their Salesforce org. The app requests `prompt=login` so they can choose a different org instead of silently reusing a prior Salesforce browser session.

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
heroku config:set SF_REDIRECT_URI=https://<your-heroku-app>.herokuapp.com/api/oauth/callback --app <your-heroku-app>
heroku config:set AUTH_SECRET=<generated-secret> --app <your-heroku-app>
heroku config:set OPENROUTER_API_KEY=<openrouter-key> --app <your-heroku-app>
heroku config:set SF_CLIENT_ID=<salesforce-consumer-key> --app <your-heroku-app>
heroku config:set SF_CLIENT_SECRET=<salesforce-consumer-secret> --app <your-heroku-app>
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

`Adoptify OAuth is not configured yet`
: Set `SF_CLIENT_ID` and `SF_CLIENT_SECRET` in Heroku.

`redirect_uri_mismatch`
: Ensure `SF_REDIRECT_URI` exactly matches the Salesforce Connected App callback URL. Include `/api/oauth/callback` and use the deployed app host.

Salesforce reconnects the same org
: The app now sends `prompt=login`. If Salesforce still reuses a browser session, try an incognito window.

Org scan looks incomplete
: Check the Scan confidence panel. Blocked probes usually mean the connected Salesforce user lacks access to that metadata object.

Heroku starts but assets are missing
: Confirm `heroku-postbuild` completed and the `Procfile` is using `.next/standalone/server.js`.
