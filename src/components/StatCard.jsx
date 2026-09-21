import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, semantic, spacing, typography } from '../theme';
import { formatCurrency } from '../lib/format';

/** One of the four period totals on the dashboard grid. */
export default function StatCard({ label, amount, count, icon, accent, currency, highlight }) {
  return (
    <View style={[styles.card, highlight && { backgroundColor: '#fdf0e9' }]}>
      <View style={styles.head}>
        <Text style={[styles.label, highlight && { color: semantic.expense }]} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
        <MaterialCommunityIcons name={icon} size={16} color={accent} />
      </View>
      <Text
        style={[styles.amount, highlight && { color: semantic.expense }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {formatCurrency(amount, currency)}
      </Text>
      <Text style={styles.sub}>
        {count} txn{count === 1 ? '' : 's'} recorded
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: semantic.cardBgSubtle,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  label: { ...typography.labelSm, color: semantic.textMuted, flexShrink: 1 },
  amount: { ...typography.labelNumericLg, color: semantic.textPrimary },
  sub: { ...typography.bodySm, color: semantic.textMuted },
});
