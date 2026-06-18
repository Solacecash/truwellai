import { invokeRecallCheck, type RecallCheckResult } from '@/lib/edge';
import { formatGS1Date, isExpired, isExpiringSoon, type GS1Data } from '@/lib/gs1Parser';
import { useTheme } from '@/theme/ThemeContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  batch: GS1Data;
  productName?: string | null;
  style?: object;
}

export function BatchIntelligenceCard({ batch, productName, style }: Props) {
  const { theme } = useTheme();
  const [recall, setRecall] = useState<RecallCheckResult | null>(null);
  const [recallLoading, setRecallLoading] = useState(true);
  const [recallError, setRecallError] = useState<string | null>(null);

  const hasBatch = Boolean(batch.batchLot || batch.gtin);
  const hasExpiry = Boolean(batch.expiryDate);

  useEffect(() => {
    if (!hasBatch) {
      setRecallLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setRecallLoading(true);
      setRecallError(null);
      try {
        const result = await invokeRecallCheck({
          batch_number: batch.batchLot,
          product_name: productName ?? undefined,
          gtin: batch.gtin,
          expiry_date: batch.expiryDate,
        });
        if (!cancelled) setRecall(result);
      } catch (e) {
        if (!cancelled) setRecallError(e instanceof Error ? e.message : 'Recall check failed');
      } finally {
        if (!cancelled) setRecallLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasBatch, batch.batchLot, batch.gtin, batch.expiryDate, productName]);

  const expired = hasExpiry ? isExpired(batch.expiryDate) : false;
  const expiring = hasExpiry ? isExpiringSoon(batch.expiryDate, 30) : false;

  const expiryStatus = expired
    ? { label: 'EXPIRED', color: theme.red, bg: `${theme.red}20` }
    : expiring
      ? { label: 'Expiring soon', color: theme.amber, bg: `${theme.amber}20` }
      : hasExpiry
        ? { label: 'Fresh', color: theme.green, bg: `${theme.green}18` }
        : null;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg1, borderColor: theme.border }, style]}>
      <View style={styles.header}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect
            x={3}
            y={3}
            width={7}
            height={7}
            stroke={theme.teal}
            strokeWidth={1.5}
            rx={1}
          />
          <Rect x={14} y={3} width={7} height={7} stroke={theme.teal} strokeWidth={1.5} rx={1} />
          <Rect x={3} y={14} width={7} height={7} stroke={theme.teal} strokeWidth={1.5} rx={1} />
          <Path
            d="M14 14h3v3h-3zM17 17h4M14 20h3M20 14v3M20 20v1"
            stroke={theme.teal}
            strokeWidth={1.5}
          />
        </Svg>
        <Text style={[styles.title, { color: theme.text1 }]}>Batch Intelligence</Text>
      </View>

      <View style={styles.rowBlock}>
        <InfoRow
          label="Batch / Lot"
          value={batch.batchLot ?? 'Not detected'}
          theme={theme}
          mono={Boolean(batch.batchLot)}
        />
        <InfoRow
          label="Manufactured"
          value={formatGS1Date(batch.productionDate)}
          theme={theme}
        />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.text3 }]}>Expiry</Text>
          <View style={styles.rowValWrap}>
            <Text style={[styles.rowVal, { color: theme.text1 }]}>
              {formatGS1Date(batch.expiryDate)}
            </Text>
            {expiryStatus && (
              <View style={[styles.pill, { backgroundColor: expiryStatus.bg }]}>
                <Text style={[styles.pillTxt, { color: expiryStatus.color }]}>
                  {expiryStatus.label}
                </Text>
              </View>
            )}
          </View>
        </View>
        {batch.serialNumber && (
          <InfoRow label="Serial" value={batch.serialNumber} theme={theme} mono />
        )}
        {batch.gtin && <InfoRow label="GTIN" value={batch.gtin} theme={theme} mono />}
      </View>

      <View
        style={[
          styles.recallBox,
          recall?.recalled
            ? { backgroundColor: `${theme.red}16`, borderColor: `${theme.red}60` }
            : { backgroundColor: `${theme.green}14`, borderColor: `${theme.green}40` },
        ]}
      >
        {recallLoading ? (
          <View style={styles.recallRow}>
            <ActivityIndicator color={theme.teal} size="small" />
            <Text style={[styles.recallLabel, { color: theme.text3 }]}>
              Checking recall databases...
            </Text>
          </View>
        ) : recallError ? (
          <Text style={[styles.recallLabel, { color: theme.amber }]}>
            Could not reach recall databases. Tap product to rescan.
          </Text>
        ) : recall?.recalled ? (
          <View style={{ gap: 4 }}>
            <Text style={[styles.recallTitle, { color: theme.red }]}>
              ⚠ PRODUCT RECALLED
            </Text>
            {recall.recallReason && (
              <Text style={[styles.recallBody, { color: theme.text2 }]}>{recall.recallReason}</Text>
            )}
            {recall.affectedBatches && (
              <Text style={[styles.recallMeta, { color: theme.text3 }]}>
                Affected batches: {recall.affectedBatches}
              </Text>
            )}
            {recall.actionRequired && (
              <Text style={[styles.recallAction, { color: theme.red }]}>{recall.actionRequired}</Text>
            )}
            {recall.source && recall.source !== 'none' && (
              <Text style={[styles.recallMeta, { color: theme.text3 }]}>Source: {recall.source}</Text>
            )}
          </View>
        ) : (
          <Text style={[styles.recallOk, { color: theme.green }]}>
            ✓ No active recalls found
          </Text>
        )}
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  theme,
  mono = false,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>['theme'];
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.text3 }]}>{label}</Text>
      <Text
        style={[
          styles.rowVal,
          { color: theme.text1 },
          mono ? { fontVariant: ['tabular-nums'] } : null,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.1 },
  rowBlock: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  rowValWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowVal: { fontSize: 13, fontWeight: '700' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pillTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  recallBox: { borderRadius: 12, borderWidth: 1, padding: 10 },
  recallRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recallLabel: { fontSize: 12, fontWeight: '700' },
  recallTitle: { fontSize: 13, fontWeight: '900' },
  recallBody: { fontSize: 12, lineHeight: 17 },
  recallMeta: { fontSize: 11 },
  recallAction: { fontSize: 12, fontWeight: '800' },
  recallOk: { fontSize: 12, fontWeight: '800' },
});
