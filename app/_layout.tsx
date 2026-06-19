import 'react-native-gesture-handler';
import '@/lib/i18n';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

// Clash Display + Cabinet Grotesk (Fontshare).
// Download the OTF/TTF files from https://www.fontshare.com/fonts/clash-display
// and https://www.fontshare.com/fonts/cabinet-grotesk, then place them in
// assets/fonts/ with these exact names:
//   ClashDisplay-Semibold.otf   ClashDisplay-Bold.otf
//   CabinetGrotesk-Medium.otf   CabinetGrotesk-Bold.otf   CabinetGrotesk-ExtraBold.otf
// Until the files are present, the app falls back gracefully to system fonts.
let ClashDisplaySemibold: number | undefined;
let ClashDisplayBold: number | undefined;
let CabinetGroteskMedium: number | undefined;
let CabinetGroteskBold: number | undefined;
let CabinetGroteskExtraBold: number | undefined;
try { ClashDisplaySemibold = require('../assets/fonts/ClashDisplay-Semibold.otf'); } catch { /* not yet downloaded */ }
try { ClashDisplayBold = require('../assets/fonts/ClashDisplay-Bold.otf'); } catch { /* not yet downloaded */ }
try { CabinetGroteskMedium = require('../assets/fonts/CabinetGrotesk-Medium.otf'); } catch { /* not yet downloaded */ }
try { CabinetGroteskBold = require('../assets/fonts/CabinetGrotesk-Bold.otf'); } catch { /* not yet downloaded */ }
try { CabinetGroteskExtraBold = require('../assets/fonts/CabinetGrotesk-ExtraBold.otf'); } catch { /* not yet downloaded */ }

import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { ThemeProvider as TruWellThemeProvider } from '@/theme/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { SplashScreen as TruWellSplash } from '@/components/onboarding/SplashScreen';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';
import { RootErrorBoundary, TruWellErrorBoundary } from '@/components/TruWellErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { RewardAnimationPortal } from '@/components/ui/RewardAnimation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { queryClient } from '@/lib/queryClient';
import { registerForPushNotifications } from '@/lib/notifications';
import { getUnreadCount } from '@/lib/notificationCenter';
import { registerQueryNativeSync } from '@/lib/queryNativeSync';
import { supabase } from '@/lib/supabase';
import { resolveUserRole } from '@/lib/roleResolver';
import { initRevenueCat, resetRevenueCat, configureRevenueCat } from '@/lib/adapty';
import { configureGoogleSignIn } from '@/lib/googleAuth';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { colors } from '@/theme/colors';

const SPLASH_AUTH_FALLBACK_MS = 4000;

export { TruWellErrorBoundary as ErrorBoundary };

if (Platform.OS !== 'web') {
  configureGoogleSignIn();
}

SplashScreen.preventAutoHideAsync();

const TruNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.tealGlow,
    background: colors.background,
    card: colors.dark,
    text: colors.textPrimary,
    border: colors.cardBorder,
    notification: colors.accentGold,
  },
};

function RootLayoutInner() {
  const insets = useSafeAreaInsets();
  const { isOnline } = useNetworkStatus();
  const offlinePad = !isOnline ? Math.max(insets.top, 8) + 40 : 0;

  const [loaded, fontError] = useFonts({
    ...Ionicons.font,
    Montserrat_700Bold,
    Montserrat_600SemiBold,
    Inter_400Regular,
    // Clash Display — only registered when the OTF files are present in assets/fonts/
    ...(ClashDisplayBold ? { 'ClashDisplay-Bold': ClashDisplayBold } : {}),
    ...(ClashDisplaySemibold ? { 'ClashDisplay-Semibold': ClashDisplaySemibold } : {}),
    // Cabinet Grotesk — same conditional loading
    ...(CabinetGroteskMedium ? { 'CabinetGrotesk-Medium': CabinetGroteskMedium } : {}),
    ...(CabinetGroteskBold ? { 'CabinetGrotesk-Bold': CabinetGroteskBold } : {}),
    ...(CabinetGroteskExtraBold ? { 'CabinetGrotesk-ExtraBold': CabinetGroteskExtraBold } : {}),
  });

  const authInitialized = useAuthStore((s) => s.initialized);
  const splashHidden = useRef(false);
  const [truWellSplashDone, setTruWellSplashDone] = useState(false);

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Hide the native OS splash as soon as fonts are ready
  // so TruWellSplash takes over with no gap or icon flash.
  useEffect(() => {
    if (loaded || fontError) {
      requestAnimationFrame(() => {
        hideSplash();
      });
    }
  }, [loaded, fontError, hideSplash]);

  useEffect(() => {
    if (fontError) {
      if (__DEV__) console.error('[TruWell] Font load failed — using system fonts.', fontError);
    }
  }, [fontError]);



  useEffect(() => {
    if (!loaded && !fontError) return;
    if (authInitialized && truWellSplashDone) hideSplash();
  }, [loaded, fontError, authInitialized, truWellSplashDone, hideSplash]);

  useEffect(() => {
    if (!loaded && !fontError) return;
    const t = setTimeout(() => {
      if (truWellSplashDone) hideSplash();
    }, SPLASH_AUTH_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [loaded, fontError, truWellSplashDone, hideSplash]);

  useEffect(() => {
    registerQueryNativeSync();
    configureRevenueCat(undefined);
  }, []);

  /** DEV-only: heal orphan conversion step if persisted state survived an aggressive data clear (remove once verified). */
  useEffect(() => {
    if (!__DEV__) return;
    void (async () => {
      await useOnboardingStore.getState().hydrateConversionFromStorage();
      const s = useOnboardingStore.getState();
      const hasAnswers = Boolean(
        s.selectedRole ||
          (s.guardianGoals?.length ?? 0) > 0 ||
          s.conversionBlueprintReady
      );
      if (!hasAnswers && !s.conversionFlowComplete && s.conversionFlowStep >= 4 && !s.selectedRole) {
        if (__DEV__) console.log('[DEV] Conversion ghost step cleared. Was:', s.conversionFlowStep);
        s.setConversionFlowStep(1);
        await useOnboardingStore.getState().persistConversionSnapshot();
      }
    })();
  }, []);

  if (!truWellSplashDone) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020A14' }}>
        <TruWellSplash onComplete={() => setTruWellSplashDone(true)} />
      </View>
    );
  }

  if (!loaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#020A14' }} />;
  }

  const tree = (
    <ThemeProvider value={TruNavTheme}>
      <RootNav />
    </ThemeProvider>
  );

  return (
    <>
      <OfflineBanner visible={!isOnline} />
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1, paddingTop: offlinePad }}>{tree}</View>
      </QueryClientProvider>
      <RewardAnimationPortal />
    </>
  );
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <TruWellThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <RootLayoutInner />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </TruWellThemeProvider>
    </RootErrorBoundary>
  );
}

// ── Path-based route helpers (avoid useSegments: it flickers during tab transitions) ─

function normalizePath(path: string | undefined): string {
  if (path == null || path === '') return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

const SPEC_FUNNEL_PATH_PREFIXES = [
  '/role',
  '/ai-processing',
  '/score-reveal',
  '/future-vision',
  '/ai-demo',
  '/blueprint',
  '/subscription',
  '/account',
  '/guardian/care-discovery',
  '/guardian/assessment',
] as const;

function isAuthPath(path: string, activeRootName?: string): boolean {
  const p = normalizePath(path);
  if (p === '/login' || p === '/sign-in' || p === '/register' || p === '/pending') return true;
  if (p === '/welcome' && activeRootName !== '(onboarding)') return true;
  if (isConversionOnboardingPath(p, activeRootName)) return true;
  if (p.startsWith('/psych/')) return true;
  return false;
}

/** Signed-in users may resume spec conversion funnel; do not treat like login/welcome. */
function isConversionOnboardingPath(path: string, activeRootName?: string): boolean {
  if (activeRootName === '(onboarding)') return true;
  const p = normalizePath(path);
  if (p.includes('(onboarding)')) return true;
  if (p === '/onboarding' || p.startsWith('/onboarding/')) return true;
  return SPEC_FUNNEL_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Root entry (`/`): `app/index.tsx` hydrates onboarding storage then navigates; do not preempt it with welcome. */
function isBootstrapIndexPath(path: string): boolean {
  const p = normalizePath(path);
  return p === '/' || p === '/index';
}

/** Member tab URLs that do not exist on the expert tab navigator. */
function isMemberOnlyAppPath(path: string): boolean {
  const p = normalizePath(path);
  return (
    p === '/enter' || // login-redirect entry point — only exists in app/(tabs)/
    p === '/scan' ||
    p === '/wellness' ||
    p === '/safecircle' ||
    p.startsWith('/safecircle/')
  );
}

/** Expert-only paths that member users must not access. */
/** Post-role funnel steps that require selectedRole in onboarding store. */
function isRoleGatedFunnelPath(path: string): boolean {
  const p = normalizePath(path);
  return (
    p.includes('blueprint') ||
    p.includes('subscription') ||
    p.includes('account') ||
    p.includes('ai-processing') ||
    p.includes('score-reveal') ||
    p.includes('future-vision') ||
    p.includes('ai-demo')
  );
}

// ── Navigation controller ─────────────────────────────────────────────────────

function RootNav() {
  const router = useRouter();
  const pathname = usePathname();
  const navState = useRootNavigationState();
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setUnreadCount  = useNotificationStore((s) => s.setUnreadCount);
  const incrementUnread = useNotificationStore((s) => s.increment);

  const [roleState, setRoleState] = useState<'loading' | 'user' | 'none'>('loading');

  useEffect(() => {
    void useOnboardingStore.getState().hydrateConversionFromStorage();
  }, []);

  // Role resolution
  useEffect(() => {
    if (!session?.user?.id) {
      setRoleState('none');
      return;
    }

    // Fast path: session.user.user_metadata.user_type is written at signUp time and
    // is available instantly — no DB round-trip needed. This prevents the race where
    // the DB query runs before the profile upsert in onboardingSubmit.ts completes.
    const rawMeta = session.user.user_metadata as Record<string, unknown> | undefined;
    const metaType = typeof rawMeta?.user_type === 'string' ? rawMeta.user_type : null;
    if (metaType === 'user' || metaType === 'expert') {
      setRoleState('user');
      return;
    }

    // Slow path for old accounts
    setRoleState('loading');
    let cancelled = false;
    void resolveUserRole(session.user.id).then(() => {
      if (cancelled) return;
      setRoleState('user');
    });

    return () => { cancelled = true; };
  }, [session?.user?.id]);

  // Session bootstrap + live sync
  // getSession() seeds the initial value; onAuthStateChange keeps it current after
  // signUp / signIn / signOut so the route guard always sees the real auth state.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialized(true);
      if (data.session?.user?.id) {
        void registerForPushNotifications(data.session.user.id);
        void getUnreadCount(data.session.user.id).then(setUnreadCount);
        void initRevenueCat(data.session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        void registerForPushNotifications(s.user.id);
        void initRevenueCat(s.user.id);
      } else {
        // User signed out — anonymous Adapty profile
        void resetRevenueCat();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [setSession, setInitialized, setUnreadCount]);

  // Realtime subscription for new user_alerts
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    const channel = supabase
      .channel(`user_alerts:${uid}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_alerts', filter: `user_id=eq.${uid}` },
        () => { incrementUnread(); }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [session?.user?.id, incrementUnread]);

  // Route guard — pathname-based only (avoid useSegments: it flickers during tab transitions).
  useEffect(() => {
    if (!initialized || !navState?.key) return;

    const path = normalizePath(pathname);

    // useRootNavigationState() returns a state whose top-level route is '__root'
    // (an Expo Router internal wrapper). Drill one level deeper to get the actual
    // active Stack screen name: '(tabs)', '(expert)', '(auth)', etc.
    const rootRoute = navState?.routes?.[navState?.index ?? 0];
    const innerState = rootRoute?.state as { routes?: { name: string }[]; index?: number } | undefined;
    const activeRootName: string | undefined =
      rootRoute?.name === '__root' && innerState
        ? innerState.routes?.[innerState.index ?? 0]?.name
        : rootRoute?.name;

    if (__DEV__) console.log('[guard] path:', path, 'roleState:', roleState, 'activeRoot:', activeRootName ?? rootRoute?.name, 'userId:', session?.user?.id ?? 'none');

    if (!session?.user) {
      if (isBootstrapIndexPath(path)) {
        return;
      }

      const onboarding = useOnboardingStore.getState();
      const selectedRole = onboarding.selectedRole;

      if (
        !onboarding.conversionStorageHydrated &&
        isConversionOnboardingPath(path, activeRootName)
      ) {
        return;
      }

      if (path.includes('blueprint')) {
        if (!selectedRole) {
          if (__DEV__) console.log('[guard] blocking blueprint — no role, redirecting to role selection');
          router.replace(ONBOARDING_ROUTES.role);
          return;
        }
        const canViewBlueprint =
          onboarding.conversionBlueprintReady || onboarding.conversionFlowStep >= 8;
        if (!canViewBlueprint) {
          if (__DEV__) console.log('[guard] blocking blueprint — funnel not ready, redirecting to welcome');
          router.replace(ONBOARDING_ROUTES.welcome);
          return;
        }
      }

      if (isRoleGatedFunnelPath(path) && !selectedRole) {
        if (__DEV__) console.log('[guard] no role set on funnel path — redirecting to role selection');
        router.replace(ONBOARDING_ROUTES.role);
        return;
      }

      if (!isAuthPath(path, activeRootName)) {
        if (__DEV__) console.log('[guard] no session on app path — redirecting to spec welcome');
        router.replace(ONBOARDING_ROUTES.welcome);
      }
      return;
    }

    if (
      session.user.id &&
      (roleState === 'none' || roleState === 'loading') &&
      path.includes('blueprint') &&
      !useOnboardingStore.getState().selectedRole
    ) {
      if (__DEV__) console.log('[guard] signed-in but no role on blueprint — redirecting to role selection');
      router.replace(ONBOARDING_ROUTES.role);
      return;
    }

    if (roleState === 'loading') return;

    if (path === '/register') {
      return;
    }

    if (isAuthPath(path, activeRootName) && !isConversionOnboardingPath(path, activeRootName)) {
      if (__DEV__) console.log('[guard] logged-in on auth path', path, '→ routing to /enter');
      router.replace('/enter' as never);
      return;
    }

    if (path === '/') {
      if (activeRootName === '(expert)' || activeRootName === '(professional)') {
        if (__DEV__) console.log('[guard] legacy expert/pro stack → /enter');
        router.replace('/enter' as never);
      }
      return;
    }

    if (
      activeRootName === '(expert)' ||
      activeRootName === '(professional)' ||
      path.includes('(expert)') ||
      path.includes('(professional)')
    ) {
      if (__DEV__) console.log('[guard] legacy expert/pro path → /enter');
      router.replace('/enter' as never);
    }
  }, [session, pathname, initialized, router, navState, roleState]);

  if (roleState === 'loading' && initialized && session?.user?.id) {
    return <View style={{ flex: 1, backgroundColor: '#020A14' }} />;
  }

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.dark }, headerTintColor: colors.textPrimary }}>
      <Stack.Screen name="index"                     options={{ headerShown: false }} />
      <Stack.Screen name="(auth)"                    options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)"              options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)"                    options={{ headerShown: false }} />
      <Stack.Screen name="scan-result"               options={{ title: 'Scan insight', presentation: 'modal' }} />
      <Stack.Screen name="scan-ocr"                  options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="comparison"                options={{ title: 'Compare' }} />
      <Stack.Screen name="assistant"                 options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="snap-food/index"           options={{ headerShown: false }} />
      <Stack.Screen name="nearby/index"              options={{ headerShown: false }} />
      <Stack.Screen name="notifications/index"       options={{ headerShown: false }} />
      <Stack.Screen name="settings/index"            options={{ headerShown: false }} />
      <Stack.Screen name="settings/health-profile"   options={{ headerShown: false }} />
      <Stack.Screen name="settings/appearance"       options={{ headerShown: false }} />
      <Stack.Screen name="settings/notifications"    options={{ headerShown: false }} />
      <Stack.Screen name="settings/privacy"          options={{ headerShown: false }} />
      <Stack.Screen name="settings/patient-health-brief" options={{ headerShown: false }} />
      <Stack.Screen name="settings/subscription"     options={{ headerShown: false }} />
      <Stack.Screen name="settings/terms"            options={{ headerShown: false }} />
      <Stack.Screen name="settings/policy"           options={{ headerShown: false }} />
      <Stack.Screen
        name="food-history/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="family/index"              options={{ headerShown: false }} />
      <Stack.Screen name="ingredient/[name]"         options={{ headerShown: false }} />
      <Stack.Screen name="ingredient/search"         options={{ headerShown: false }} />
      <Stack.Screen name="review/new"                options={{ headerShown: false }} />
      <Stack.Screen name="diet-plan/personalise"     options={{ headerShown: false }} />
      <Stack.Screen name="diet-plan/result"          options={{ headerShown: false }} />
      <Stack.Screen name="breathing/index"           options={{ headerShown: false }} />
      <Stack.Screen name="breathing/session"         options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="breathing/reward"          options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="breathing/progress"        options={{ headerShown: false }} />
    </Stack>
  );
}
