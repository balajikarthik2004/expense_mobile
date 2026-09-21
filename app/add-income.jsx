import { useLocalSearchParams } from 'expo-router';
import EntrySheet from '../src/components/EntrySheet';
import { INCOME_CATEGORIES } from '../src/lib/categories';
import { useAuth } from '../src/lib/auth';
import { useLedger } from '../src/lib/ledger';

export default function AddIncomeScreen() {
  const { id } = useLocalSearchParams();
  const { settings } = useAuth();
  const { income, addIncome, updateIncome, removeIncome } = useLedger();

  const existing = id ? income.find((e) => e._id === id) : null;

  return (
    <EntrySheet
      kind="income"
      categories={INCOME_CATEGORIES}
      defaultCategory="salary"
      existing={existing}
      currency={settings?.currency ?? 'INR'}
      onCreate={addIncome}
      onUpdate={updateIncome}
      onDelete={removeIncome}
    />
  );
}
