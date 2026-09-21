// Category ids match the backend enums exactly — do not rename them.
// `icon` names are MaterialCommunityIcons; every one below is verified present
// in the shipped MaterialCommunityIcons.ttf, not just in the glyph map (the two
// can disagree, and a missing glyph renders as a tofu box).
// `short` is the label shown in the 4x3 tile grid.

export const CATEGORIES = [
  { id: 'food',          label: 'Food & Dining',        short: 'Food',      icon: 'silverware-fork-knife', color: '#a53c15' },
  { id: 'transport',     label: 'Transport',            short: 'Transport', icon: 'car',                   color: '#1a3a6b' },
  { id: 'shopping',      label: 'Shopping',             short: 'Shopping',  icon: 'shopping',              color: '#8b5cf6' },
  { id: 'entertainment', label: 'Entertainment',        short: 'Fun',       icon: 'movie-open-outline',    color: '#b8860b' },
  { id: 'health',        label: 'Health & Medical',     short: 'Medical',   icon: 'medical-bag',           color: '#2d5a3d' },
  { id: 'utilities',     label: 'Utilities & Bills',    short: 'Utilities', icon: 'lightning-bolt',        color: '#0891b2' },
  { id: 'education',     label: 'Education',            short: 'Education', icon: 'school',                color: '#7c3aed' },
  { id: 'travel',        label: 'Travel',               short: 'Travel',    icon: 'airplane',              color: '#059669' },
  { id: 'personal',      label: 'Personal Care',        short: 'Care',      icon: 'spa',                   color: '#db2777' },
  { id: 'home',          label: 'Home & Rent',          short: 'Home',      icon: 'home-variant',          color: '#b45309' },
  { id: 'savings',       label: 'Savings & Investment', short: 'Invest',    icon: 'piggy-bank',            color: '#15803d' },
  { id: 'other',         label: 'Other',                short: 'Other',     icon: 'shape-outline',         color: '#6b7280' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary',     label: 'Salary',        short: 'Salary',    icon: 'briefcase-variant', color: '#1b5e34' },
  { id: 'freelance',  label: 'Freelance',     short: 'Freelance', icon: 'laptop',            color: '#059669' },
  { id: 'business',   label: 'Business',      short: 'Business',  icon: 'store',             color: '#0891b2' },
  { id: 'investment', label: 'Investment',    short: 'Invest',    icon: 'finance',           color: '#7c3aed' },
  { id: 'gift',       label: 'Gift / Bonus',  short: 'Gift',      icon: 'gift',              color: '#db2777' },
  { id: 'rental',     label: 'Rental Income', short: 'Rental',    icon: 'home-city-outline', color: '#b45309' },
  { id: 'other_inc',  label: 'Other Income',  short: 'Other',     icon: 'cash-multiple',     color: '#6b7280' },
];

export const FREQUENCIES = [
  { id: 'daily',   label: 'Daily' },
  { id: 'weekly',  label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly',  label: 'Yearly' },
];

const byId = (list, fallback) => (id) => list.find((c) => c.id === id) || fallback;

export const getCategory = byId(CATEGORIES, CATEGORIES[CATEGORIES.length - 1]);
export const getIncomeCategory = byId(INCOME_CATEGORIES, INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1]);
