import { View, Text, Pressable, Switch, StyleSheet, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import SectionCard from './SectionCard';
import { FieldLabel } from './FormFields';
import { colors, radius, semantic, spacing, typography } from '../theme';
import { SUPPORTED, describeNext, formatTime, useReminder } from '../lib/reminders';

// Minutes move in fives: this is a nudge, not an alarm, and a one-minute step
// would mean sixty taps to cross an hour.
const MINUTE_STEP = 5;

const wrap = (n, span) => ((n % span) + span) % span;

function Stepper({ label, display, onDown, onUp, disabled }) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepControls}>
        <Pressable
          onPress={onDown}
          disabled={disabled}
          hitSlop={6}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
        >
          <MaterialCommunityIcons name="minus" size={18} color={semantic.textPrimary} />
        </Pressable>
        <Text style={styles.stepValue}>{display}</Text>
        <Pressable
          onPress={onUp}
          disabled={disabled}
          hitSlop={6}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
        >
          <MaterialCommunityIcons name="plus" size={18} color={semantic.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Daily reminder card.
 *
 * The switch reflects the stored preference, but "on" and "actually scheduled"
 * are two different things — the OS can refuse permission — so a blocked state
 * is called out rather than left looking enabled.
 */
export default function ReminderPanel() {
  const {
    enabled, hour, minute, granted, canAskAgain, nextAt, loading, busy,
    setEnabled, setTime,
  } = useReminder();

  // Local notifications have no web scheduler behind them; an inert switch
  // would be worse than no card at all.
  if (!SUPPORTED) return null;

  const blocked = enabled && !granted && !loading;
  const time = formatTime(hour, minute);
  const next = describeNext(nextAt);

  return (
    <SectionCard
      title="Reminders"
      subtitle="A daily nudge to keep the ledger current"
      icon={enabled && granted ? 'bell-ring-outline' : 'bell-outline'}
      badge={enabled && granted ? time : undefined}
      badgeTone={enabled && granted ? 'good' : 'neutral'}
    >
      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>Daily expense reminder</Text>
          <Text style={styles.toggleSub}>
            {loading
              ? 'Checking…'
              : enabled
                ? next || `Every day at ${time}`
                : 'Off — nothing will be scheduled'}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          disabled={loading}
          trackColor={{ false: semantic.trackBg, true: colors.primaryContainer }}
          thumbColor={Platform.OS === 'android' ? (enabled ? colors.primaryFixed : semantic.cardBg) : undefined}
          ios_backgroundColor={semantic.trackBg}
          accessibilityLabel="Daily expense reminder"
        />
      </View>

      {blocked && (
        <View style={styles.warnBox}>
          <MaterialCommunityIcons name="bell-off-outline" size={15} color="#842600" />
          <Text style={styles.warnText}>
            {canAskAgain
              ? 'Notifications are not allowed yet. Toggle this off and on to be asked again.'
              : 'Notifications are blocked for KB_Expense. Turn them on in system settings.'}
          </Text>
          {!canAskAgain && (
            <Pressable
              onPress={() => Linking.openSettings().catch(() => {})}
              style={styles.warnBtn}
              accessibilityRole="button"
              accessibilityLabel="Open system settings"
            >
              <MaterialCommunityIcons name="cog-outline" size={16} color="#842600" />
            </Pressable>
          )}
        </View>
      )}

      {enabled && (
        <View>
          <FieldLabel
            trailing={busy ? <Text style={styles.saving}>Saving…</Text> : null}
          >
            Remind me at
          </FieldLabel>

          <View style={styles.clock}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primaryFixed} />
            <Text style={styles.clockText}>{time}</Text>
          </View>

          {/* Disabled until the stored preference has loaded: until then these
              read the defaults, and a fast tap would save 21:30 over whatever
              time the user had actually set. */}
          <Stepper
            label="Hour"
            display={String(hour).padStart(2, '0')}
            disabled={loading}
            onDown={() => setTime(wrap(hour - 1, 24), minute)}
            onUp={() => setTime(wrap(hour + 1, 24), minute)}
          />
          <Stepper
            label="Minute"
            display={String(minute).padStart(2, '0')}
            disabled={loading}
            onDown={() => setTime(hour, wrap(minute - MINUTE_STEP, 60))}
            onUp={() => setTime(hour, wrap(minute + MINUTE_STEP, 60))}
          />
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.cardBg,
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
  },
  toggleText: { flex: 1, minWidth: 0 },
  toggleTitle: { ...typography.bodyMd, fontFamily: 'DMSans_500Medium', color: semantic.textPrimary },
  toggleSub: { ...typography.bodySm, color: semantic.textMuted },

  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#ffdbd0',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  warnText: { ...typography.bodySm, color: '#842600', flex: 1 },
  warnBtn: {
    width: 30, height: 30, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },

  saving: { ...typography.labelSm, color: semantic.textMuted },

  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 60,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryContainer,
  },
  clockText: {
    ...typography.headlineMd,
    fontFamily: 'JetBrainsMono_500Medium',
    color: colors.primaryFixed,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stepLabel: { ...typography.bodyMd, color: semantic.textPrimary },
  stepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: semantic.cardBg,
    borderRadius: radius.full,
    padding: 4,
  },
  stepBtn: {
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: semantic.trackBg,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnPressed: { opacity: 0.6 },
  stepValue: {
    ...typography.labelNumericLg,
    color: semantic.textPrimary,
    minWidth: 44,
    textAlign: 'center',
  },
});
