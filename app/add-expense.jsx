import { useLocalSearchParams } from 'expo-router';
import EntrySheet from '../src/components/EntrySheet';
import { CATEGORIES } from '../src/lib/categories';
import { useAuth } from '../src/lib/auth';
import { useLedger } from '../src/lib/ledger';

export default function AddExpenseScreen() {
  const { id } = useLocalSearchParams();
  const { settings } = useAuth();
  const { expenses, addExpense, updateExpense, removeExpense } = useLedger();

  const existing = id ? expenses.find((e) => e._id === id) : null;

  return (
    <EntrySheet
      kind="expense"
      categories={CATEGORIES}
      defaultCategory="food"
      existing={existing}
      currency={settings?.currency ?? 'INR'}
      onCreate={addExpense}
      onUpdate={updateExpense}
      onDelete={removeExpense}
    />
  );
}
