import { supabase } from '@/lib/supabase';

export type IntelligenceSourceRow = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  url: string | null;
};

export async function fetchIntelligenceSourcesFromDb(): Promise<IntelligenceSourceRow[]> {
  const { data, error } = await supabase
    .from('health_intelligence_sources')
    .select('id, title, category, description, url')
    .eq('is_active', true)
    .order('category');

  if (error) throw new Error(error.message);
  return (data ?? []) as IntelligenceSourceRow[];
}
