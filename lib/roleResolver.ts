import { supabase } from './supabase';

export type UserRole = 'user';

export function isExpertRole(_userType?: string | null): boolean {
  return false;
}

export async function resolveUserRole(_userId: string): Promise<UserRole> {
  return 'user';
}
