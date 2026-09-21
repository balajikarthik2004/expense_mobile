import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DateField from './DateField';
import ConfirmDialog from './ConfirmDialog';
import { AmountField, TextField, CategoryGrid, FieldLabel } from './FormFields';
import { colors, gradients, radius, semantic, shadows, spacing, typography } from '../theme';
import { formatCurrency, formatRelativeDate, today, yesterday } from '../lib/format';
import { useToast } from '../lib/toast';

const NOTE_MAX = 500;
const DESC_MAX = 200;

/**
 * Create / edit sheet, shared by the expense and income routes.
 *
 * Both collections have the same shape server-side, so the only differences are
 * the category set, the palette and the copy — passed in rather than forked into
 * two near-identical screens.
 */
export default function EntrySheet({
  kind, categories, existing, defaultCategory,
  currency, onCreate, onUpdate, onDelete,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const isIncome = kind === 'income';
  const editing = !!existing;

  const [form, setForm] = useState({
    amount: existing ? String(existing.amount) : '',
    description: existing?.description ?? '',
    category: existing?.category ?? defaultCategory,
    date: existing?.date ?? today(),
    note: existing?.note ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const amount = Number(form.amount);
  const valid = amount > 0 && form.description.trim().length > 0;
  const chosen = categories.find((c) => c.id === form.category) ?? categories[0];

  const submit = async () => {
    if (!amount || amount <= 0) return setError('Enter an amount greater than zero.');
    if (!form.description.trim()) return setError('Add a short description so this entry is identifiable.');

    const payload = {
      amount,
      description: form.description.trim(),
      category: form.category,
      date: form.date,
      note: form.note.trim(),
    };

    setBusy(true);
    try {
      if (editing) {
        await onUpdate(existing._id, payload);
        toast.success('Entry updated.');
      } else {
        await onCreate(payload);
        toast.success(isIncome ? 'Income recorded.' : 'Expense recorded.');
      }
      router.back();
    } catch (e) {
      setError(e.message || 'Could not save this entry.');
      setBusy(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await onDelete(existing._id);
      setConfirmDelete(false);
      toast.success('Entry deleted.');
      router.back();
    } catch (e) {
      setDeleting(false);
      setConfirmDelete(false);
      toast.error(e.message || 'Could not delete that entry.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={isIncome ? gradients.sheetHeaderIncome : gradients.sheetHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <View style={styles.headerRow}>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons
              name={isIncome ? 'arrow-top-right-thick' : 'arrow-bottom-left-thick'}
              size={20}
              color={isIncome ? '#a1d2ad' : '#ffb59d'}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>KB_EXPENSE LEDGER</Text>
            <Text style={styles.title} numberOfLines={1}>
              {editing ? 'Edit ' : 'Record '}{isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={styles.close}
            hitSlop={8}
            accessibilityLabel="Dismiss without saving"
          >
            <MaterialCommunityIcons name="close" size={20} color={colors.primaryFixed} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl * 2 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!!error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#93000a" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <AmountField
          value={form.amount}
          onChange={set('amount')}
          currency={currency}
          tone={kind}
        />

        <TextField
          label={isIncome ? 'Source / folio narration' : 'Merchant / folio narration'}
          value={form.description}
          onChange={set('description')}
          placeholder={isIncome ? 'Acme Corp — March retainer' : 'Blue Tokai Coffee & Bakery'}
          icon={isIncome ? 'bank-transfer-in' : 'storefront-outline'}
          maxLength={DESC_MAX}
        />

        <CategoryGrid
          categories={categories}
          value={form.category}
          onChange={set('category')}
          label={isIncome ? 'Income source' : 'Ledger classification'}
        />

        <View>
          <FieldLabel
            trailing={
              <View style={styles.dayChips}>
                {[
                  { label: 'Today', value: today(), icon: 'calendar-today' },
                  { label: 'Yesterday', value: yesterday(), icon: 'calendar-arrow-left' },
                ].map((d) => {
                  const active = form.date === d.value;
                  return (
                    <Pressable
                      key={d.label}
                      onPress={() => set('date')(d.value)}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Set posting date to ${d.label.toLowerCase()}`}
                    >
                      <MaterialCommunityIcons
                        name={d.icon}
                        size={12}
                        color={active ? colors.primaryFixed : semantic.textMuted}
                      />
                      <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
          >
            Posting date
          </FieldLabel>
          <DateField value={form.date} onChange={set('date')} max={today()} />
        </View>

        <TextField
          label="Memorandum"
          value={form.note}
          onChange={set('note')}
          placeholder="Optional context for this entry…"
          multiline
          maxLength={NOTE_MAX}
        />

        {/* Review strip: restates what is about to be written, so the commit is
            never a leap of faith after scrolling past the amount. */}
        <View style={[styles.review, valid && styles.reviewReady]}>
          <View style={[styles.reviewIcon, { backgroundColor: `${chosen.color}1F` }]}>
            <MaterialCommunityIcons name={chosen.icon} size={18} color={chosen.color} />
          </View>
          <View style={styles.reviewText}>
            <Text style={styles.reviewTitle} numberOfLines={1}>
              {form.description.trim() || 'Untitled entry'}
            </Text>
            <Text style={styles.reviewSub} numberOfLines={1}>
              {chosen.label} · {formatRelativeDate(form.date)}
            </Text>
          </View>
          <Text
            style={[styles.reviewAmount, { color: isIncome ? '#1f6b43' : semantic.expense }]}
            numberOfLines={1}
          >
            {isIncome ? '+' : '−'}{formatCurrency(amount || 0, currency)}
          </Text>
        </View>

        {!valid && (
          <View style={styles.hintRow}>
            <MaterialCommunityIcons name="information-outline" size={14} color={semantic.textMuted} />
            <Text style={styles.hintText}>Amount and description are required.</Text>
          </View>
        )}

        <Pressable
          onPress={submit}
          disabled={busy}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Update this entry' : 'Commit this entry to the ledger'}
        >
          <LinearGradient
            colors={isIncome ? gradients.incomeCta : gradients.primaryCta}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaInner, busy && styles.ctaBusy]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaText}>
                  {editing ? 'Update' : 'Record'} {amount > 0 ? formatCurrency(amount, currency) : 'entry'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>

        {editing && (
          <Pressable
            onPress={() => setConfirmDelete(true)}
            style={styles.deleteBtn}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="trash-can-outline" size={17} color={semantic.expense} />
            <Text style={styles.deleteText}>Delete this entry</Text>
          </Pressable>
        )}

        <Text style={styles.footnote}>
          Archived immediately in your ledger and synced to every signed-in device.
        </Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this entry?"
        body={existing ? `"${existing.description}" will be removed permanently.` : ''}
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.md + 2,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
    shadowColor: '#231a0f',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  handleWrap: { alignItems: 'center', paddingBottom: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.45)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  headerBadge: {
    width: 42, height: 42, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flexShrink: 1 },
  eyebrow: { ...typography.labelSm, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  title: { ...typography.headlineLg, color: '#fdf6ee' },
  close: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center',
  },

  body: { padding: spacing.gutter, gap: spacing.lg },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: semantic.dangerSurface, borderRadius: radius.lg, padding: spacing.sm,
  },
  errorText: { ...typography.bodySm, color: '#93000a', flex: 1 },

  dayChips: { flexDirection: 'row', gap: spacing.xs },
  dayChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: semantic.cardBg, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  dayChipActive: { backgroundColor: colors.primaryContainer },
  dayChipText: { ...typography.labelSm, color: semantic.textMuted },
  dayChipTextActive: { color: colors.primaryFixed, fontFamily: 'DMSans_700Bold' },

  review: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: semantic.cardBg, borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: 'transparent',
    padding: spacing.sm + 2,
  },
  reviewReady: { borderColor: '#bfe3c9' },
  reviewIcon: {
    width: 38, height: 38, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewText: { flex: 1, minWidth: 0 },
  reviewTitle: { ...typography.bodyLg, fontFamily: 'DMSans_500Medium', color: semantic.textPrimary },
  reviewSub: { ...typography.bodySm, color: semantic.textMuted },
  reviewAmount: { ...typography.labelNumericMd, flexShrink: 0 },

  hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: -spacing.sm },
  hintText: { ...typography.bodySm, color: semantic.textMuted },

  cta: { borderRadius: radius.full, overflow: 'hidden', ...shadows.fab },
  ctaInner: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
  },
  ctaBusy: { opacity: 0.8 },
  ctaText: { ...typography.headlineSm, color: '#fff' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    height: 48, borderRadius: radius.full, backgroundColor: semantic.dangerSurface,
  },
  deleteText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: semantic.expense },

  footnote: { ...typography.bodySm, color: semantic.textMuted, textAlign: 'center' },
});
