/**
 * Chat history persistence helpers (premium feature).
 *
 * Wraps the `ai_chat_sessions` and `ai_chat_messages` tables. RLS on both
 * tables restricts rows to the authenticated user; the functions here never
 * accept a user_id — we always read the id from the current auth session.
 */

import type { Message } from '@/components/assistant/AIMessageBubble';
import { supabase } from './supabase';

export interface ChatSession {
  id: string;
  title: string;
  last_message_preview: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface DbMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  document_name: string | null;
  document_size_kb: number | null;
  created_at: string;
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('You need to be signed in to use chat history.');
  return id;
}

/** Create a brand new empty session for the current user. */
export async function createChatSession(): Promise<ChatSession> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert({ user_id: userId })
    .select('id, title, last_message_preview, message_count, created_at, updated_at')
    .single();
  if (error) throw new Error(error.message);
  return data as ChatSession;
}

/** List the current user's sessions, most recent first. */
export async function listChatSessions(limit: number = 50): Promise<ChatSession[]> {
  await requireUserId();
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('id, title, last_message_preview, message_count, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatSession[];
}

/** Rename a session. */
export async function renameChatSession(sessionId: string, title: string): Promise<void> {
  const trimmed = title.trim().slice(0, 80);
  if (trimmed.length === 0) throw new Error('Title cannot be empty.');
  const { error } = await supabase
    .from('ai_chat_sessions')
    .update({ title: trimmed })
    .eq('id', sessionId);
  if (error) throw new Error(error.message);
}

/** Delete a session (cascades to messages). */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_sessions')
    .delete()
    .eq('id', sessionId);
  if (error) throw new Error(error.message);
}

/** Load all messages for a given session, oldest first. */
export async function loadChatMessages(sessionId: string): Promise<Message[]> {
  await requireUserId();
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('id, session_id, role, content, document_name, document_size_kb, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DbMessageRow[];
  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content,
    created_at: r.created_at,
    ...(r.document_name ? { documentName: r.document_name } : {}),
    ...(r.document_size_kb != null ? { documentSizeKb: r.document_size_kb } : {}),
  }));
}

export interface PersistMessageInput {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  documentName?: string;
  documentSizeKb?: number;
}

/**
 * Persist a single message. The DB trigger updates the session's
 * updated_at / last_message_preview / message_count / title automatically.
 */
export async function persistChatMessage(input: PersistMessageInput): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('ai_chat_messages').insert({
    session_id: input.sessionId,
    user_id: userId,
    role: input.role,
    content: input.content,
    document_name: input.documentName ?? null,
    document_size_kb: input.documentSizeKb ?? null,
  });
  if (error) {
    // Non-fatal: log and swallow so the chat doesn't break if the tables
    // aren't migrated yet in a given environment.
    if (__DEV__) console.log('[chat-history] persistChatMessage failed:', error.message);
  }
}

/** Human-readable relative label for a session's updated_at. */
export function formatSessionWhen(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
