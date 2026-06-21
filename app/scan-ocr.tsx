import { OcrLabelScanner } from '@/components/scan/OcrLabelScanner';
import { BackHeader } from '@/components/ui/BackHeader';
import { persistScanResult } from '@/lib/healthScores';
import { useAuthStore } from '@/stores/authStore';
import { useScanStore, type GradedIngredient, type IngredientTraffic } from '@/stores/scanStore';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function riskToTraffic(risk: 'high' | 'medium' | 'low'): IngredientTraffic {
  if (risk === 'high') return 'avoid';
  if (risk === 'medium') return 'moderate';
  return 'safe';
}

export default function ScanOcrScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const setLastResult = useScanStore((s) => s.setLastResult);
  const uid = useAuthStore((s) => s.session?.user.id);

  const handleResult = useCallback(
    async ({ result }: { image: string; result: Awaited<ReturnType<typeof import('@/lib/edge').invokeOcrLabelAnalysis>> }) => {
      const high = new Set(result.high_risk_ingredients.map((h) => h.name.toLowerCase()));
      const highDetail = new Map(
        result.high_risk_ingredients.map((h) => [h.name.toLowerCase(), h])
      );

      const ingredients: GradedIngredient[] = (result.ingredients.length > 0
        ? result.ingredients
        : result.high_risk_ingredients.map((h) => h.name)
      ).map((name) => {
        const detail = highDetail.get(name.toLowerCase());
        return {
          name,
          traffic: detail ? riskToTraffic(detail.risk) : high.has(name.toLowerCase()) ? 'moderate' : 'safe',
          note: detail?.reason,
        };
      });

      const riskNotes: string[] = [];
      if (result.banned_substances_detected.length > 0) {
        riskNotes.push(
          `Banned substance(s) detected: ${result.banned_substances_detected.join(', ')}`
        );
      }
      result.high_risk_ingredients.forEach((h) => {
        if (h.risk === 'high') riskNotes.push(`${h.name}: ${h.reason}`);
      });

      // Use product_name from OCR result first (new field)
      // then fall back to detected text extraction
      const ocrResult = result as typeof result & {
        product_name?: string;
        brand_name?: string;
      };

      const productLabel =
        ocrResult.product_name?.trim() ||
        ocrResult.brand_name?.trim() ||
        (result.detected_text
          ? result.detected_text
              .split('\n')
              .map((l) => l.trim())
              .filter((l) => l.length > 2 && l.length < 80)
              .find((l) => /^[A-Za-z]/.test(l))
          : null) ||
        `${result.product_type.charAt(0).toUpperCase()}${result.product_type.slice(1)} product (${result.ingredient_count} ingredient${result.ingredient_count !== 1 ? 's' : ''} found)`;

      const payload = {
        grade: result.overall_grade,
        score: Math.max(0, Math.min(100, Math.round(result.safety_score))),
        summary: result.summary || 'Scanned via label OCR.',
        ingredients,
        productName: productLabel,
        riskNotes,
        scanMethod: 'ocr' as const,
        personalizedScore: Math.max(0, Math.min(100, Math.round(result.safety_score))),
      };

      setLastResult(payload);

      if (uid) {
        void persistScanResult(uid, payload);
      }

      router.replace('/scan-result');
    },
    [setLastResult, router, uid]
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Scan Product Label" onBack={() => router.back()} />
      <View style={styles.body}>
        <OcrLabelScanner onResult={handleResult} onCancel={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
});
