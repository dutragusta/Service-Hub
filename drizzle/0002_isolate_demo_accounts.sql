CREATE TABLE demo_team_access (
  email TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('support', 'admin')),
  invite_hash TEXT,
  expires_at INTEGER
);
--> statement-breakpoint
CREATE TABLE demo_portal_accounts (
  subject TEXT NOT NULL,
  profile TEXT NOT NULL CHECK (profile IN ('colaborador', 'cliente')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (subject, profile)
);
--> statement-breakpoint
CREATE INDEX demo_portal_accounts_by_profile ON demo_portal_accounts (profile, updated_at DESC);
