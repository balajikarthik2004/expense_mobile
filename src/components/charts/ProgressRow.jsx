import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, semantic, spacing, typography } from '../../theme';
import { formatCurrency } from '../../lib/format';

/**
 * A labelled magnitude bar — the ranked-category form used on the dashboard
 * breakdown, the budget panel and the analytics top-5 list.
 */
export default function ProgressRow({
  label, icon, color, value, total, currency, rank, limit, over,
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        {rank != null && (
          <View style={styles.rank}><Text style={styles.rankText}>{rank}</Text></View>
        )}
        {!!icon && <MaterialCommunityIcons name={icon} size={15} color={color} />}
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {limit != null ? (
          <Text style={[styles.value, over && styles.valueOver]} numberOfLines={1}>
            {formatCurrency(value, currency)}
            <Text style={styles.limit}> / {formatCurrency(limit, currency)}</Text>
          </Text>
        ) : (
          <>
            <Text style={styles.pct}>{Math.round(pct)}%</Text>
            <Text style={styles.value} numberOfLines={1}>
              {formatCurrency(value, currency)}
            </Text>
          </>
        )}
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(pct, value > 0 ? 2 : 0)}%`, backgroundColor: over ? semantic.expense : color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rank: {
    width: 18, height: 18, borderRadius: radius.full,
    backgroundColor: semantic.trackBg, alignItems: 'center', justifyContent: 'center',
  },
  rankText: { ...typography.labelSm, fontSize: 10, color: semantic.textMuted },
  label: { ...typography.bodyMd, color: semantic.textPrimary, flex: 1 },
  pct: { ...typography.labelNumericSm, color: semantic.textMuted },
  value: { ...typography.labelNumericSm, color: semantic.textPrimary },
  valueOver: { color: semantic.expense },
  limit: { color: semantic.textMuted },
  track: { height: 6, borderRadius: radius.full, backgroundColor: semantic.trackBg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});
