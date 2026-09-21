import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '../../src/components/Screen';
import SectionCard from '../../src/components/SectionCard';
import EmptyState from '../../src/components/EmptyState';
import ProgressRow from '../../src/components/charts/ProgressRow';
import AreaTrend from '../../src/components/charts/AreaTrend';
import GroupedBars from '../../src/components/charts/GroupedBars';

import { colors, radius, semantic, spacing, typography } from '../../src/theme';
import { series } from '../../src/theme/chart';
import { useAuth } from '../../src/lib/auth';
import { useLedger } from '../../src/lib/ledger';
import { formatCurrency, monthLabel, sum } from '../../src/lib/format';
import {
  byCategory, cashflowSeries, dailyAverage, inPeriod, largestExpense,
  loggingStreak, monthlySeries, monthOverMonth, weeklySeries,
} from '../../src/lib/analytics';

function InsightCard({ icon, label, value, sub, tone = 'neutral' }) {
  const color =
    tone === 'good' ? '#1f6b43' : tone === 'warn' ? semantic.expense : semantic.textPrimary;
  return (
    <View style={styles.insight}>
      <View style={styles.insightHead}>
        <Text style={styles.insightLabel} numberOfLines={1}>{label.toUpperCase()}</Text>
        <MaterialCommunityIcons name={icon} size={16} color={semantic.textMuted} />
      </View>
      <Text style={[styles.insightValue, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      {!!sub && <Text style={styles.insightSub} numberOfLines={2}>{sub}</Text>}
    </View>
  );
}

export default function AnalyticsScreen() {
  const { settings } = useAuth();
  const { expenses, income, loading, refreshing, refresh } = useLedger();
  const currency = settings?.currency ?? 'INR';
  const weekStart = settings?.weekStart ?? 'sun';

  const [width, setWidth] = useState(0);

  const mom = useMemo(() => monthOverMonth(expenses), [expenses]);
  const avg = useMemo(() => dailyAverage(expenses), [expenses]);
  const largest = useMemo(() => largestExpense(expenses), [expenses]);
  const streak = useMemo(() => loggingStreak(expenses), [expenses]);

  const cashflow = useMemo(() => cashflowSeries(expenses, income, 6), [expenses, income]);
  const weekly = useMemo(() => weeklySeries(expenses, 8, weekStart), [expenses, weekStart]);
  const monthly = useMemo(() => monthlySeries(expenses, 12), [expenses]);

  const yearExpenses = useMemo(() => inPeriod(expenses, 'year', weekStart), [expenses, weekStart]);
  const yearTotal = sum(yearExpenses);
  const topCategories = useMemo(() => byCategory(yearExpenses).slice(0, 5), [yearExpenses]);

  // Median is the honest centre for monthly spend — one outlier month should
  // not drag the "typical month" figure the way a mean does.
  const median = useMemo(() => {
    const active = monthly.map((m) => m.value).filter((v) => v > 0).sort((a, b) => a - b);
    if (!active.length) return 0;
    const mid = Math.floor(active.length / 2);
    return active.length % 2 ? active[mid] : (active[mid - 1] + active[mid]) / 2;
  }, [monthly]);

  const avgSurplusRatio = useMemo(() => {
    const months = cashflow.filter((m) => m.income > 0);
    if (!months.length) return null;
    return (
      months.reduce((s, m) => s + (m.income - m.expense) / m.income, 0) / months.length
    ) * 100;
  }, [cashflow]);

  if (loading) {
    return (
      <Screen title="Analytics" scroll={false}>
        <View style={styles.loading}><ActivityIndicator size="large" color={semantic.expense} /></View>
      </Screen>
    );
  }

  if (!expenses.length && !income.length) {
    return (
      <Screen title="Analytics" refreshing={refreshing} onRefresh={refresh}>
        <EmptyState
          icon="chart-line"
          title="Nothing to analyse yet"
          body="Record a few entries and this screen fills in with trends, category weight and your savings ratio."
        />
      </Screen>
    );
  }

  return (
    <Screen title="Analytics" refreshing={refreshing} onRefresh={refresh}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width - spacing.md * 2)}>
        <Text style={styles.pageTitle}>Financial Analytics</Text>
        <Text style={styles.pageSub}>Archival ledger · {monthLabel()}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <InsightCard
            icon={mom.change != null && mom.change < 0 ? 'trending-down' : 'trending-up'}
            label="Monthly change"
            value={mom.change == null ? '—' : `${mom.change >= 0 ? '+' : ''}${mom.change.toFixed(1)}%`}
            sub={
              mom.change == null
                ? 'No prior month to compare'
                : `vs ${formatCurrency(mom.lastTotal, currency)} last month`
            }
            tone={mom.change == null ? 'neutral' : mom.change <= 0 ? 'good' : 'warn'}
          />
          <InsightCard
            icon="calculator-variant-outline"
            label="Daily average"
            value={formatCurrency(avg.average, currency)}
            sub={`Across ${avg.days} day${avg.days === 1 ? '' : 's'} this month`}
          />
        </View>
        <View style={styles.gridRow}>
          <InsightCard
            icon="cash-multiple"
            label="Largest outlay"
            value={largest ? formatCurrency(largest.amount, currency) : '—'}
            sub={largest ? largest.description : 'No expenses recorded'}
            tone={largest ? 'warn' : 'neutral'}
          />
          <InsightCard
            icon="fire"
            label="Ledger streak"
            value={`${streak} day${streak === 1 ? '' : 's'}`}
            sub={streak > 0 ? 'Consecutive days logged' : 'Log an entry to start a streak'}
            tone={streak > 0 ? 'good' : 'neutral'}
          />
        </View>
      </View>

      <SectionCard
        title="Folio Ledger Flow"
        subtitle="Income · Expenses · Savings, last 6 months"
        icon="chart-bar"
      >
        {width > 0 && <GroupedBars data={cashflow} currency={currency} width={width} />}
        {avgSurplusRatio != null && (
          <View style={styles.ratioRow}>
            <Text style={styles.ratioLabel}>Average surplus ratio</Text>
            <Text style={[styles.ratioValue, avgSurplusRatio < 0 && { color: semantic.expense }]}>
              {avgSurplusRatio.toFixed(1)}%
            </Text>
          </View>
        )}
      </SectionCard>

      <SectionCard title="Weekly Outgo Cadence" subtitle="Last 8 calendar weeks" icon="chart-timeline-variant">
        {width > 0 && (
          <AreaTrend id="weekly" data={weekly} color={series.expense} currency={currency} width={width} />
        )}
      </SectionCard>

      <SectionCard
        title="Top 5 Accounts"
        subtitle={`Annual ledger weight · ${formatCurrency(yearTotal, currency)} total`}
        icon="format-list-numbered"
      >
        {topCategories.length ? (
          topCategories.map((c, i) => (
            <ProgressRow
              key={c.id}
              rank={i + 1}
              label={c.label}
              icon={c.icon}
              color={c.color}
              value={c.amount}
              total={yearTotal}
              currency={currency}
            />
          ))
        ) : (
          <Text style={styles.muted}>No expenses recorded this year.</Text>
        )}
      </SectionCard>

      <SectionCard
        title="12-Month Expense Trend"
        subtitle={`Typical month · ${formatCurrency(median, currency)} median`}
        icon="chart-areaspline"
      >
        {width > 0 && (
          <AreaTrend id="trend12" data={monthly} color={colors.secondary} currency={currency} width={width} />
        )}
      </SectionCard>

      <View style={styles.note}>
        <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color={semantic.textMuted} />
        <Text style={styles.noteText}>
          {mom.change == null
            ? 'A second month of entries unlocks month-over-month comparison.'
            : mom.change <= 0
            ? `Outflow is down ${Math.abs(mom.change).toFixed(1)}% on last month — the surplus is holding.`
            : `Outflow is up ${mom.change.toFixed(1)}% on last month. The top account above is where it went.`}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { ...typography.headlineLg, color: semantic.textPrimary },
  pageSub: { ...typography.bodySm, color: semantic.textMuted },

  grid: { gap: spacing.sm },
  gridRow: { flexDirection: 'row', gap: spacing.sm },
  insight: {
    flex: 1,
    minWidth: 0,
    backgroundColor: semantic.cardBgSubtle,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  insightHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  insightLabel: { ...typography.labelSm, color: semantic.textMuted, flexShrink: 1 },
  insightValue: { ...typography.headlineMd },
  insightSub: { ...typography.bodySm, color: semantic.textMuted },

  ratioRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: semantic.hairline, paddingTop: spacing.sm,
  },
  ratioLabel: { ...typography.bodySm, color: semantic.textMuted },
  ratioValue: { ...typography.labelNumericMd, color: '#1f6b43' },

  muted: { ...typography.bodySm, color: semantic.textMuted },
  note: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: semantic.cardBgSubtle, borderRadius: radius.xl, padding: spacing.md,
  },
  noteText: { ...typography.bodySm, color: semantic.textMuted, flex: 1, lineHeight: 18 },
});
