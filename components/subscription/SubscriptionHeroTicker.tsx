import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

const GOLD = '#C9A84C';

/** Messages shown above the founder-slots urgency bar. */
export const SUBSCRIPTION_HERO_TICKER_MESSAGES = [
  'Checked against global safety databases',
  'Built with love for the people you protect most',
  'Trusted by families who want real answers',
] as const;

type SubscriptionHeroTickerProps = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * Always-visible ticker row above the founder-slots urgency bar.
 * Rotates copy every 3.2s with plain Text only — no opacity animation,
 * so messages never disappear after the first cycle.
 */
export function SubscriptionHeroTicker({ style, textStyle }: SubscriptionHeroTickerProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % SUBSCRIPTION_HERO_TICKER_MESSAGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.row, style]} accessibilityLiveRegion="polite">
      <Text style={[styles.text, textStyle]} numberOfLines={2}>
        <Text style={styles.bullet}>● </Text>
        {SUBSCRIPTION_HERO_TICKER_MESSAGES[idx]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 11,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  bullet: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(240,244,255,0.88)',
    textAlign: 'center',
    lineHeight: 17,
    letterSpacing: 0.2,
  },
});
