-- Role-based routing: ensure profiles.user_type exists and backfill members.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';
UPDATE profiles SET user_type = 'user' WHERE user_type IS NULL;
