import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import ProgressRow from './charts/ProgressRow';
import { colors, radius, semantic, spacing, typography } from '../theme';
import { CATEGORIES } from '../lib/categories';
import { formatCurrency } from '../lib/format';
import { useToast } from '../lib/toast';

/**
 * Monthly budget caps.
 *
 * `overview` comes from the server already joined against this month's actual
 * spend, so the panel never recomputes spend locally — the two would drift the
 * moment the device clock and the server disagreed about the month boundary.
 */
export default function BudgetPanel({ budget, currency, onSave }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);

  const overview = budget?.overview ?? [];
  const rows = useMemo(
    () =>
      overview
        .map((o) => ({ ...o, meta: CATEGORIES.find((c) => c.id === o.category) }))
        .filter((o) => o.meta)
        .sort((a, b) => b.spent - a.spent || b.limit - a.limit),
    [overview],
  );

  const totalLimit = rows.reduce((s, r) => s + r.limit, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const pctUsed = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const remaining = Math.max(0, totalLimit - totalSpent);

  const status =
    totalLimit === 0 ? { text: 'Not set', tone: 'neutral' }
      : pctUsed > 100 ? { text: 'Over cap', tone: 'warn' }
      : pctUsed > 90 ? { text: 'Near cap', tone: 'warn' }
      : { text: 'Healthy', tone: 'good' };

  const startEdit = () => {
    const seed = {};
    rows.forEach((r) => { seed[r.category] = r.limit ? String(r.limit) : ''; });
    setDraft(seed);
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const limits = {};
      CATEGORIES.forEach((c) => {
        limits[c.id] = Math.max(0, Number(draft[c.id]) || 0);
      });
      await onSave(limits);
      setEditing(false);
      toast.success('Budget caps updated.');
    } catch (e) {
      toast.error(e.message || 'Could not save the budget.');
    } finally {
      setBusy(false);
    }
  };

  const withLimits = rows.filter((r) => r.limit > 0);
  const visible = withLimits.length ? withLimits : rows.filter((r) => r.spent > 0).slice(0, 4);

  return (
    <SectionCard
      title="Monthly Budget Cap"
      subtitle={
        totalLimit > 0
          ? `${Math.round(pctUsed)}% utilised · ${formatCurrency(remaining, currency)} remaining`
          : 'No caps set yet'
      }
      icon="piggy-bank-outline"
      iconColor={semantic.income}
      badge={status.text}
      badgeTone={status.tone}
      collapsible
      defaultOpen={false}
    >
      {totalLimit > 0 && !editing && (
        <View style={styles.overall}>
          <View style={styles.overallRow}>
            <Text style={styles.overallLabel}>
              Spent: {formatCurrency(totalSpent, currency)}
            </Text>
            <Text style={styles.overallLabel}>
              Cap: {formatCurrency(totalLimit, currency)}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.min(100, pctUsed)}%`,
                  backgroundColor: pctUsed > 90 ? semantic.expense : colors.primaryContainer,
                },
              ]}
            />
          </View>
        </View>
      )}

      {editing ? (
        <View style={styles.editList}>
          {CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.editRow}>
              <MaterialCommunityIcons name={cat.icon} size={16} color={cat.color} />
              <Text style={styles.editLabel} numberOfLines={1}>{cat.label}</Text>
              <TextInput
                style={styles.editInput}
                value={draft[cat.id] ?? ''}
                onChangeText={(t) =>
                  setDraft((d) => ({ ...d, [cat.id]: t.replace(/[^0-9]/g, '') }))
                }
                placeholder="0"
                placeholderTextColor={colors.outlineVariant}
                keyboardType="number-pad"
                accessibilityLabel={`Monthly cap for ${cat.label}`}
              />
            </View>
          ))}
        </View>
      ) : visible.length ? (
        <View style={styles.list}>
          {visible.map((r) => (
            <ProgressRow
              key={r.category}
              label={r.meta.label}
              icon={r.meta.icon}
              color={r.meta.color}
              value={r.spent}
              total={r.limit || r.spent}
              limit={r.limit > 0 ? r.limit : null}
              over={r.isOver}
              currency={currency}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>
          Set a cap per category to track how much of each month you have used.
        </Text>
      )}

      {editing ? (
        <View style={styles.actions}>
          <Pressable onPress={() => setEditing(false)} style={styles.ghost} disabled={busy}>
            <Text style={styles.ghostText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={save} style={[styles.primary, busy && styles.busy]} disabled={busy}>
            {busy
              ? <ActivityIndicator size="small" color={colors.primaryFixed} />
              : <Text style={styles.primaryText}>Save caps</Text>}
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={startEdit} style={styles.configure} accessibilityRole="button">
          <MaterialCommunityIcons name="tune-variant" size={16} color={semantic.textPrimary} />
          <Text style={styles.configureText}>Configure budget allocations</Text>
        </Pressable>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  overall: { gap: spacing.xs },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overallLabel: { ...typography.labelNumericSm, color: semantic.textMuted },
  track: { height: 8, borderRadius: radius.full, backgroundColor: semantic.trackBg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },

  list: { gap: spacing.sm + 2 },
  empty: { ...typography.bodySm, color: semantic.textMuted },

  editList: { gap: spacing.xs },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editLabel: { ...typography.bodyMd, color: semantic.textPrimary, flex: 1 },
  editInput: {
    width: 96,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: semantic.cardBg,
    paddingHorizontal: spacing.sm,
    textAlign: 'right',
    ...typography.labelNumericSm,
    color: semantic.textPrimary,
  },

  actions: { flexDirection: 'row', gap: spacing.sm },
  ghost: {
    flex: 1, height: 44, borderRadius: radius.full,
    backgroundColor: semantic.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  ghostText: { ...typography.bodyMd, color: semantic.textPrimary },
  primary: {
    flex: 1, height: 44, borderRadius: radius.full,
    backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  busy: { opacity: 0.75 },
  primaryText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: colors.primaryFixed },

  configure: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    height: 44, borderRadius: radius.full, backgroundColor: semantic.cardBg,
  },
  configureText: { ...typography.bodyMd, color: semantic.textPrimary },
});
