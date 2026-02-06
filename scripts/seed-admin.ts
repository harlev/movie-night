// Run with: npx wrangler d1 execute movie-night-db --local --file=scripts/seed-admin.sql

// This script generates the SQL needed to create the first admin user
// You'll need to run the generated SQL manually or use the seed-admin.sql file

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'changeme123'; // Change this!
const ADMIN_NAME = 'Admin';

// Generate a simple ID
function generateId(): string {
	const timestamp = Date.now().toString(36);
	const randomPart = Math.random().toString(36).substring(2, 14);
	return `${timestamp}${randomPart}`;
}

console.log(`
-- Run this SQL to create the first admin user
-- Password: ${ADMIN_PASSWORD} (change it after first login or update the hash below)

-- Note: The password hash below is for "${ADMIN_PASSWORD}"
-- For production, generate a proper hash using the app's password hashing

INSERT INTO users (id, email, password_hash, display_name, role, status, created_at, updated_at)
VALUES (
  '${generateId()}',
  '${ADMIN_EMAIL}',
  -- This is a placeholder - you'll need to generate a real hash
  'PLACEHOLDER_HASH',
  '${ADMIN_NAME}',
  'admin',
  'active',
  datetime('now'),
  datetime('now')
);
`);
