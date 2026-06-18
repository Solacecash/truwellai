import { invokeOcrLabelAnalysis, type OcrLabelResult } from '@/lib/edge';
import { hapticLight } from '@/lib/haptics';
import {
  runMlKitOcr,
  extractIngredientSection,
} from '@/lib/mlkitOcr';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Step = { id: string; label: string };

const STEPS: Step[] = [
  { id: 'read', label: 'Reading label...' },
  { id: 'detect', label: 'Detecting ingredients...' },
  { id: 'parse', label: 'Analysing product safety...' },
  { id: 'report', label: 'Building your report...' },
];

interface Props {
  onResult: (payload: { image: string; result: OcrLabelResult }) => void;
  onCancel?: () => void;
}

const { width: WIN_W, height: WIN_H } = Dimensions.get('window');
const FRAME_W = WIN_W * 0.85;
const FRAME_H = WIN_H * 0.4;

export function OcrLabelScanner({ onResult, onCancel }: Props) {
  const { theme } = useTheme();
  const [perm, requestPerm] = useCameraPermissions();
  const camRef = useRef<InstanceType<typeof CameraView>>(null);
  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const line = useSharedValue(0);
  useEffect(() => {
    line.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [line]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: line.value * (FRAME_W - 4) }],
  }));

  const capture = useCallback(async () => {
    if (!camRef.current || busy) return;
    hapticLight();
    setBusy(true);
    setStepIdx(0);
    setRetrying(false);
    setError(null);
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const photo = await camRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
        skipProcessing: true,
        exif: false,
      });
      if (!photo?.base64 || !photo?.uri) {
        setError('Camera capture failed. Try again.');
        setBusy(false);
        return;
      }

      setStepIdx(1);

      // ── STAGE 1: ML Kit on-device OCR (fast, free) ──
      let mlKitText = '';
      let mlKitIngredients = '';
      let useClaudeVision = true;

      try {
        const mlResult = await runMlKitOcr(photo.uri);
        mlKitText = mlResult.text;
        mlKitIngredients = extractIngredientSection(mlResult.text);

        if (mlResult.confidence >= 0.65 &&
            mlKitIngredients.length > 30) {
          useClaudeVision = false;
        }
      } catch {
        useClaudeVision = true;
      }

      setStepIdx(2);

      let result: OcrLabelResult | undefined;

      if (!useClaudeVision && mlKitIngredients) {
        const { data, error: fnError } =
          await supabase.functions.invoke('ai-health-assistant', {
            body: {
              task: 'ocr_label',
              ocr_text: mlKitIngredients,
              full_label_text: mlKitText,
              source: 'mlkit',
            },
          });

        if (!fnError && data) {
          const d = data as { ocr_analysis?: OcrLabelResult };
          if (d.ocr_analysis) {
            result = d.ocr_analysis;
          } else {
            useClaudeVision = true;
          }
        } else {
          useClaudeVision = true;
        }
      }

      if (useClaudeVision || !result) {
        retryTimer = setTimeout(() => setRetrying(true), 1800);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(
              'Scan timed out. Try better lighting or move closer to the label.'
            )),
            30000
          )
        );
        result = await Promise.race([
          invokeOcrLabelAnalysis(photo.base64),
          timeoutPromise,
        ]);
      }

      setStepIdx(3);
      clearTimeout(retryTimer);
      setRetrying(false);
      onResult({ image: photo.base64, result });
    } catch (e) {
      clearTimeout(retryTimer);
      setRetrying(false);
      const msg = e instanceof Error ? e.message : 'OCR failed';
      setError(msg);
      setBusy(false);
    }
  }, [busy, onResult]);

  if (!perm?.granted) {
    return (
      <View style={[styles.permWrap, { backgroundColor: theme.bg0 }]}>
        <Text style={[styles.permTxt, { color: theme.text2 }]}>
          Camera access is needed to scan an ingredient label.
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: theme.teal }]}
          onPress={() => void requestPerm()}
        >
          <Text style={[styles.permBtnTxt, { color: theme.bg0 }]}>Grant camera</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelInline}>
            <Text style={[styles.cancelTxt, { color: theme.text3 }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg0 }]}>
      <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.frameWrap, { width: FRAME_W, height: FRAME_H }]} pointerEvents="none">
          <View style={[styles.frame, { borderColor: `${theme.gold}66` }]}>
            <View style={[styles.corner, styles.cornerTL, { borderColor: theme.gold }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: theme.gold }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: theme.gold }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: theme.gold }]} />
            <Animated.View
              style={[styles.scanLine, { backgroundColor: theme.green }, lineStyle]}
            />
            <Text style={[styles.frameHint, { color: theme.text1 }]}>
              Point at ingredients or product label
            </Text>
          </View>
        </View>

        {!busy && (
          <View style={styles.captureBlock}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.shutter, { borderColor: theme.gold, backgroundColor: theme.bg0 }]}
              onPress={() => void capture()}
            >
              <View style={[styles.shutterInner, { backgroundColor: theme.gold }]} />
            </TouchableOpacity>
            <Text style={[styles.captureLabel, { color: theme.text1 }]}>Capture label</Text>
            {onCancel && (
              <Pressable onPress={onCancel} hitSlop={12}>
                <Text style={[styles.cancelOverlay, { color: theme.text3 }]}>Cancel</Text>
              </Pressable>
            )}
          </View>
        )}

        {busy && (
          <View style={[styles.progressBox, { backgroundColor: `${theme.bg0}D8`, borderColor: theme.border }]}>
            <ActivityIndicator color={theme.teal} />
            {STEPS.map((s, i) => (
              <StepLine
                key={s.id}
                label={s.label}
                state={i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending'}
                theme={theme}
              />
            ))}
            {retrying ? (
              <Text style={[styles.retryText, { color: theme.gold }]}>
                Retrying for better results...
              </Text>
            ) : null}
            {error && (
              <Text style={[styles.errorTxt, { color: theme.red }]}>
                {error}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function StepLine({
  label,
  state,
  theme,
}: {
  label: string;
  state: 'done' | 'active' | 'pending';
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const fade = useSharedValue(state === 'pending' ? 0.3 : 1);
  useEffect(() => {
    fade.value = withDelay(
      60,
      withTiming(state === 'pending' ? 0.3 : 1, { duration: 220 })
    );
  }, [fade, state]);
  const animStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View style={[styles.stepRow, animStyle]}>
      <Text
        style={{
          color: state === 'done' ? theme.green : state === 'active' ? theme.teal : theme.text3,
          fontWeight: '800',
          fontSize: 12,
          width: 16,
        }}
      >
        {state === 'done' ? '?' : state === 'active' ? '�' : '�-�'}
      </Text>
      <Text
        style={{
          color: state === 'pending' ? theme.text3 : theme.text1,
          fontSize: 13,
          fontWeight: state === 'active' ? '800' : '600',
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 24 },
  frameWrap: { alignItems: 'center', justifyContent: 'center' },
  frame: {
    flex: 1,
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: { position: 'absolute', width: 26, height: 26, borderWidth: 3 },
  cornerTL: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  cornerTR: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  cornerBL: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  scanLine: { position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.85 },
  frameHint: { fontSize: 13, fontWeight: '700', position: 'absolute', bottom: 8 },

  captureBlock: { alignItems: 'center', gap: 8, position: 'absolute', bottom: 60 },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 50, height: 50, borderRadius: 25 },
  captureLabel: { fontSize: 12, fontWeight: '800' },
  cancelOverlay: { fontSize: 12, fontWeight: '700', marginTop: 6 },

  progressBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    minWidth: 260,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  retryText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  errorTxt: { fontSize: 12, fontWeight: '700', marginTop: 6 },

  permWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  permTxt: { fontSize: 14, textAlign: 'center' },
  permBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  permBtnTxt: { fontSize: 14, fontWeight: '800' },
  cancelInline: { marginTop: 8 },
  cancelTxt: { fontSize: 13, fontWeight: '700' },
});
