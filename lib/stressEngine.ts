import { supabase } from '@/lib/supabase';

export interface StressInputs {
  moodRating: number;      // 1–10, higher = calmer
  moodTags: string[];
  symptoms: string[];
}

export interface StressLevel {
  level: string;
  color: string;
  description: string;
}

export function calculateStressScore(inputs: StressInputs): number {
  const moodScore = (10 - inputs.moodRating) * 10;

  const anxiousTags = ['anxious', 'overwhelmed', 'sad', 'stressed', 'tired'];
  const tagScore = inputs.moodTags.filter(t =>
    anxiousTags.includes(t.toLowerCase())
  ).length * 15;

  const symptomScore = inputs.symptoms.length * 10;

  const raw = (moodScore * 0.5) + (tagScore * 0.3) + (symptomScore * 0.2);
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function getStressLevel(score: number): StressLevel {
  if (score <= 30) return { level: 'Calm', color: '#2ED573', description: 'You are in a good state' };
  if (score <= 60) return { level: 'Mild Stress', color: '#C9A84C', description: 'Some tension present' };
  if (score <= 80) return { level: 'High Stress', color: '#FF6B35', description: 'Your system needs support' };
  return { level: 'Critical', color: '#FF4757', description: 'Immediate intervention recommended' };
}

export function prescribeExercise(score: number, timeOfDay: number): string {
  if (score >= 81) return 'box-breathing';
  if (score >= 61) return '4-7-8';
  if (score >= 31) return 'coherent';
  if (timeOfDay >= 20 || timeOfDay < 6) return 'diaphragmatic';
  if (timeOfDay >= 6 && timeOfDay < 10) return 'kapalbhati';
  return 'mindful';
}

export function prescriptionReason(score: number, exerciseName: string): string {
  if (score >= 81) {
    return `Based on your inputs, we recommend ${exerciseName} for this session.`;
  }
  if (score >= 61) {
    return `Based on your inputs, ${exerciseName} is recommended for your session.`;
  }
  if (score >= 31) {
    return `Based on your inputs, ${exerciseName} is a good choice for your session.`;
  }
  return `Based on your inputs, ${exerciseName} will complement your current state.`;
}

export async function saveStressCheckin(
  userId: string,
  inputs: StressInputs,
  score: number,
  source: 'manual' | 'auto' | 'panic' = 'manual'
): Promise<void> {
  try {
    await supabase.from('stress_history').insert({
      user_id: userId,
      stress_score: score,
      mood_rating: inputs.moodRating,
      mood_tags: inputs.moodTags,
      symptoms: inputs.symptoms,
      source,
    });
  } catch {
    // Graceful no-op if table does not exist yet
  }
}

export async function loadRecentStress(
  userId: string,
  days = 7
): Promise<Array<{ stress_score: number; created_at: string }>> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await supabase
      .from('stress_history')
      .select('stress_score, created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });
    return (data as Array<{ stress_score: number; created_at: string }> | null) ?? [];
  } catch {
    return [];
  }
}
