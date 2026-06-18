-- AI chat history for premium / pro users.
-- Two tables:
--   ai_chat_sessions  — a single conversation thread
--   ai_chat_messages  — the messages inside a session
-- Both are strictly owned by the authenticated user via user_id.
--
-- Note: we don't enforce the subscription tier in the database. The client
-- gates on tier, and the tables themselves only require the user to own the
-- rows. This keeps the RLS simple and avoids coupling storage to billing.

-- ── ai_chat_sessions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  last_message_preview text,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_chat_sessions_user_updated_idx
  ON ai_chat_sessions (user_id, updated_at DESC);

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_chat_sessions" ON ai_chat_sessions;
CREATE POLICY "users_select_own_chat_sessions"
  ON ai_chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_chat_sessions" ON ai_chat_sessions;
CREATE POLICY "users_insert_own_chat_sessions"
  ON ai_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_chat_sessions" ON ai_chat_sessions;
CREATE POLICY "users_update_own_chat_sessions"
  ON ai_chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_chat_sessions" ON ai_chat_sessions;
CREATE POLICY "users_delete_own_chat_sessions"
  ON ai_chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ── ai_chat_messages ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  specialist_recommendation jsonb,
  specialty_suggestion jsonb,
  document_name text,
  document_size_kb integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_chat_messages_session_created_idx
  ON ai_chat_messages (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS ai_chat_messages_user_created_idx
  ON ai_chat_messages (user_id, created_at DESC);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_chat_messages" ON ai_chat_messages;
CREATE POLICY "users_select_own_chat_messages"
  ON ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_chat_messages" ON ai_chat_messages;
CREATE POLICY "users_insert_own_chat_messages"
  ON ai_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_chat_messages" ON ai_chat_messages;
CREATE POLICY "users_update_own_chat_messages"
  ON ai_chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_chat_messages" ON ai_chat_messages;
CREATE POLICY "users_delete_own_chat_messages"
  ON ai_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ── Trigger: keep session.updated_at + last_message_preview + message_count
-- in sync as messages are inserted ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_chat_session_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ai_chat_sessions
  SET
    updated_at = now(),
    message_count = message_count + 1,
    last_message_preview = CASE
      WHEN NEW.role = 'user' THEN substring(NEW.content from 1 for 140)
      ELSE coalesce(last_message_preview, substring(NEW.content from 1 for 140))
    END,
    -- Auto-title: if the session is still the default "New conversation" and
    -- this is the FIRST user message, use a trimmed copy as the title.
    title = CASE
      WHEN NEW.role = 'user'
        AND ai_chat_sessions.title = 'New conversation'
        AND ai_chat_sessions.message_count = 0
      THEN substring(NEW.content from 1 for 60)
      ELSE ai_chat_sessions.title
    END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_chat_messages_after_insert ON ai_chat_messages;
CREATE TRIGGER ai_chat_messages_after_insert
  AFTER INSERT ON ai_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_on_message();
