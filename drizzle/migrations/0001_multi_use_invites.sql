-- Migration: Multi-use invites
-- Invites now stay active until expiration and track usage count

-- Add use_count column
ALTER TABLE invites ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0;

-- Update existing 'pending' status to 'active'
UPDATE invites SET status = 'active' WHERE status = 'pending';

-- Create invite_uses table to track who used each invite
CREATE TABLE invite_uses (
    id TEXT PRIMARY KEY NOT NULL,
    invite_id TEXT NOT NULL REFERENCES invites(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Migrate existing used_by data to invite_uses
INSERT INTO invite_uses (id, invite_id, user_id, used_at)
SELECT
    lower(hex(randomblob(16))),
    id,
    used_by,
    COALESCE(used_at, datetime('now'))
FROM invites
WHERE used_by IS NOT NULL;

-- Update use_count for migrated data
UPDATE invites SET use_count = 1 WHERE used_by IS NOT NULL;

-- Update status for invites that were marked as 'used' - make them active again
UPDATE invites SET status = 'active' WHERE status = 'used';

-- We can't drop columns in SQLite, but the schema will ignore them
-- The used_by and used_at columns will remain but be unused
