import { BackHeader } from '@/components/ui/BackHeader';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

function GoldCheckCircle({ color }: { color: string }) {
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 11-5.93-9.14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ExpertPendingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 120 });
  }, [scale]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const goHome = () => {
    router.replace('/(auth)/welcome' as never);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top', 'bottom']}>
      <BackHeader title="Application Received" onBack={goHome} />

      <View style={styles.body}>
        <Animated.View
          style={[
            styles.checkWrap,
            { backgroundColor: `${theme.gold}18`, borderColor: `${theme.gold}55` },
            checkStyle,
          ]}
        >
          <GoldCheckCircle color={theme.gold} />
        </Animated.View>

        <Text style={[styles.title, { color: theme.text1 }]}>Your application is under review</Text>

        <Text style={[styles.bodyText, { color: theme.text2 }]}>
          Our team is verifying your professional credentials. This usually takes 24 hours. You will receive an
          email when your account is approved.
        </Text>

        <Text style={[styles.subText, { color: theme.text3 }]}>
          Your 90-day free trial begins the moment you are approved.
        </Text>

        <TouchableOpacity
          onPress={goHome}
          activeOpacity={0.88}
          style={[styles.cta, { backgroundColor: theme.teal }]}
          accessibilityRole="button"
          accessibilityLabel="Return to Home"
        >
          <Text style={[styles.ctaText, { color: theme.bg0 }]}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  checkWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 14,
  },
  subText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 32,
  },
  cta: {
    alignSelf: 'stretch',
    maxWidth: 400,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '800' },
});
