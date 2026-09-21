// Derived metrics for the dashboard and analytics screens.
//
// Everything here works off the YYYY-MM-DD `date` strings the API stores, so
// comparisons are plain string comparisons and no timezone conversion happens.

import { toDateStr, today, sum, startOf } from './format';
import { getCategory } from './categories';

const pad = (n) => String(n).padStart(2, '0');
const monthPrefix = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const inPeriod = (items, period, weekStart) => {
  if (period === 'all') return items;
  const start = startOf(period, weekStart);
  const end = today();
  return items.filter((e) => e.date >= start && e.date <= end);
};

export const byCategory = (items, resolve = getCategory) => {
  const totals = new Map();
  for (const item of items) {
    totals.set(item.category, (totals.get(item.category) || 0) + (Number(item.amount) || 0));
  }
  return [...totals.entries()]
    .map(([id, amount]) => ({ ...resolve(id), amount }))
    .sort((a, b) => b.amount - a.amount);
};

// ── Series builders ───────────────────────────────────────────

export const dailySeries = (items, days = 7) => {
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateStr(d);
    const slice = items.filter((e) => e.date === key);
    out.push({
      key,
      label: d.toLocaleDateString('en-IN', { weekday: 'narrow' }),
      fullLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: sum(slice),
      count: slice.length,
    });
  }
  return out;
};

export const weeklySeries = (items, weeks = 8, weekStart = 'sun') => {
  const out = [];
  const now = new Date();
  const offset = weekStart === 'mon' ? (now.getDay() + 6) % 7 : now.getDay();
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const from = new Date(now);
    from.setDate(now.getDate() - offset - i * 7);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    const fromStr = toDateStr(from);
    const toStr = toDateStr(to);
    const slice = items.filter((e) => e.date >= fromStr && e.date <= toStr);
    out.push({
      key: fromStr,
      label: `W${weeks - i}`,
      fullLabel: from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: sum(slice),
      count: slice.length,
    });
  }
  return out;
};

export const monthlySeries = (items, months = 12) => {
  const out = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = monthPrefix(d);
    const slice = items.filter((e) => e.date.startsWith(prefix));
    out.push({
      key: prefix,
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      fullLabel: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      value: sum(slice),
      count: slice.length,
    });
  }
  return out;
};

// Income / expense / savings for the grouped cashflow chart.
export const cashflowSeries = (expenses, income, months = 6) => {
  const out = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = monthPrefix(d);
    const outgo = sum(expenses.filter((e) => e.date.startsWith(prefix)));
    const inflow = sum(income.filter((e) => e.date.startsWith(prefix)));
    out.push({
      key: prefix,
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      income: inflow,
      expense: outgo,
      savings: Math.max(0, inflow - outgo),
    });
  }
  return out;
};

// ── Insight metrics ───────────────────────────────────────────

const lastMonthBounds = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: toDateStr(first), to: toDateStr(last) };
};

export const monthOverMonth = (expenses) => {
  const thisTotal = sum(inPeriod(expenses, 'month'));
  const { from, to } = lastMonthBounds();
  const lastTotal = sum(expenses.filter((e) => e.date >= from && e.date <= to));
  // With no prior month there is no baseline — report null rather than a
  // fabricated +100%.
  const change = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : null;
  return { thisTotal, lastTotal, change };
};

// Average across days elapsed so far, not the full calendar month — dividing a
// half-finished month by 30 always understates the real run rate.
export const dailyAverage = (expenses) => {
  const slice = inPeriod(expenses, 'month');
  if (!slice.length) return { average: 0, days: 0 };
  const days = new Date().getDate();
  return { average: sum(slice) / days, days };
};

export const largestExpense = (expenses) =>
  expenses.reduce((max, e) => (Number(e.amount) > Number(max?.amount ?? 0) ? e : max), null);

// Consecutive days back from today that have at least one entry. Today not yet
// being logged does not break a streak that ran through yesterday.
export const loggingStreak = (expenses) => {
  if (!expenses.length) return 0;
  const days = new Set(expenses.map((e) => e.date));
  const cursor = new Date();
  if (!days.has(toDateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(toDateStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const searchMatch = (items, query, resolve = getCategory) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (e) =>
      e.description?.toLowerCase().includes(q) ||
      e.note?.toLowerCase().includes(q) ||
      resolve(e.category).label.toLowerCase().includes(q),
  );
};
