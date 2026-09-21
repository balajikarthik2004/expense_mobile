import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import ConfirmDialog from './ConfirmDialog';
import DateField from './DateField';
import { AmountField, TextField, CategoryGrid, ChoiceRow } from './FormFields';
import { colors, radius, semantic, spacing, typography } from '../theme';
import { CATEGORIES, FREQUENCIES, getCategory } from '../lib/categories';
import { formatCurrency, today } from '../lib/format';
import { useToast } from '../lib/toast';

const freqLabel = (id) => FREQUENCIES.find((f) => f.id === id)?.label ?? id;

function RecurringForm({ initial, currency, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    amount: initial ? String(initial.amount) : '',
    description: initial?.description ?? '',
    category: initial?.category ?? 'home',
    frequency: initial?.frequency ?? 'monthly',
    startDate: initial?.startDate ?? today(),
    note: initial?.note ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setError(''); };

  const submit = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return setError('Enter an amount greater than zero.');
    if (!form.description.trim()) return setError('Give this template a description.');

    setBusy(true);
    try {
      await onSubmit({
        amount,
        description: form.description.trim(),
        category: form.category,
        frequency: form.frequency,
        startDate: form.startDate,
        note: form.note.trim(),
      });
    } catch (e) {
      setError(e.message || 'Could not save the template.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      {!!error && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#93000a" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <AmountField value={form.amount} onChange={set('amount')} currency={currency} />
      <TextField
        label="Description"
        value={form.description}
        onChange={set('description')}
        placeholder="Rent, Netflix, EMI…"
        icon="text-short"
      />
      <ChoiceRow label="Frequency" options={FREQUENCIES} value={form.frequency} onChange={set('frequency')} />
      <CategoryGrid categories={CATEGORIES} value={form.category} onChange={set('category')} />
      <View>
        <Text style={styles.fieldLabel}>START DATE</Text>
        <DateField value={form.startDate} onChange={set('startDate')} max={null} label="Start date" />
      </View>

      <View style={styles.formActions}>
        <Pressable onPress={onCancel} style={styles.ghost} disabled={busy}>
          <Text style={styles.ghostText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={submit} style={[styles.primary, busy && styles.busy]} disabled={busy}>
          {busy
            ? <ActivityIndicator size="small" color={colors.primaryFixed} />
            : <Text style={styles.primaryText}>{initial ? 'Update template' : 'Add template'}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Recurring templates.
 *
 * A template is not itself a transaction — "Log now" is what posts a real
 * expense dated today. The panel shows when each was last logged so the user
 * can see at a glance what is still outstanding this cycle.
 */
export default function RecurringPanel({
  recurring, currency, onAdd, onUpdate, onRemove, onApply,
}) {
  const toast = useToast();
  const [mode, setMode] = useState(null); // null | 'new' | recurring object
  const [pendingDelete, setPendingDelete] = useState(null);
  const [applying, setApplying] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const monthlyTotal = recurring
    .filter((r) => r.isActive !== false)
    .reduce((sum, r) => {
      const perMonth = { daily: 30, weekly: 4.345, monthly: 1, yearly: 1 / 12 }[r.frequency] ?? 1;
      return sum + Number(r.amount) * perMonth;
    }, 0);

  const apply = async (item) => {
    setApplying(item._id);
    try {
      await onApply(item);
      toast.success(`Logged ${item.description}.`);
    } catch (e) {
      toast.error(e.message || 'Could not log that entry.');
    } finally {
      setApplying(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onRemove(pendingDelete._id);
      toast.success('Template removed.');
      setPendingDelete(null);
    } catch (e) {
      toast.error(e.message || 'Could not remove the template.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SectionCard
      title="Recurring Entries"
      subtitle={
        recurring.length
          ? `${recurring.length} template${recurring.length === 1 ? '' : 's'} · about ${formatCurrency(monthlyTotal, currency)}/month`
          : 'Rent, subscriptions and EMIs you log every cycle'
      }
      icon="autorenew"
      iconColor={colors.secondary}
      collapsible
      defaultOpen={false}
    >
      {mode === 'new' ? (
        <RecurringForm
          currency={currency}
          onCancel={() => setMode(null)}
          onSubmit={async (payload) => {
            await onAdd(payload);
            setMode(null);
            toast.success('Template added.');
          }}
        />
      ) : mode ? (
        <RecurringForm
          initial={mode}
          currency={currency}
          onCancel={() => setMode(null)}
          onSubmit={async (payload) => {
            await onUpdate(mode._id, payload);
            setMode(null);
            toast.success('Template updated.');
          }}
        />
      ) : (
        <>
          {recurring.length === 0 && (
            <Text style={styles.empty}>
              Nothing scheduled yet. Add a template for anything you record on a cycle.
            </Text>
          )}

          {recurring.map((item) => {
            const cat = getCategory(item.category);
            const busy = applying === item._id;
            return (
              <View key={item._id} style={styles.item}>
                <View style={[styles.itemIcon, { backgroundColor: `${cat.color}1A` }]}>
                  <MaterialCommunityIcons name={cat.icon} size={18} color={cat.color} />
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    {freqLabel(item.frequency)} · {cat.label}
                    {item.lastAppliedDate ? ` · last ${item.lastAppliedDate}` : ' · never logged'}
                  </Text>
                </View>
                <Text style={styles.itemAmount} numberOfLines={1}>
                  {formatCurrency(item.amount, currency)}
                </Text>
                <View style={styles.itemActions}>
                  <Pressable
                    onPress={() => apply(item)}
                    disabled={busy}
                    style={styles.iconBtn}
                    accessibilityLabel={`Log ${item.description} now`}
                  >
                    {busy
                      ? <ActivityIndicator size="small" color={semantic.income} />
                      : <MaterialCommunityIcons name="play-circle-outline" size={19} color={semantic.income} />}
                  </Pressable>
                  <Pressable
                    onPress={() => setMode(item)}
                    style={styles.iconBtn}
                    accessibilityLabel={`Edit ${item.description}`}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={17} color={semantic.textMuted} />
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingDelete(item)}
                    style={styles.iconBtn}
                    accessibilityLabel={`Delete ${item.description}`}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={17} color={semantic.expense} />
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Pressable onPress={() => setMode('new')} style={styles.addBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="plus" size={16} color={semantic.textPrimary} />
            <Text style={styles.addText}>Add recurring template</Text>
          </Pressable>
        </>
      )}

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Remove this template?"
        body={
          pendingDelete
            ? `"${pendingDelete.description}" will stop appearing here. Entries you already logged from it are kept.`
            : ''
        }
        confirmLabel="Remove"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  empty: { ...typography.bodySm, color: semantic.textMuted },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.cardBg,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  itemIcon: {
    width: 34, height: 34, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { ...typography.bodyMd, fontFamily: 'DMSans_500Medium', color: semantic.textPrimary },
  itemSub: { ...typography.bodySm, color: semantic.textMuted },
  itemAmount: { ...typography.labelNumericSm, color: semantic.expense },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    height: 44, borderRadius: radius.full, backgroundColor: semantic.cardBg,
  },
  addText: { ...typography.bodyMd, color: semantic.textPrimary },

  form: { gap: spacing.md },
  fieldLabel: { ...typography.labelSm, color: semantic.textMuted, marginBottom: spacing.xs + 2 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: semantic.dangerSurface, borderRadius: radius.lg, padding: spacing.sm,
  },
  errorText: { ...typography.bodySm, color: '#93000a', flex: 1 },
  formActions: { flexDirection: 'row', gap: spacing.sm },
  ghost: {
    flex: 1, height: 46, borderRadius: radius.full,
    backgroundColor: semantic.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  ghostText: { ...typography.bodyMd, color: semantic.textPrimary },
  primary: {
    flex: 1, height: 46, borderRadius: radius.full,
    backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  busy: { opacity: 0.75 },
  primaryText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: colors.primaryFixed },
});
