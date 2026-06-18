import { router } from 'expo-router';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TRUWELL_LOGO } from '@/lib/brandAssets';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';

const FONTS = {
  extrabold: 'Montserrat_700Bold',
  bold: 'Montserrat_700Bold',
  regular: 'Inter_400Regular',
} as const;

type Props = {
  error: unknown;
  retry: () => void;
};

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function stackFromError(error: unknown): string | undefined {
  if (error instanceof Error && error.stack) return error.stack;
  return undefined;
}

function restartToOnboarding(): void {
  try {
    router.replace(ONBOARDING_ROUTES.welcome);
  } catch {
    router.replace('/(auth)/welcome' as never);
  }
}

/**
 * Replaces expo-router's default ErrorBoundary, which calls `use(BottomTabBarHeightContext)` and can
 * misbehave when the error happens outside the tab navigator.
 */
export function TruWellErrorBoundary({ error, retry }: Props) {
  const message = messageFromError(error);
  const stack = stackFromError(error);

  return (
    <SafeAreaView style={styles.safe}>
      <Image source={TRUWELL_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="TruWell AI" />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>
        TruWell AI encountered an error. Tap below to restart.
      </Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => {
          retry();
          restartToOnboarding();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Restart TruWell</Text>
      </TouchableOpacity>
      {__DEV__ ? (
        <ScrollView style={styles.devScroll} contentContainerStyle={styles.devScrollContent}>
          <Text style={styles.devMessage} selectable>
            {message}
          </Text>
          {stack ? (
            <Text style={styles.devStack} selectable>
              {stack}
            </Text>
          ) : null}
          <Pressable style={styles.secondaryBtn} onPress={() => void retry()}>
            <Text style={styles.secondaryBtnText}>Retry without navigation</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020B14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.extrabold,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#00A878',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
  },
  primaryBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  devScroll: {
    maxHeight: 200,
    width: '100%',
    marginTop: 24,
  },
  devScrollContent: {
    paddingBottom: 8,
  },
  devMessage: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginBottom: 8,
  },
  devStack: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'left',
  },
  secondaryBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    color: '#5ee6d0',
    fontSize: 12,
    fontWeight: '600',
  },
});

type RootBoundaryState = { hasError: boolean; error: unknown };

/** Catches render errors in the tree so the app shows recovery UI instead of a native crash. */
export class RootErrorBoundary extends Component<{ children: ReactNode }, RootBoundaryState> {
  state: RootBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): RootBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    if (__DEV__) console.error('[TruWell] RootErrorBoundary', error, info.componentStack);
  }

  retry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleRestart = (): void => {
    this.retry();
    restartToOnboarding();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <TruWellErrorBoundary error={this.state.error} retry={this.handleRestart} />
      );
    }
    return this.props.children;
  }
}
