import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, semantic, spacing, typography } from '../theme';
import { formatCurrency } from '../lib/format';

/**
 * The dark hero card: net position for the selected period, with the two
 * sub-totals it is derived from so the number is never unexplained.
 */
export default function BalanceBanner({ periodLabel, income, expenses, currency }) {
  const net = income - expenses;
  const surplus = net >= 0;

  return (
    <View style={[styles.card, !surplus && styles.cardDeficit]}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <MaterialCommunityIcons
            name="bank-outline"
            size={16}
            color={surplus ? colors.tertiaryFixedDim : '#ffb59d'}
          />
          <Text style={[styles.eyebrow, !surplus && styles.eyebrowDeficit]} numberOfLines={1}>
            NET LEDGER BALANCE · {periodLabel.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.chip, !surplus && styles.chipDeficit]}>
          <Text style={[styles.chipText, !surplus && styles.chipTextDeficit]}>
            {surplus ? 'SURPLUS' : 'DEFICIT'}
          </Text>
        </View>
      </View>

      <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {surplus ? '+' : '−'}{formatCurrency(Math.abs(net), currency)}
      </Text>
      <Text style={[styles.caption, !surplus && styles.captionDeficit]}>
        {surplus ? 'Surplus available for allocation' : 'Spending exceeds income this period'}
      </Text>

      <View style={styles.split}>
        <View style={styles.splitCol}>
          <Text style={styles.splitLabel}>↓ TOTAL IN</Text>
          <Text style={styles.splitIn} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatCurrency(income, currency)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.splitCol}>
          <Text style={styles.splitLabel}>↑ TOTAL OUT</Text>
          <Text style={styles.splitOut} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatCurrency(expenses, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardDeficit: { backgroundColor: '#3a1a10' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  eyebrow: { ...typography.labelSm, color: colors.tertiaryFixedDim, flexShrink: 1 },
  eyebrowDeficit: { color: '#ffb59d' },
  chip: { backgroundColor: 'rgba(161,210,173,0.16)', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  chipDeficit: { backgroundColor: 'rgba(255,181,157,0.16)' },
  chipText: { ...typography.labelSm, color: colors.tertiaryFixed },
  chipTextDeficit: { color: '#ffb59d' },

  amount: { ...typography.headlineLg, color: '#f4fff6', marginTop: spacing.xs },
  caption: { ...typography.bodySm, color: colors.tertiaryFixedDim },
  captionDeficit: { color: '#ffd9cf' },

  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  splitCol: { flex: 1, minWidth: 0, gap: 2 },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: spacing.sm },
  splitLabel: { ...typography.labelSm, color: 'rgba(255,255,255,0.55)' },
  splitIn: { ...typography.labelNumericMd, color: '#a1d2ad' },
  splitOut: { ...typography.labelNumericMd, color: '#ffb59d' },
});
