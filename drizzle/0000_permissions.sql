CREATE TABLE team_access (
  email TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('support', 'admin')),
  invite_hash TEXT,
  expires_at INTEGER
);
