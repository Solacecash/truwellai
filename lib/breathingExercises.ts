import type { BreathExercise } from '@/stores/breathingStore';

export const BREATHING_EXERCISES: BreathExercise[] = [
  // ── CALM & RELAX (Green) ────────────────────────────────────────────
  {
    id: '4-7-8',
    name: '4-7-8 Breathing',
    category: 'calm',
    categoryLabel: 'Calm & Relax',
    categoryColor: '#2ED573',
    description: 'Ancient pranayama technique for rapid calm',
    benefit: 'Activates parasympathetic nervous system in under 2 minutes',
    inhale: 4, hold1: 7, exhale: 8, hold2: 0,
    totalCycles: 4,
    isPro: false,
    visualType: 'lungs',
    coachingCues: {
      inhale: 'Breathe in slowly through your nose...',
      hold: 'Hold gently... feel the stillness...',
      exhale: 'Exhale completely through your mouth...',
      complete: 'Your nervous system is resetting. Beautiful work.',
    },
  },
  {
    id: 'bhramari',
    name: 'Bhramari',
    category: 'calm',
    categoryLabel: 'Calm & Relax',
    categoryColor: '#2ED573',
    description: 'Humming bee breath for deep mental calm',
    benefit: 'Reduces anxiety and quiets mental noise instantly',
    inhale: 4, hold1: 0, exhale: 6, hold2: 0,
    totalCycles: 6,
    isPro: false,
    visualType: 'orb',
    coachingCues: {
      inhale: 'Inhale deeply through your nose...',
      hold: '',
      exhale: 'Exhale with a gentle humming sound... mmmm...',
      complete: 'Your mind is quieter now. Notice the silence.',
    },
  },
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    category: 'calm',
    categoryLabel: 'Calm & Relax',
    categoryColor: '#2ED573',
    description: 'Navy SEAL tactical breathing for instant control',
    benefit: 'Used by elite military to perform under extreme pressure',
    inhale: 4, hold1: 4, exhale: 4, hold2: 4,
    totalCycles: 5,
    isPro: false,
    visualType: 'military',
    militaryRank: 'What rank did you achieve?',
    coachingCues: {
      inhale: 'Breathe in... 2... 3... 4...',
      hold: 'Hold... steady... stay in control...',
      exhale: 'Release... 2... 3... 4...',
      complete: 'Outstanding. You just controlled your nervous system like an operator.',
    },
  },

  // ── FOCUS & PRODUCTIVITY (Blue) ─────────────────────────────────────
  {
    id: 'ujjayi',
    name: 'Ujjayi',
    category: 'focus',
    categoryLabel: 'Focus & Productivity',
    categoryColor: '#1E90FF',
    description: 'Ocean breath for sharp mental clarity',
    benefit: 'Increases focus and builds internal heat',
    inhale: 5, hold1: 0, exhale: 5, hold2: 0,
    totalCycles: 8,
    isPro: false,
    visualType: 'orb',
    coachingCues: {
      inhale: 'Inhale through the back of your throat... hear the ocean...',
      hold: '',
      exhale: 'Exhale through the throat... Darth Vader breath...',
      complete: 'Your focus is sharp. Your mind is clear.',
    },
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    category: 'focus',
    categoryLabel: 'Focus & Productivity',
    categoryColor: '#1E90FF',
    description: '5 breaths per minute for peak cognitive function',
    benefit: 'Maximizes heart rate variability and mental performance',
    inhale: 6, hold1: 0, exhale: 6, hold2: 0,
    totalCycles: 10,
    isPro: false,
    visualType: 'ring',
    coachingCues: {
      inhale: 'Slow and steady inhale... 6 full seconds...',
      hold: '',
      exhale: 'Slow exhale... match the inhale perfectly...',
      complete: 'Your heart and brain are synchronized. Peak state achieved.',
    },
  },
  {
    id: 'mindful',
    name: 'Mindful Breathing',
    category: 'focus',
    categoryLabel: 'Focus & Productivity',
    categoryColor: '#1E90FF',
    description: 'Present-moment awareness through conscious breath',
    benefit: 'Resets attention and reduces mind wandering',
    inhale: 4, hold1: 1, exhale: 4, hold2: 1,
    totalCycles: 8,
    isPro: false,
    visualType: 'pin',
    coachingCues: {
      inhale: 'Notice the breath entering... feel it...',
      hold: 'Pause here... observe...',
      exhale: 'Let it go... completely...',
      complete: 'You are fully present. That is where your power is.',
    },
  },

  // ── ENERGY & PERFORMANCE (Red) ──────────────────────────────────────
  {
    id: 'wim-hof',
    name: 'Wim Hof Method',
    category: 'energy',
    categoryLabel: 'Energy & Performance',
    categoryColor: '#FF4757',
    description: 'Controlled hyperventilation for superhuman energy',
    benefit: 'Increases adrenaline, reduces inflammation, boosts immunity',
    inhale: 2, hold1: 0, exhale: 1, hold2: 0,
    totalCycles: 30,
    isPro: false,
    visualType: 'orb',
    coachingCues: {
      inhale: 'Power inhale... fully in...',
      hold: '',
      exhale: 'Let go... do not force...',
      complete: 'You just flooded your body with oxygen. Feel the electricity.',
    },
  },
  {
    id: 'kapalbhati',
    name: 'Kapalbhati',
    category: 'energy',
    categoryLabel: 'Energy & Performance',
    categoryColor: '#FF4757',
    description: 'Skull-shining breath for explosive mental energy',
    benefit: 'Detoxifies, energizes, and activates the prefrontal cortex',
    inhale: 1, hold1: 0, exhale: 1, hold2: 0,
    totalCycles: 40,
    isPro: false,
    visualType: 'lungs',
    coachingCues: {
      inhale: 'Passive inhale...',
      hold: '',
      exhale: 'Sharp forceful exhale from the belly...',
      complete: 'Your brain is lit up. Your body is awake.',
    },
  },
  {
    id: 'power',
    name: 'Power Breathing',
    category: 'energy',
    categoryLabel: 'Energy & Performance',
    categoryColor: '#FF4757',
    description: 'Athletic performance breathing for peak output',
    benefit: 'Pre-workout oxygen loading for maximum performance',
    inhale: 3, hold1: 2, exhale: 3, hold2: 0,
    totalCycles: 10,
    isPro: false,
    visualType: 'military',
    militaryRank: 'What combat rank did you earn?',
    coachingCues: {
      inhale: 'Load up... full breath...',
      hold: 'Compress... hold the power...',
      exhale: 'Release with control...',
      complete: 'You are primed and ready for anything.',
    },
  },

  // ── RECOVERY & HEALING (Purple) ─────────────────────────────────────
  {
    id: 'diaphragmatic',
    name: 'Diaphragmatic',
    category: 'recovery',
    categoryLabel: 'Recovery & Healing',
    categoryColor: '#9B59B6',
    description: 'Deep belly breathing for full recovery',
    benefit: 'Activates vagus nerve and promotes cellular repair',
    inhale: 5, hold1: 0, exhale: 7, hold2: 0,
    totalCycles: 8,
    isPro: false,
    visualType: 'lungs',
    coachingCues: {
      inhale: 'Let your belly rise... not your chest...',
      hold: '',
      exhale: 'Slowly empty from the bottom up...',
      complete: 'Your body is healing. Your vagus nerve is active.',
    },
  },
  {
    id: 'buteyko',
    name: 'Buteyko',
    category: 'recovery',
    categoryLabel: 'Recovery & Healing',
    categoryColor: '#9B59B6',
    description: 'Reduced breathing for oxygen optimization',
    benefit: 'Improves CO2 tolerance and reduces over-breathing',
    inhale: 3, hold1: 0, exhale: 5, hold2: 10,
    totalCycles: 6,
    isPro: false,
    visualType: 'pin',
    coachingCues: {
      inhale: 'Small breath in... less than you want...',
      hold: '',
      exhale: 'Slow exhale... let it be natural...',
      complete: 'Excellent. Your CO2 tolerance is building.',
    },
  },
  {
    id: 'somatic',
    name: 'Somatic Breathing',
    category: 'recovery',
    categoryLabel: 'Recovery & Healing',
    categoryColor: '#9B59B6',
    description: 'Body-centered breath for trauma and tension release',
    benefit: 'Releases stored tension and regulates the nervous system',
    inhale: 4, hold1: 2, exhale: 6, hold2: 0,
    totalCycles: 8,
    isPro: false,
    visualType: 'orb',
    coachingCues: {
      inhale: 'Breathe into any tension you feel...',
      hold: 'Stay with it... feel it softening...',
      exhale: 'Release the tension with the breath...',
      complete: 'Your body has released. Notice what shifted.',
    },
  },
];

export interface MilitaryRank {
  minPoints: number;
  rank: string;
  icon: string;
  description: string;
}

export const MILITARY_RANKS: MilitaryRank[] = [
  { minPoints: 0,    rank: 'Recruit',    icon: 'shield',      description: 'Just beginning your training' },
  { minPoints: 100,  rank: 'Private',    icon: 'star',        description: 'Showing up consistently' },
  { minPoints: 300,  rank: 'Corporal',   icon: 'star-outline',description: 'Building real discipline' },
  { minPoints: 600,  rank: 'Sergeant',   icon: 'medal',       description: 'Leading your nervous system' },
  { minPoints: 1000, rank: 'Lieutenant', icon: 'ribbon',      description: 'Tactical breathing mastery' },
  { minPoints: 1500, rank: 'Captain',    icon: 'trophy',      description: 'Elite stress controller' },
  { minPoints: 2200, rank: 'Major',      icon: 'medal-outline',description: 'Advanced operator level' },
  { minPoints: 3000, rank: 'Colonel',    icon: 'flash',       description: 'Nervous system commander' },
  { minPoints: 4000, rank: 'General',    icon: 'diamond',     description: 'Supreme breath master' },
  { minPoints: 6000, rank: 'Legend',     icon: 'crown',       description: 'TruWell Breathing Legend' },
];

export function getRankForPoints(points: number): MilitaryRank {
  return MILITARY_RANKS.slice().reverse().find(r => points >= r.minPoints) ?? MILITARY_RANKS[0];
}

export function getNextRank(points: number): MilitaryRank | null {
  return MILITARY_RANKS.find(r => r.minPoints > points) ?? null;
}

export function getExerciseById(id: string): BreathExercise | undefined {
  return BREATHING_EXERCISES.find(ex => ex.id === id);
}

export function getDurationSeconds(ex: BreathExercise): number {
  return (ex.inhale + ex.hold1 + ex.exhale + ex.hold2) * ex.totalCycles;
}

export function formatDuration(ex: BreathExercise): string {
  const s = getDurationSeconds(ex);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  return `${m} min`;
}
