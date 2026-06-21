import { TruWellErrorBoundary, RootErrorBoundary } from '@/components/TruWellErrorBoundary';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { QuotaWarningBanner } from '@/components/subscription/QuotaWarningBanner';
import { scanBarcode, scanOcr } from '@/lib/edge';
import { getQuotaStatus, incrementScanCount, type QuotaStatus } from '@/lib/quotaManager';
import { useAuthStore } from '@/stores/authStore';

export { TruWellErrorBoundary as ErrorBoundary };
import { isGS1Payload, parseGS1 } from '@/lib/gs1Parser';
import { mapRemoteScan } from '@/lib/mapScanResult';
import { persistScanResult } from '@/lib/healthScores';
import { supabase } from '@/lib/supabase';
import { useScanStore, type ScanResultPayload } from '@/stores/scanStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useTheme } from '@/theme/ThemeContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Height of the reticle box — the scan line travels this distance
const RETICLE_SIZE = 260;

type RecentChip = { barcode: string; productName: string };

// ---------------------------------------------------------------------------
// Scan product — calls scan-ingredient-analysis, falls back to scanBarcode
// ---------------------------------------------------------------------------
type ScanAnalysisResult = ScanResultPayload & { shouldPersist?: boolean };

async function runScanIngredientAnalysis(
  barcode: string,
  healthProfile: Record<string, unknown> | null
): Promise<ScanAnalysisResult> {
  // 1. Look up product in barcode_products
  let ingredientNames: string[] = [];
  let productName: string | undefined;
  try {
    const { data: product } = await supabase
      .from('barcode_products')
      .select('product_name, ingredients_raw_text')
      .eq('barcode', barcode)
      .maybeSingle();
    if (product) {
      productName = product.product_name ?? undefined;
      ingredientNames = (product.ingredients_raw_text ?? '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
  } catch {
    // table may not exist yet — continue
  }

  // 2. Try scan-ingredient-analysis Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('scan-ingredient-analysis', {
      body: {
        barcode,
        ingredient_names: ingredientNames,
        product_name: productName,
        user_health_profile: healthProfile,
      },
    });
    if (!error && data) {
      const d = data as Record<string, unknown>;
      // Edge function signals we need OCR instead
      if (d.needs_ocr === true) {
        throw Object.assign(
          new Error(String(d.message ?? 'Scan label instead')),
          { needs_ocr: true, gs1Country: d.gs1Country }
        );
      }
      return { ...mapRemoteScan(d), shouldPersist: true };
    }
  } catch (e) {
    if ((e as { needs_ocr?: boolean }).needs_ocr) throw e;
    // fall through
  }

  // 3. Fallback to existing scanBarcode edge function
  const raw = await scanBarcode(barcode);
  return { ...mapRemoteScan(raw), shouldPersist: false };
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

function ScanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cam = useRef<InstanceType<typeof CameraView>>(null);
  const mode = useScanStore((s) => s.mode);
  const setMode = useScanStore((s) => s.setMode);
  const setLastResult = useScanStore((s) => s.setLastResult);
  const healthProfile = useUserProfileStore((s) => s.profile?.health_profile ?? null);
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  const [busy, setBusy] = useState(false);
  const [recentChips, setRecentChips] = useState<RecentChip[]>([]);
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);

  useEffect(() => {
    if (!userId) return;
    getQuotaStatus(userId).then(setQuotaStatus).catch(() => {});
  }, [userId]);

  // ── Reticle pulse ───────────────────────────────────────────────────────
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [pulse]);
  const reticleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    borderColor: theme.teal,
    shadowColor: theme.teal,
    shadowOpacity: 0.65,
    shadowRadius: 16,
  }));

  // ── Scan line translateY animation ──────────────────────────────────────
  const scanLineY = useSharedValue(0);
  useEffect(() => {
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(RETICLE_SIZE - 4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [scanLineY]);
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  // ── Load recent chips from scans table ──────────────────────────────────
  useEffect(() => {
    supabase
      .from('scan_history')
      .select('id, product_name, barcode')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!data) return;
        const chips: RecentChip[] = data
          .filter((r) => r.product_name)
          .map((r) => ({ barcode: r.barcode ?? r.id, productName: r.product_name }));
        setRecentChips(chips);
      });
  }, []);

  // ── Barcode / QR detected ───────────────────────────────────────────────
  const lastBarcode = useRef<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [noBarcodeHint, setNoBarcodeHint] = useState(false);
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== 'barcode') {
      setNoBarcodeHint(false);
      return;
    }
    if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
    barcodeTimer.current = setTimeout(() => setNoBarcodeHint(true), 8000);
    return () => {
      if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
    };
  }, [mode]);

  const onBarcode = useCallback(
    async (data: string, codeType?: string) => {
      if (busy) return;
      if (quotaStatus?.isAtScanLimit) return;
      if (lastBarcode.current === data) return;
      lastBarcode.current = data;
      setBusy(true);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setNoBarcodeHint(false);

        const isQr =
          codeType === 'qr' ||
          codeType === 'datamatrix' ||
          /^https?:\/\//i.test(data) ||
          isGS1Payload(data);

        if (isQr) {
          const gs1 = isGS1Payload(data) ? parseGS1(data) : null;
          let result;
          if (gs1?.gtin) {
            result = await runScanIngredientAnalysis(
              gs1.gtin,
              healthProfile as Record<string, unknown> | null
            );
          } else {
            result = await runScanIngredientAnalysis(
              data,
              healthProfile as Record<string, unknown> | null
            );
          }
          result.scanMethod = 'qr';
          result.batchData = gs1
            ? {
                gtin: gs1.gtin,
                batchLot: gs1.batchLot,
                expiryDate: gs1.expiryDate,
                productionDate: gs1.productionDate,
                serialNumber: gs1.serialNumber,
                raw: gs1.raw,
              }
            : null;
          if (!result.productName && gs1?.gtin) {
            result.productName = `Product ${gs1.gtin}`;
          }
          setLastResult(result);
          if (userId) {
            if (result.shouldPersist !== false) {
              void persistScanResult(userId, result, gs1?.gtin ?? data);
            }
            void incrementScanCount(userId).then(() =>
              getQuotaStatus(userId).then(setQuotaStatus).catch(() => {})
            );
          }
          router.push('/scan-result');
          return;
        }

        const result = await runScanIngredientAnalysis(
          data,
          healthProfile as Record<string, unknown> | null
        );
        result.scanMethod = 'barcode';
        setLastResult(result);
        if (result.productName) {
          setRecentChips((prev) => {
            const next: RecentChip[] = [
              { barcode: data, productName: result.productName! },
              ...prev.filter((c) => c.barcode !== data),
            ].slice(0, 5);
            return next;
          });
        }
        if (userId) {
          if (result.shouldPersist !== false) {
            void persistScanResult(userId, result, data);
          }
          void incrementScanCount(userId).then(() =>
            getQuotaStatus(userId).then(setQuotaStatus).catch(() => {})
          );
        }
        router.push('/scan-result');
      } catch (e) {
        const err = e as Error & {
          needs_ocr?: boolean;
          gs1Country?: string;
        };
        if (err.needs_ocr) {
          // Product not in any database — prompt OCR scan
          setBusy(false);
          lastBarcode.current = null;
          Alert.alert(
            'Product not found',
            err.message ||
              'This product is not in our databases. ' +
              'Scan the ingredient label to analyse it.',
            [
              {
                text: 'Scan Label',
                onPress: () => router.push('/scan-ocr' as never),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }
        if (__DEV__) console.error('[scan] barcode error', e);
        setBusy(false);
        lastBarcode.current = null;
      } finally {
        setBusy(false);
      }
    },
    [busy, quotaStatus, router, setLastResult, healthProfile, userId]
  );

  // ── OCR capture ─────────────────────────────────────────────────────────
  const capture = async () => {
    if (!cam.current || busy) return;
    if (quotaStatus?.isAtScanLimit) return;
    setBusy(true);
    try {
      const photo = await cam.current.takePictureAsync({
        base64: true,
        quality: 0.5,
        skipProcessing: true,
      });
      let b64 = photo.base64 ?? '';
      if (!b64 && photo.uri) {
        const { readAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
        b64 = await readAsStringAsync(photo.uri, { encoding: EncodingType.Base64 });
      }
      const raw = await scanOcr(b64);
      const mapped = mapRemoteScan(raw);
      mapped.scanMethod = 'ocr';
      if (mode === 'calorie') {
        mapped.summary = `${mapped.summary} (Calorie scan: estimations are approximate.)`;
      }
      setLastResult(mapped);
      if (userId) {
        void persistScanResult(userId, mapped);
        void incrementScanCount(userId).then(() =>
          getQuotaStatus(userId).then(setQuotaStatus).catch(() => {})
        );
      }
      router.push('/scan-result');
    } catch {
      /* handled */
    } finally {
      setBusy(false);
    }
  };

  // ── Permission gate ──────────────────────────────────────────────────────
  if (!permission?.granted) {
    return (
      <View
        style={[
          styles.center,
          { paddingTop: insets.top, backgroundColor: theme.bg0 },
        ]}
      >
        <Text style={[styles.permText, { color: theme.text1 }]}>
          {t('scan.grantCamera')}
        </Text>
        <PrimaryButton
          label={t('scan.grantCamera')}
          variant="teal"
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      {/* Camera */}
      <CameraView
        key={`camera-${mode}-${permission?.granted ? 'granted' : 'pending'}`}
        ref={cam}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={
          mode === 'barcode'
            ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr', 'datamatrix'] }
            : undefined
        }
        onBarcodeScanned={
          mode === 'barcode'
            ? ({ data, type }) => { void onBarcode(data, type); }
            : undefined
        }
      />

      {/* Overlay */}
      <View
        style={[styles.overlay, { paddingTop: insets.top + 12 }]}
        pointerEvents="box-none"
      >
        {/* Scan Options floating button — below mode chips */}
        <View
          style={[styles.optionsWrap, { top: insets.top + 56 }]}
          pointerEvents="box-none"
        >
          <Pressable
            style={[
              styles.optionsBtn,
              { backgroundColor: `${theme.bg1}D8`, borderColor: theme.border },
            ]}
            onPress={() => setShowOptions((v) => !v)}
          >
            <Text style={[styles.optionsBtnTxt, { color: theme.text1 }]}>Scan options</Text>
          </Pressable>
          {showOptions && (
            <View
              style={[
                styles.optionsMenu,
                { backgroundColor: `${theme.bg1}EE`, borderColor: theme.border },
              ]}
            >
              <Pressable
                style={styles.optionsItem}
                onPress={() => {
                  setShowOptions(false);
                  setMode('barcode');
                }}
              >
                <Text style={[styles.optionsItemTxt, { color: theme.text1 }]}>
                  Scan barcode or QR
                </Text>
                <Text style={[styles.optionsItemSub, { color: theme.text3 }]}>
                  Auto-detects EAN, UPC, QR, DataMatrix
                </Text>
              </Pressable>
              <Pressable
                style={styles.optionsItem}
                onPress={() => {
                  setShowOptions(false);
                  router.push('/scan-ocr' as never);
                }}
              >
                <Text style={[styles.optionsItemTxt, { color: theme.gold }]}>
                  Scan label (OCR)
                </Text>
                <Text style={[styles.optionsItemSub, { color: theme.text3 }]}>
                  Reads ingredient lists directly
                </Text>
              </Pressable>
              <Pressable
                style={styles.optionsItem}
                onPress={() => {
                  setShowOptions(false);
                  router.push('/snap-food' as never);
                }}
              >
                <Text style={[styles.optionsItemTxt, { color: theme.teal }]}>Scan food</Text>
                <Text style={[styles.optionsItemSub, { color: theme.text3 }]}>
                  Calorie and nutrition from a photo
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Quota warning — near limit (STATE 1 or 2) */}
        {quotaStatus && !quotaStatus.isAtScanLimit && quotaStatus.isNearScanLimit && (
          <QuotaWarningBanner
            quotaStatus={quotaStatus}
            onUpgrade={() => router.push('/settings/subscription' as never)}
            type="scan"
          />
        )}

        {/* Mode chips */}
        <View style={styles.modes}>
          {(['barcode', 'ingredient', 'calorie'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.modeChip,
                {
                  backgroundColor: mode === m
                    ? `${theme.teal}18`
                    : `${theme.bg1}B8`,
                  borderColor: mode === m ? theme.teal : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  { color: mode === m ? theme.teal : theme.text2 },
                ]}
              >
                {m === 'barcode'
                  ? t('scan.barcode')
                  : m === 'ingredient'
                  ? t('scan.ingredient')
                  : t('scan.calorie')}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Reticle + scan line */}
        <View style={styles.reticleWrap} pointerEvents="none">
          <Animated.View style={[styles.reticle, reticleStyle]}>
            {/* Corner accents */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: theme.teal }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: theme.teal }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: theme.teal }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: theme.teal }]} />

            {/* Scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { backgroundColor: theme.teal },
                scanLineStyle,
              ]}
            />
          </Animated.View>

          <Text style={[styles.hint, { color: theme.text2 }]}>
            {mode === 'barcode'
              ? 'Align barcode or QR within frame'
              : 'Point at ingredient list'}
          </Text>
        </View>

        {mode === 'barcode' && noBarcodeHint && !busy && (
          <Pressable
            onPress={() => router.push('/scan-ocr' as never)}
            style={[
              styles.fallbackHint,
              { backgroundColor: `${theme.gold}1F`, borderColor: `${theme.gold}66` },
            ]}
          >
            <Text style={[styles.fallbackHintTxt, { color: theme.gold }]}>
              Barcode not found. Tap to scan the ingredients label.
            </Text>
          </Pressable>
        )}

        {/* Quota warning — at limit (STATE 3) */}
        {quotaStatus?.isAtScanLimit && (
          <QuotaWarningBanner
            quotaStatus={quotaStatus}
            onUpgrade={() => router.push('/settings/subscription' as never)}
            type="scan"
          />
        )}

        {/* Footer: capture button / spinner + recent chips */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {mode !== 'barcode' ? (
            <PrimaryButton
              label={busy ? t('scan.analyzing') : 'Capture'}
              variant="gold"
              onPress={capture}
              loading={busy}
              disabled={quotaStatus?.isAtScanLimit === true}
            />
          ) : busy ? (
            <ActivityIndicator color={theme.teal} size="large" style={styles.spinner} />
          ) : null}

          {/* Recent scan chips */}
          {recentChips.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              style={styles.chipsScroll}
            >
              {recentChips.map((chip) => (
                <Pressable
                  key={chip.barcode}
                  onPress={() => { void onBarcode(chip.barcode); }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: `${theme.bg1}CC`,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: theme.text2 }]} numberOfLines={1}>
                    {chip.productName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER = 22;

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },

  // Mode chips
  modes: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  modeChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  modeChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Reticle
  reticleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  reticle: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },

  // Corner accents (drawn over the reticle border for emphasis)
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderWidth: 3 },
  cornerTL: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  cornerTR: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  cornerBL: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  cornerBR: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },

  // Scan line
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    opacity: 0.85,
  },

  hint: { fontSize: 12, fontWeight: '500', letterSpacing: 0.2 },

  // Footer
  footer: { paddingHorizontal: 20, gap: 12 },
  spinner: { alignSelf: 'center', marginVertical: 8 },

  // Recent chips
  chipsScroll: { maxHeight: 36 },
  chips: { gap: 8, paddingHorizontal: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 160,
  },
  chipText: { fontSize: 11, fontWeight: '600' },

  // Permission screen
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  permText: { fontSize: 17, fontWeight: '700', textAlign: 'center' },

  // Scan options floating button
  optionsWrap: {
    position: 'absolute',
    right: 12,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  optionsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionsBtnTxt: { fontSize: 11, fontWeight: '800' },
  optionsMenu: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    width: 240,
    paddingVertical: 4,
  },
  optionsItem: { paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  optionsItemTxt: { fontSize: 13, fontWeight: '800' },
  optionsItemSub: { fontSize: 10, fontWeight: '500' },

  fallbackHint: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: '85%',
    marginBottom: 8,
  },
  fallbackHintTxt: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
});

export default function WrappedScanScreen() {
  return (
    <RootErrorBoundary>
      <ScanScreen />
    </RootErrorBoundary>
  );
}
