import { useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Share, ActivityIndicator, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '../../src/components/Screen';
import SectionCard from '../../src/components/SectionCard';
import ConfirmDialog from '../../src/components/ConfirmDialog';
import { TextField, ChoiceRow, FieldLabel } from '../../src/components/FormFields';

import { colors, radius, semantic, spacing, typography } from '../../src/theme';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/lib/auth';
import { useLedger } from '../../src/lib/ledger';
import { useToast } from '../../src/lib/toast';
import { CURRENCIES, formatCurrency, sum, today } from '../../src/lib/format';
import { getCategory, getIncomeCategory } from '../../src/lib/categories';

const WEEK_STARTS = [
  { id: 'sun', label: 'Sunday' },
  { id: 'mon', label: 'Monday' },
];

// RFC 4180: double every embedded quote, wrap every field.
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function SettingsScreen() {
  const toast = useToast();
  const { user, settings, setUser, signOut } = useAuth();
  const { expenses, income, recurring, refreshing, refresh } = useLedger();

  const currency = settings?.currency ?? 'INR';

  const [name, setName] = useState(user?.name ?? '');
  const [draftCurrency, setDraftCurrency] = useState(currency);
  const [weekStart, setWeekStart] = useState(settings?.weekStart ?? 'sun');
  const [saving, setSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const dirty =
    name.trim() !== (user?.name ?? '') ||
    draftCurrency !== currency ||
    weekStart !== (settings?.weekStart ?? 'sun');

  const totals = useMemo(
    () => ({
      expenses: sum(expenses),
      income: sum(income),
    }),
    [expenses, income],
  );

  const saveProfile = async () => {
    if (!name.trim()) return toast.error('Name cannot be empty.');
    setSaving(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        settings: { ...settings, currency: draftCurrency, weekStart },
      });
      setUser(res.user);
      toast.success('Preferences saved.');
    } catch (e) {
      toast.error(e.message || 'Could not save your preferences.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPwError('');
    if (pw.next.length < 6) return setPwError('New password must be at least 6 characters.');
    if (pw.next !== pw.confirm) return setPwError('New password and confirmation do not match.');

    setPwBusy(true);
    try {
      await api.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      setPwOpen(false);
      toast.success('Password changed.');
    } catch (e) {
      setPwError(e.message || 'Could not change your password.');
    } finally {
      setPwBusy(false);
    }
  };

  // Share is the right surface here: it hands the file to whatever the user
  // already uses (Files, Drive, mail) instead of inventing a download flow.
  const exportCsv = async () => {
    if (!expenses.length && !income.length) {
      return toast.error('Nothing to export yet.');
    }
    const header = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Note'];
    const rows = [
      ...expenses.map((e) => [
        e.date, 'expense', getCategory(e.category).label, e.description, e.amount, e.note || '',
      ]),
      ...income.map((e) => [
        e.date, 'income', getIncomeCategory(e.category).label, e.description, e.amount, e.note || '',
      ]),
    ].sort((a, b) => String(b[0]).localeCompare(String(a[0])));

    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');

    try {
      await Share.share({
        title: `KB_Expense ${today()}.csv`,
        message: csv,
      });
    } catch (e) {
      toast.error('Could not open the share sheet.');
    }
  };

  const exportJson = async () => {
    const backup = JSON.stringify(
      { exportedAt: new Date().toISOString(), settings, expenses, income, recurring },
      null,
      2,
    );
    try {
      await Share.share({ title: `KB_Expense backup ${today()}.json`, message: backup });
    } catch {
      toast.error('Could not open the share sheet.');
    }
  };

  return (
    <Screen title="Settings" refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.identityName} numberOfLines={1}>{user?.name}</Text>
          <Text style={styles.identityEmail} numberOfLines={1}>{user?.email}</Text>
        </View>
      </View>

      <SectionCard title="Profile" subtitle="How your folio is labelled" icon="account-outline">
        <TextField
          label="Display name"
          value={name}
          onChange={setName}
          placeholder="Your name"
          icon="account-outline"
          autoCapitalize="words"
          maxLength={50}
        />

        <View>
          <FieldLabel>Currency</FieldLabel>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map((c) => {
              const active = c.id === draftCurrency;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setDraftCurrency(c.id)}
                  style={[styles.currencyChip, active && styles.currencyChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${c.label} (${c.id})`}
                >
                  <Text style={[styles.currencySym, active && styles.currencyTextActive]}>{c.symbol}</Text>
                  <Text style={[styles.currencyCode, active && styles.currencyTextActive]}>{c.id}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ChoiceRow
          label="Week starts on"
          options={WEEK_STARTS}
          value={weekStart}
          onChange={setWeekStart}
        />

        <Pressable
          onPress={saveProfile}
          disabled={!dirty || saving}
          style={[styles.primary, (!dirty || saving) && styles.disabled]}
          accessibilityRole="button"
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.primaryFixed} />
            : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={17} color={colors.primaryFixed} />
                <Text style={styles.primaryText}>{dirty ? 'Save preferences' : 'All changes saved'}</Text>
              </>
            )}
        </Pressable>
      </SectionCard>

      <SectionCard title="Data Overview" subtitle="What this folio holds" icon="database-outline">
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{expenses.length}</Text>
            <Text style={styles.statLabel}>Expense entries</Text>
            <Text style={styles.statSub}>{formatCurrency(totals.expenses, currency)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{income.length}</Text>
            <Text style={styles.statLabel}>Income entries</Text>
            <Text style={styles.statSub}>{formatCurrency(totals.income, currency)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{recurring.length}</Text>
            <Text style={styles.statLabel}>Recurring</Text>
            <Text style={styles.statSub}>templates</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Export" subtitle="Take your ledger with you" icon="tray-arrow-up">
        <Pressable onPress={exportCsv} style={styles.rowBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="file-delimited-outline" size={19} color={semantic.textPrimary} />
          <View style={styles.rowBtnText}>
            <Text style={styles.rowBtnTitle}>Export as CSV</Text>
            <Text style={styles.rowBtnSub}>Every expense and income row, for a spreadsheet</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={semantic.textMuted} />
        </Pressable>

        <Pressable onPress={exportJson} style={styles.rowBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="code-json" size={19} color={semantic.textPrimary} />
          <View style={styles.rowBtnText}>
            <Text style={styles.rowBtnTitle}>Export full backup (JSON)</Text>
            <Text style={styles.rowBtnSub}>Entries, recurring templates and preferences</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={semantic.textMuted} />
        </Pressable>
      </SectionCard>

      <SectionCard title="Security" subtitle="Account credentials" icon="shield-lock-outline" collapsible defaultOpen={false}>
        {pwOpen ? (
          <>
            {!!pwError && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#93000a" />
                <Text style={styles.errorText}>{pwError}</Text>
              </View>
            )}
            <TextField
              label="Current password"
              value={pw.current}
              onChange={(v) => { setPw((p) => ({ ...p, current: v })); setPwError(''); }}
              placeholder="Current password"
              icon="lock-outline"
              autoCapitalize="none"
            />
            <TextField
              label="New password"
              value={pw.next}
              onChange={(v) => { setPw((p) => ({ ...p, next: v })); setPwError(''); }}
              placeholder="At least 6 characters"
              icon="lock-reset"
              autoCapitalize="none"
            />
            <TextField
              label="Confirm new password"
              value={pw.confirm}
              onChange={(v) => { setPw((p) => ({ ...p, confirm: v })); setPwError(''); }}
              placeholder="Repeat the new password"
              icon="lock-check-outline"
              autoCapitalize="none"
            />
            <View style={styles.actionRow}>
              <Pressable onPress={() => { setPwOpen(false); setPwError(''); }} style={styles.ghost} disabled={pwBusy}>
                <Text style={styles.ghostText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={changePassword} style={[styles.primary, styles.flex, pwBusy && styles.disabled]} disabled={pwBusy}>
                {pwBusy
                  ? <ActivityIndicator size="small" color={colors.primaryFixed} />
                  : <Text style={styles.primaryText}>Change password</Text>}
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable onPress={() => setPwOpen(true)} style={styles.rowBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="key-outline" size={19} color={semantic.textPrimary} />
            <View style={styles.rowBtnText}>
              <Text style={styles.rowBtnTitle}>Change password</Text>
              <Text style={styles.rowBtnSub}>Requires your current password</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={semantic.textMuted} />
          </Pressable>
        )}
      </SectionCard>

      <Pressable
        onPress={() => setConfirmSignOut(true)}
        style={styles.signOut}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="logout" size={18} color={semantic.expense} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={styles.version}>
        KB_Expense · {Platform.OS} build · connected to your KB_Expense API
      </Text>

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sign out?"
        body="Your entries stay on the server. You will need your password to sign back in."
        confirmLabel="Sign out"
        cancelLabel="Stay"
        destructive={false}
        onConfirm={() => { setConfirmSignOut(false); signOut(); }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.headlineMd, color: colors.primaryFixed },
  identityText: { flex: 1, minWidth: 0 },
  identityName: { ...typography.headlineMd, color: semantic.textPrimary },
  identityEmail: { ...typography.bodySm, color: semantic.textMuted },

  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  currencyChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: semantic.cardBg,
  },
  currencyChipActive: { backgroundColor: colors.primaryContainer },
  currencySym: { ...typography.labelNumericSm, color: semantic.textPrimary },
  currencyCode: { ...typography.bodySm, color: semantic.textMuted },
  currencyTextActive: { color: colors.primaryFixed },

  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    height: 48, borderRadius: radius.full, backgroundColor: colors.primaryContainer,
  },
  flex: { flex: 1 },
  disabled: { opacity: 0.5 },
  primaryText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: colors.primaryFixed },
  ghost: {
    flex: 1, height: 48, borderRadius: radius.full,
    backgroundColor: semantic.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  ghostText: { ...typography.bodyMd, color: semantic.textPrimary },
  actionRow: { flexDirection: 'row', gap: spacing.sm },

  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1, minWidth: 0, backgroundColor: semantic.cardBg,
    borderRadius: radius.lg, padding: spacing.sm + 2, gap: 2,
  },
  statValue: { ...typography.labelNumericLg, color: semantic.textPrimary },
  statLabel: { ...typography.bodySm, color: semantic.textPrimary },
  statSub: { ...typography.bodySm, fontSize: 11, color: semantic.textMuted },

  rowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: semantic.cardBg, borderRadius: radius.lg, padding: spacing.sm + 4,
  },
  rowBtnText: { flex: 1, minWidth: 0 },
  rowBtnTitle: { ...typography.bodyMd, fontFamily: 'DMSans_500Medium', color: semantic.textPrimary },
  rowBtnSub: { ...typography.bodySm, color: semantic.textMuted },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: semantic.dangerSurface, borderRadius: radius.lg, padding: spacing.sm,
  },
  errorText: { ...typography.bodySm, color: '#93000a', flex: 1 },

  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    height: 50, borderRadius: radius.full, backgroundColor: semantic.dangerSurface,
  },
  signOutText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: semantic.expense },
  version: { ...typography.bodySm, color: semantic.textMuted, textAlign: 'center' },
});
