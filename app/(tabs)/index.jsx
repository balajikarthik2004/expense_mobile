import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import Screen from '../../src/components/Screen';
import SegmentedControl from '../../src/components/SegmentedControl';
import StatCard from '../../src/components/StatCard';
import BalanceBanner from '../../src/components/BalanceBanner';
import SearchBar from '../../src/components/SearchBar';
import TransactionList from '../../src/components/TransactionList';
import EmptyState from '../../src/components/EmptyState';
import SectionCard from '../../src/components/SectionCard';
import ConfirmDialog from '../../src/components/ConfirmDialog';
import BudgetPanel from '../../src/components/BudgetPanel';
import RecurringPanel from '../../src/components/RecurringPanel';
import DateField from '../../src/components/DateField';
import DonutChart from '../../src/components/charts/DonutChart';
import AreaTrend from '../../src/components/charts/AreaTrend';
import ProgressRow from '../../src/components/charts/ProgressRow';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, semantic, spacing, typography } from '../../src/theme';
import { series } from '../../src/theme/chart';
import { useAuth } from '../../src/lib/auth';
import { useLedger } from '../../src/lib/ledger';
import { useToast } from '../../src/lib/toast';
import { getCategory } from '../../src/lib/categories';
import { formatCurrency, inRange, sum, today } from '../../src/lib/format';
import {
  byCategory, dailySeries, inPeriod, monthlySeries, searchMatch,
} from '../../src/lib/analytics';

const PERIODS = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'custom', label: 'Custom' },
];

const STATS = [
  { id: 'day', label: 'Today', icon: 'white-balance-sunny', accent: '#d4a843' },
  { id: 'week', label: 'Week', icon: 'calendar-week', accent: '#1a3a6b' },
  { id: 'month', label: 'Month', icon: 'chart-box-outline', accent: colors.secondary },
  { id: 'year', label: 'Year', icon: 'bank-outline', accent: '#2d5a3d' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const toast = useToast();
  const { settings } = useAuth();
  const {
    expenses, income, budget, recurring, loading, refreshing, error, refresh,
    removeExpense, saveBudget, addRecurring, updateRecurring, removeRecurring, applyRecurring,
  } = useLedger();

  const currency = settings?.currency ?? 'INR';
  const weekStart = settings?.weekStart ?? 'sun';

  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  const isCustom = period === 'custom';

  const periodExpenses = useMemo(
    () => (isCustom ? inRange(expenses, from, to) : inPeriod(expenses, period, weekStart)),
    [expenses, period, isCustom, from, to, weekStart],
  );
  const periodIncome = useMemo(
    () => (isCustom ? inRange(income, from, to) : inPeriod(income, period, weekStart)),
    [income, period, isCustom, from, to, weekStart],
  );

  const visible = useMemo(
    () => searchMatch(periodExpenses, search),
    [periodExpenses, search],
  );

  const stats = useMemo(
    () =>
      STATS.map((s) => {
        const slice = inPeriod(expenses, s.id, weekStart);
        return { ...s, amount: sum(slice), count: slice.length };
      }),
    [expenses, weekStart],
  );

  const breakdown = useMemo(() => byCategory(periodExpenses), [periodExpenses]);
  const periodOut = sum(periodExpenses);
  const periodIn = sum(periodIncome);

  const daily = useMemo(() => dailySeries(expenses, 7), [expenses]);
  const monthly = useMemo(() => monthlySeries(expenses, 12), [expenses]);

  const periodLabel = isCustom ? 'Custom range' : PERIODS.find((p) => p.id === period).label;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await removeExpense(pendingDelete._id);
      toast.success('Entry deleted.');
      setPendingDelete(null);
    } catch (e) {
      toast.error(e.message || 'Could not delete that entry.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Screen title="Dashboard" scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={semantic.expense} />
          <Text style={styles.loadingText}>Opening your folio…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Dashboard"
      onProfile={() => router.push('/settings')}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {!!error && (
        <Pressable style={styles.errorBanner} onPress={refresh}>
          <MaterialCommunityIcons name="cloud-off-outline" size={17} color="#93000a" />
          <Text style={styles.errorText}>{error} Tap to retry.</Text>
        </Pressable>
      )}

      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

      {isCustom && (
        <View style={styles.rangeCard}>
          <View style={styles.rangeCol}>
            <Text style={styles.rangeLabel}>FROM</Text>
            <DateField value={from} onChange={setFrom} max={to} label="Range start" />
          </View>
          <View style={styles.rangeCol}>
            <Text style={styles.rangeLabel}>TO</Text>
            <DateField value={to} onChange={setTo} min={from} max={today()} label="Range end" />
          </View>
        </View>
      )}

      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          {stats.slice(0, 2).map((s) => (
            <StatCard key={s.id} {...s} currency={currency} highlight={s.id === period} />
          ))}
        </View>
        <View style={styles.statRow}>
          {stats.slice(2).map((s) => (
            <StatCard key={s.id} {...s} currency={currency} highlight={s.id === period} />
          ))}
        </View>
      </View>

      <BalanceBanner
        periodLabel={periodLabel}
        income={periodIn}
        expenses={periodOut}
        currency={currency}
      />

      <View style={styles.toolbar}>
        <View style={styles.viewToggle}>
          {[
            { id: 'list', label: 'List View', icon: 'format-list-bulleted' },
            { id: 'charts', label: 'Charts', icon: 'chart-donut' },
          ].map((v) => {
            const active = view === v.id;
            return (
              <Pressable
                key={v.id}
                onPress={() => setView(v.id)}
                style={[styles.viewBtn, active && styles.viewBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <MaterialCommunityIcons
                  name={v.icon}
                  size={15}
                  color={active ? semantic.textPrimary : semantic.textMuted}
                />
                <Text style={[styles.viewText, active && styles.viewTextActive]}>{v.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {view === 'list' ? (
        <>
          <SearchBar value={search} onChange={setSearch} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {periodLabel} · {visible.length} {visible.length === 1 ? 'entry' : 'entries'}
            </Text>
            <Text style={styles.summaryValue}>{formatCurrency(sum(visible), currency)}</Text>
          </View>

          {visible.length === 0 ? (
            <EmptyState
              icon={search ? 'magnify-close' : 'notebook-outline'}
              title={search ? 'No matching entries' : 'No entries for this period'}
              body={
                search
                  ? 'Try a different description, note or category.'
                  : 'Record your first expense and it will appear here, grouped by day.'
              }
              actionLabel={search ? null : 'Record an expense'}
              onAction={() => router.push('/add-expense')}
            />
          ) : (
            <TransactionList
              items={visible}
              kind="expense"
              currency={currency}
              resolve={getCategory}
              onEdit={(item) => router.push({ pathname: '/add-expense', params: { id: item._id } })}
              onDelete={setPendingDelete}
            />
          )}
        </>
      ) : (
        <View
          style={styles.charts}
          onLayout={(e) => setChartWidth(e.nativeEvent.layout.width - spacing.md * 2)}
        >
          <SectionCard title="Last 7 Days" subtitle="Daily outflow" icon="calendar-week">
            {chartWidth > 0 && (
              <AreaTrend id="daily" data={daily} color={series.expense} currency={currency} width={chartWidth} />
            )}
          </SectionCard>

          <SectionCard title="12-Month Trend" subtitle="Monthly outflow" icon="chart-line">
            {chartWidth > 0 && (
              <AreaTrend id="yearly" data={monthly} color={colors.secondary} currency={currency} width={chartWidth} />
            )}
          </SectionCard>

          <SectionCard title="Category Split" subtitle={periodLabel} icon="chart-donut">
            {breakdown.length ? (
              <DonutChart
                slices={breakdown.map((c) => ({ id: c.id, label: c.label, color: c.color, amount: c.amount }))}
                total={periodOut}
                currency={currency}
                centerLabel="Outflow"
              />
            ) : (
              <Text style={styles.muted}>No spending in this period yet.</Text>
            )}
          </SectionCard>
        </View>
      )}

      <SectionCard
        title="Monthly Outflow"
        subtitle={`${periodLabel} · top categories`}
        icon="chart-arc"
      >
        {breakdown.length ? (
          <>
            <Text style={styles.bigTotal}>{formatCurrency(periodOut, currency)}</Text>
            <View style={styles.breakdown}>
              {breakdown.slice(0, 4).map((c) => (
                <ProgressRow
                  key={c.id}
                  label={c.label}
                  icon={c.icon}
                  color={c.color}
                  value={c.amount}
                  total={periodOut}
                  currency={currency}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.muted}>Nothing recorded for this period.</Text>
        )}
      </SectionCard>

      <BudgetPanel budget={budget} currency={currency} onSave={saveBudget} />

      <RecurringPanel
        recurring={recurring}
        currency={currency}
        onAdd={addRecurring}
        onUpdate={updateRecurring}
        onRemove={removeRecurring}
        onApply={applyRecurring}
      />

      <View style={styles.footer}>
        <MaterialCommunityIcons name="check-decagram-outline" size={14} color={semantic.textMuted} />
        <Text style={styles.footerText}>
          {expenses.length + income.length} entries reconciled in this folio
        </Text>
      </View>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete this entry?"
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { ...typography.bodyMd, color: semantic.textMuted },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: semantic.dangerSurface, borderRadius: radius.lg, padding: spacing.sm,
  },
  errorText: { ...typography.bodySm, color: '#93000a', flex: 1 },

  rangeCard: { flexDirection: 'row', gap: spacing.sm },
  rangeCol: { flex: 1, minWidth: 0 },
  rangeLabel: { ...typography.labelSm, color: semantic.textMuted, marginBottom: spacing.xs },

  statGrid: { gap: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.sm },

  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: semantic.cardBgSubtle,
    borderRadius: radius.full,
    padding: 3,
    gap: 2,
  },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full,
  },
  viewBtnActive: { backgroundColor: semantic.cardBg },
  viewText: { ...typography.bodySm, color: semantic.textMuted },
  viewTextActive: { color: semantic.textPrimary, fontFamily: 'DMSans_700Bold' },

  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { ...typography.bodySm, color: semantic.textMuted, flex: 1 },
  summaryValue: { ...typography.labelNumericMd, color: semantic.expense },

  charts: { gap: spacing.md },
  muted: { ...typography.bodySm, color: semantic.textMuted },
  bigTotal: { ...typography.headlineLg, color: semantic.textPrimary },
  breakdown: { gap: spacing.sm + 2, marginTop: spacing.xs },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  footerText: { ...typography.bodySm, color: semantic.textMuted },
});
