import { WaterSplashEffect } from '@/components/ui/RewardAnimation';
import { hapticLight } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { loadWellnessPrefs } from '@/lib/wellnessPrefs';
import { playGulpSound, playHydrationSound, type HydrationSoundId } from '@/lib/wellnessSound';
import { useAuthStore } from '@/stores/authStore';
import { triggerXpGained } from '@/stores/rewardAnimStore';
import { useTheme } from '@/theme/ThemeContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WaterGlass } from './WaterGlass';

interface Props {
  initialCups?: number;
  wellnessId?: string;
  /** Max cups in the row. Defaults to 8 (recommended daily intake). */
  goalCups?: number;
  /** Fires after every tap with the latest cup count — parent should use this
   *  to keep the card header in sync without waiting for a DB roundtrip. */
  onChange?: (cups: number) => void;
}

/**
 * Row of realistic animated water glasses. Each glass fills/empties with a
 * gentle wave + bubbles when tapped. State is updated optimistically so the
 * UI stays perfectly in sync; the DB write fires in the background.
 */
export function WaterCupGrid({ initialCups = 0, wellnessId, goalCups = 8, onChange }: Props) {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);

  const [filled, setFilled] = useState<boolean[]>(() =>
    Array.from({ length: goalCups }, (_, i) => i < initialCups)
  );
  const [splashActive, setSplashActive] = useState(false);

  // Row width drives the per-cup sizing so we always fit exactly `goalCups`
  // glasses on a single line no matter how wide the card is (handles phones,
  // landscape, tablets, and the odd narrow modal without wrapping).
  const [rowWidth, setRowWidth] = useState(0);
  const onRowLayout = (e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width);

  // Math: within the row we have goalCups slots separated by 4px gaps. Each
  // slot has 4px internal padding on each side (see styles.cupBtn), so the
  // actual glass drawing area is `slot - 8`. We also clamp width so glasses
  // never become silly-small on very narrow screens, and preserve the
  // 40:56 aspect ratio from WaterGlass.
  const GAP = 4;
  const slotWidth = rowWidth > 0
    ? Math.max(18, (rowWidth - GAP * (goalCups - 1)) / goalCups)
    : 36;
  const glassWidth  = Math.max(14, slotWidth - 8);
  const glassHeight = Math.round(glassWidth * (56 / 40));

  // Keep internal state in sync when the caller loads new initial data
  // (e.g. `today` rollover triggers a React key remount but we also guard
  // here for the in-place case).
  useEffect(() => {
    setFilled(Array.from({ length: goalCups }, (_, i) => i < initialCups));
  }, [goalCups, initialCups]);

  // Cache the user's hydration sound choice so we don't re-query on each tap.
  const soundRef = useRef<HydrationSoundId>('water_drop');
  useEffect(() => {
    if (!userId) return;
    void loadWellnessPrefs(userId).then((prefs) => {
      soundRef.current = prefs.hydration_reminder_sound;
    });
  }, [userId]);

  const handlePress = useCallback(
    async (index: number) => {
      const next = [...filled];
      const wasEmpty = !next[index];
      next[index] = !next[index];
      setFilled(next);

      const cups = next.filter(Boolean).length;
      onChange?.(cups);

      hapticLight();

      // ASMR gulp on EVERY tap (fill or empty) for the reliable dopamine hit
      // the user asked for. No-ops cleanly if the gulp asset isn't wired up.
      void playGulpSound();

      if (wasEmpty) {
        setSplashActive(true);
        triggerXpGained(5);
        // Additional layered reward sound only when filling a new cup.
        void playHydrationSound(soundRef.current);
      }

      if (userId) {
        await supabase
          .from('user_wellness')
          .update({ daily_water_cups: cups })
          .eq('user_id', userId);
      }

      void wellnessId;
    },
    [filled, onChange, userId, wellnessId]
  );

  return (
    <View style={styles.container}>
      <View style={styles.splashAnchor}>
        <WaterSplashEffect
          active={splashActive}
          onDone={() => setSplashActive(false)}
        />
      </View>
      <View style={styles.row} onLayout={onRowLayout}>
        {filled.map((isFilled, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => void handlePress(i)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={isFilled ? `Cup ${i + 1}, filled. Tap to empty.` : `Cup ${i + 1}, empty. Tap to log.`}
            style={[styles.cupBtn, { width: slotWidth }]}
          >
            <WaterGlass
              filled={isFilled}
              width={glassWidth}
              height={glassHeight}
              accentColor={theme.teal}
              glassColor="rgba(255,255,255,0.18)"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', paddingVertical: 4 },
  splashAnchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 50,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  cupBtn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 2,
  },
});
