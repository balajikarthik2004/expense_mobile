// Dates are YYYY-MM-DD strings everywhere, matching the backend schema.

const pad = (n) => String(n).padStart(2, '0');

export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => toDateStr(new Date());

export const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
};

export const startOf = (period, weekStart = 'sun') => {
  const now = new Date();
  if (period === 'day') return toDateStr(now);
  if (period === 'week') {
    const d = new Date(now);
    const offset = weekStart === 'mon' ? (d.getDay() + 6) % 7 : d.getDay();
    d.setDate(d.getDate() - offset);
    return toDateStr(d);
  }
  if (period === 'month') return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  if (period === 'year') return `${now.getFullYear()}-01-01`;
  return toDateStr(now);
};

export const rangeFor = (period, weekStart) => ({ from: startOf(period, weekStart), to: today() });

export const inRange = (items, from, to) => items.filter((e) => e.date >= from && e.date <= to);

export const sum = (items) => items.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

export const groupByDate = (items) => {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.date)) groups.set(item.date, []);
    groups.get(item.date).push(item);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
};

const CURRENCY_LOCALE = {
  INR: 'en-IN', USD: 'en-US', EUR: 'de-DE',
  GBP: 'en-GB', JPY: 'ja-JP', AED: 'ar-AE', SGD: 'en-SG',
};

// Whole units by default — this ledger is kept in rupees, not paise, so a
// trailing ".00" on every figure is noise. Pass { decimals: true } for the rare
// place that needs sub-unit precision.
export const formatCurrency = (amount, currency = 'INR', { decimals = false } = {}) =>
  new Intl.NumberFormat(CURRENCY_LOCALE[currency] || 'en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(Number(amount) || 0);

// "22 March 2025" — the long form used as list group headers in the design.
export const formatLongDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

// "Today, 24 March" / "Yesterday, 23 March" / "22 March 2025"
export const formatRelativeDate = (dateStr) => {
  const t = today();
  if (dateStr === t) return `Today, ${shortDay(dateStr)}`;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dateStr === toDateStr(y)) return `Yesterday, ${shortDay(dateStr)}`;
  return formatLongDate(dateStr);
};

const shortDay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
};

// ── Currency ──────────────────────────────────────────────────
// The set the web app offers, kept in the same order.
export const CURRENCIES = [
  { id: 'INR', symbol: '\u20B9',  label: 'Indian Rupee' },
  { id: 'USD', symbol: '$',       label: 'US Dollar' },
  { id: 'EUR', symbol: '\u20AC',  label: 'Euro' },
  { id: 'GBP', symbol: '\u00A3',  label: 'British Pound' },
  { id: 'JPY', symbol: '\u00A5',  label: 'Japanese Yen' },
  { id: 'AED', symbol: 'AED',     label: 'UAE Dirham' },
  { id: 'SGD', symbol: 'S$',      label: 'Singapore Dollar' },
];

export const CURRENCY_SYMBOL = Object.fromEntries(
  CURRENCIES.map((c) => [c.id, c.symbol]),
);

// Short form for axis ticks and dense chips: 12.4K / 1.2L / 3.4Cr for INR,
// plain K/M elsewhere. Full precision is always available in the readouts.
export const formatCompact = (amount, currency = 'INR') => {
  const n = Math.abs(Number(amount) || 0);
  const sign = Number(amount) < 0 ? '-' : '';
  const sym = CURRENCY_SYMBOL[currency] || '';
  const round = (v) => (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10);

  if (currency === 'INR') {
    if (n >= 1e7) return `${sign}${sym}${round(n / 1e7)}Cr`;
    if (n >= 1e5) return `${sign}${sym}${round(n / 1e5)}L`;
  } else if (n >= 1e6) {
    return `${sign}${sym}${round(n / 1e6)}M`;
  }
  if (n >= 1e3) return `${sign}${sym}${round(n / 1e3)}K`;
  return `${sign}${sym}${Math.round(n)}`;
};

// "March 2025" — the folio caption on the income screen.
export const monthLabel = (date = new Date()) =>
  date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
