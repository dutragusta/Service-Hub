CREATE TABLE portal_accounts (
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
CREATE INDEX portal_accounts_by_profile ON portal_accounts (profile, updated_at DESC);
