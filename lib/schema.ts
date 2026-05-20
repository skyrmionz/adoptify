// All table DDL in one place. Idempotent. Called by lib/db.ts on first query.
export const ensureSchemaSql = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          TEXT UNIQUE NOT NULL,
    name           TEXT,
    password_hash  BYTEA,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash BYTEA;

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS salesforce_connections (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instance_url       TEXT NOT NULL,
    org_id             TEXT NOT NULL,
    org_name           TEXT,
    is_sandbox         BOOLEAN NOT NULL DEFAULT FALSE,
    last_scanned_at    TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, org_id)
  );
  ALTER TABLE salesforce_connections DROP COLUMN IF EXISTS access_token_enc;
  ALTER TABLE salesforce_connections DROP COLUMN IF EXISTS refresh_token_enc;
  ALTER TABLE salesforce_connections DROP COLUMN IF EXISTS access_token_issued_at;
  ALTER TABLE salesforce_connections DROP COLUMN IF EXISTS access_token_expires_at;
  ALTER TABLE salesforce_connections DROP COLUMN IF EXISTS disconnected_at;

  CREATE TABLE IF NOT EXISTS api_tokens (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    token_hash  BYTEA NOT NULL,
    token_enc   BYTEA NOT NULL,
    last_four   TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
  );
  ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS token_enc BYTEA;
  CREATE INDEX IF NOT EXISTS api_tokens_hash_idx ON api_tokens(token_hash);

  CREATE TABLE IF NOT EXISTS mission_progress (
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id    TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'in_progress',
    completed_at  TIMESTAMPTZ,
    evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, mission_id)
  );

  CREATE TABLE IF NOT EXISTS org_assessments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id  UUID NOT NULL REFERENCES salesforce_connections(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scanned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snapshot_json  JSONB NOT NULL,
    score          INT,
    findings_json  JSONB
  );
  CREATE INDEX IF NOT EXISTS org_assessments_user_idx ON org_assessments(user_id, scanned_at DESC);

  CREATE TABLE IF NOT EXISTS org_diagnostics (
    user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    answers_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
    blockers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS recommended_use_cases (
    user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    items_json    JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS selected_use_cases (
    user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    use_case_json JSONB NOT NULL,
    stage         TEXT NOT NULL DEFAULT 'agents_created',
    selected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,
    content     JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id, created_at);
`;
