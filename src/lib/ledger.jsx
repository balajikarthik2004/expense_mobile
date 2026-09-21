import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { api } from '../api/client';
import { useAuth } from './auth';
import { today } from './format';

/**
 * One store for every ledger collection.
 *
 * The API paginates expenses at 100 by default; the dashboard's stat cards and
 * the analytics screen both need a full year of history to be correct, so the
 * initial load asks for the server's 500 cap and walks the pages until it has
 * everything. Getting this wrong silently truncates the charts rather than
 * erroring, which is why it is explicit here.
 */
const LedgerContext = createContext(null);

const PAGE_LIMIT = 500;

async function fetchAllPages(fetcher) {
  const first = await fetcher(1);
  const rows = first.data ?? [];
  const pages = first.pagination?.pages ?? 1;
  if (pages <= 1) return rows;

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => fetcher(i + 2)),
  );
  return rest.reduce((acc, page) => acc.concat(page.data ?? []), rows);
}

export function LedgerProvider({ children }) {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [budget, setBudget] = useState({ limits: {}, overview: [] });
  const [recurring, setRecurring] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Guards against a stale in-flight load overwriting newer data after the
  // user signs out and back in as somebody else.
  const loadToken = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!user) return;
      const token = (loadToken.current += 1);
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [exp, inc, bud, rec] = await Promise.all([
          fetchAllPages((page) => api.getExpenses({ limit: PAGE_LIMIT, page })),
          fetchAllPages((page) => api.getIncome({ limit: PAGE_LIMIT, page })),
          api.getBudget(),
          api.getRecurring(),
        ]);
        if (token !== loadToken.current) return;
        setExpenses(exp);
        setIncome(inc);
        setBudget(bud.data ?? { limits: {}, overview: [] });
        setRecurring(rec.data ?? []);
      } catch (e) {
        if (token !== loadToken.current) return;
        setError(e.message || 'Could not load your ledger.');
      } finally {
        if (token === loadToken.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setIncome([]);
      setBudget({ limits: {}, overview: [] });
      setRecurring([]);
      setLoading(false);
      return;
    }
    load();
  }, [user, load]);

  // ── Mutations ───────────────────────────────────────────────
  // Each one updates local state from the server's response rather than
  // re-fetching everything, so a row edit does not blank the whole screen.

  const addExpense = useCallback(async (payload) => {
    const { data } = await api.addExpense(payload);
    setExpenses((list) => [data, ...list]);
    return data;
  }, []);

  const updateExpense = useCallback(async (id, payload) => {
    const { data } = await api.updateExpense(id, payload);
    setExpenses((list) => list.map((e) => (e._id === id ? data : e)));
    return data;
  }, []);

  const removeExpense = useCallback(async (id) => {
    await api.deleteExpense(id);
    setExpenses((list) => list.filter((e) => e._id !== id));
  }, []);

  const addIncome = useCallback(async (payload) => {
    const { data } = await api.addIncome(payload);
    setIncome((list) => [data, ...list]);
    return data;
  }, []);

  const updateIncome = useCallback(async (id, payload) => {
    const { data } = await api.updateIncome(id, payload);
    setIncome((list) => list.map((e) => (e._id === id ? data : e)));
    return data;
  }, []);

  const removeIncome = useCallback(async (id) => {
    await api.deleteIncome(id);
    setIncome((list) => list.filter((e) => e._id !== id));
  }, []);

  // The API expects { limits: { food: 5000, ... } } — a flat map is rejected.
  const saveBudget = useCallback(async (limits) => {
    await api.updateBudget({ limits });
    const fresh = await api.getBudget();
    setBudget(fresh.data ?? { limits: {}, overview: [] });
  }, []);

  const addRecurring = useCallback(async (payload) => {
    const { data } = await api.addRecurring(payload);
    setRecurring((list) => [...list, data]);
    return data;
  }, []);

  const updateRecurring = useCallback(async (id, payload) => {
    const { data } = await api.updateRecurring(id, payload);
    setRecurring((list) => list.map((r) => (r._id === id ? data : r)));
    return data;
  }, []);

  const removeRecurring = useCallback(async (id) => {
    await api.deleteRecurring(id);
    setRecurring((list) => list.filter((r) => r._id !== id));
  }, []);

  // Logging a recurring template posts a real expense dated today and stamps
  // the template, so both collections need refreshing.
  const applyRecurring = useCallback(async (item) => {
    const { data } = await api.addExpense({
      amount: item.amount,
      description: item.description,
      category: item.category,
      date: today(),
      note: item.note || `Auto: ${item.frequency}`,
      recurringId: item._id,
    });
    setExpenses((list) => [data, ...list]);
    setRecurring((list) =>
      list.map((r) => (r._id === item._id ? { ...r, lastAppliedDate: today() } : r)),
    );
    return data;
  }, []);

  const value = useMemo(
    () => ({
      expenses, income, budget, recurring,
      loading, refreshing, error,
      refresh: () => load({ silent: true }),
      reload: load,
      addExpense, updateExpense, removeExpense,
      addIncome, updateIncome, removeIncome,
      saveBudget,
      addRecurring, updateRecurring, removeRecurring, applyRecurring,
    }),
    [
      expenses, income, budget, recurring, loading, refreshing, error, load,
      addExpense, updateExpense, removeExpense,
      addIncome, updateIncome, removeIncome, saveBudget,
      addRecurring, updateRecurring, removeRecurring, applyRecurring,
    ],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export const useLedger = () => {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger must be used inside <LedgerProvider>');
  return ctx;
};
