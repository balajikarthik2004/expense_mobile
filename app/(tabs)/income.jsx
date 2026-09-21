import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '../../src/components/Screen';
import SegmentedControl from '../../src/components/SegmentedControl';
import SearchBar from '../../src/components/SearchBar';
import TransactionList from '../../src/components/TransactionList';
import EmptyState from '../../src/components/EmptyState';
import ConfirmDialog from '../../src/components/ConfirmDialog';

import { colors, radius, semantic, spacing, typography } from '../../src/theme';
import { useAuth } from '../../src/lib/auth';
import { useLedger } from '../../src/lib/ledger';
import { useToast } from '../../src/lib/toast';
import { getIncomeCategory } from '../../src/lib/categories';
import { formatCurrency, monthLabel, sum } from '../../src/lib/format';
import { byCategory, inPeriod, searchMatch } from '../../src/lib/analytics';

const PERIODS = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

export default function IncomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { settings } = useAuth();
  const { expenses, income, loading, refreshing, refresh, removeIncome } = useLedger();

  const currency = settings?.currency ?? 'INR';
  const weekStart = settings?.weekStart ?? 'sun';

  const [period, setPeriod] = useState('month');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const periodIncome = useMemo(
    () => inPeriod(income, period, weekStart),
    [income, period, weekStart],
  );
  const periodExpenses = useMemo(
    () => inPeriod(expenses, period, weekStart),
    [expenses, period, weekStart],
  );

  const visible = useMemo(
    () => searchMatch(periodIncome, search, getIncomeCategory),
    [periodIncome, search],
  );

  const totalIn = sum(periodIncome);
  const totalOut = sum(periodExpenses);
  const net = totalIn - totalOut;
  // Share of income retained. Undefined with no income — showing 0% would imply
  // money came in and none was kept.
  const savingsRate = totalIn > 0 ? (net / totalIn) * 100 : null;

  const sources = useMemo(
    () => byCategory(periodIncome, getIncomeCategory),
    [periodIncome],
  );

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await removeIncome(pendingDelete._id);
      toast.success('Income entry deleted.');
      setPendingDelete(null);
    } catch (e) {
      toast.error(e.message || 'Could not delete that entry.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Screen title="Income" scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={semantic.income} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Income" refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.folioRow}>
        <MaterialCommunityIcons name="book-open-variant" size={15} color={semantic.textMuted} />
        <Text style={styles.folio}>FOLIO · {monthLabel().toUpperCase()}</Text>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Income Ledger</Text>
        <Pressable
          onPress={() => router.push('/add-income')}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Add income entry"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#fff" />
          <Text style={styles.addText}>Add Income</Text>
        </Pressable>
      </View>

      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

      <View style={styles.cardRow}>
        <View style={styles.inflowCard}>
          <Text style={styles.inflowLabel}>TOTAL INFLOW</Text>
          <Text style={styles.inflowValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {formatCurrency(totalIn, currency)}
          </Text>
          <View style={styles.inflowFoot}>
            <MaterialCommunityIcons name="receipt" size={13} color={colors.tertiaryFixedDim} />
            <Text style={styles.inflowSub}>
              {periodIncome.length} {periodIncome.length === 1 ? 'receipt' : 'receipts'} recorded
            </Text>
          </View>
        </View>

        <View style={styles.surplusCard}>
          <View style={styles.surplusHead}>
            <Text style={styles.surplusLabel}>SURPLUS / SAVINGS</Text>
            {savingsRate != null && (
              <View style={[styles.ratePill, net < 0 && styles.ratePillNeg]}>
                <Text style={[styles.rateText, net < 0 && styles.rateTextNeg]}>
                  {net >= 0 ? '+' : ''}{savingsRate.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.surplusValue, net < 0 && styles.surplusValueNeg]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net), currency)}
          </Text>
          <Text style={styles.surplusSub}>
            {net >= 0 ? 'Retained after outflow' : 'Outflow exceeded inflow'}
          </Text>
        </View>
      </View>

      {sources.length > 0 && (
        <View style={styles.sourceBlock}>
          <View style={styles.sourceHead}>
            <Text style={styles.sourceTitle}>SOURCE DISTRIBUTION</Text>
            <Text style={styles.sourceMeta}>100% accounted</Text>
          </View>
          <View style={styles.sourceBar}>
            {sources.map((s) => (
              <View
                key={s.id}
                style={{
                  flex: s.amount,
                  backgroundColor: s.color,
                  marginRight: 2,
                  borderRadius: radius.full,
                }}
              />
            ))}
          </View>
          <View style={styles.sourceLegend}>
            {sources.slice(0, 4).map((s) => (
              <View key={s.id} style={styles.sourceChip}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <Text style={styles.sourceName} numberOfLines={1}>{s.label}</Text>
                <Text style={styles.sourcePct}>{Math.round((s.amount / totalIn) * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {periodIncome.length > 3 && <SearchBar value={search} onChange={setSearch} placeholder="Search income entries…" />}

      {visible.length === 0 ? (
        <EmptyState
          icon={search ? 'magnify-close' : 'cash-plus'}
          title={search ? 'No matching income' : 'No income recorded'}
          body={
            search
              ? 'Try a different source, note or category.'
              : 'Log salary, invoices and payouts to see your real cash position.'
          }
          actionLabel={search ? null : 'Add income'}
          onAction={() => router.push('/add-income')}
        />
      ) : (
        <TransactionList
          items={visible}
          kind="income"
          currency={currency}
          resolve={getIncomeCategory}
          collapsible={false}
          onEdit={(item) => router.push({ pathname: '/add-income', params: { id: item._id } })}
          onDelete={setPendingDelete}
        />
      )}

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete this income entry?"
        body={
          pendingDelete
            ? `"${pendingDelete.description}" (${formatCurrency(pendingDelete.amount, currency)}) will be removed permanently.`
            : ''
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  folioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  folio: { ...typography.labelSm, color: semantic.textMuted },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { ...typography.headlineLg, color: semantic.textPrimary, flexShrink: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.tertiaryContainer, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  addText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: '#fff' },

  cardRow: { flexDirection: 'row', gap: spacing.sm },
  inflowCard: {
    flex: 1, minWidth: 0, backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs, justifyContent: 'space-between',
  },
  inflowLabel: { ...typography.labelSm, color: colors.tertiaryFixedDim },
  inflowValue: { ...typography.headlineMd, color: '#eafff0' },
  inflowFoot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  inflowSub: { ...typography.bodySm, color: colors.tertiaryFixedDim, flexShrink: 1 },

  surplusCard: {
    flex: 1, minWidth: 0, backgroundColor: semantic.cardBgSubtle,
    borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs, justifyContent: 'space-between',
  },
  surplusHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs },
  surplusLabel: { ...typography.labelSm, color: semantic.textMuted, flexShrink: 1 },
  ratePill: { backgroundColor: '#d8f0dd', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  ratePillNeg: { backgroundColor: '#ffdbd0' },
  rateText: { ...typography.labelNumericSm, color: '#1b5e34' },
  rateTextNeg: { color: '#842600' },
  surplusValue: { ...typography.headlineMd, color: '#1f6b43' },
  surplusValueNeg: { color: semantic.expense },
  surplusSub: { ...typography.bodySm, color: semantic.textMuted },

  sourceBlock: { gap: spacing.sm },
  sourceHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceTitle: { ...typography.labelSm, color: semantic.textMuted },
  sourceMeta: { ...typography.labelNumericSm, color: semantic.textMuted },
  sourceBar: { flexDirection: 'row', height: 6, borderRadius: radius.full, overflow: 'hidden' },
  sourceLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sourceChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: semantic.cardBgSubtle, borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2,
  },
  dot: { width: 7, height: 7, borderRadius: radius.full },
  sourceName: { ...typography.bodySm, color: semantic.textPrimary },
  sourcePct: { ...typography.labelNumericSm, color: semantic.textMuted },
});
