import { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, semantic, spacing, typography } from '../theme';
import { toDateStr, today } from '../lib/format';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Month-grid date picker.
 *
 * Built in JS rather than pulled from @react-native-community/datetimepicker:
 * that package renders a platform dialog that looks nothing like this design,
 * and it needs a native module the web build does not have. This works
 * identically on iOS, Android and web.
 */
export default function DateField({ value, onChange, max = today(), min, label = 'Posting date' }) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const [cursor, setCursor] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) =>
        new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
    ];
  }, [cursor]);

  const isToday = value === today();
  const display = selected.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const shiftMonth = (delta) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const pick = (d) => {
    onChange(toDateStr(d));
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
          setOpen(true);
        }}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={label + ': ' + display + '. Opens a calendar.'}
      >
        <MaterialCommunityIcons name="calendar-blank-outline" size={19} color={semantic.expense} />
        <Text style={styles.fieldText} numberOfLines={1}>
          {display}{isToday ? ' (Today)' : ''}
        </Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{isToday ? 'CURRENT' : 'BACKDATED'}</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.navRow}>
              <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} style={styles.navBtn} accessibilityLabel="Previous month">
                <MaterialCommunityIcons name="chevron-left" size={22} color={semantic.textPrimary} />
              </Pressable>
              <Text style={styles.navTitle}>
                {cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable onPress={() => shiftMonth(1)} hitSlop={10} style={styles.navBtn} accessibilityLabel="Next month">
                <MaterialCommunityIcons name="chevron-right" size={22} color={semantic.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((d, i) => (
                <Text key={d + i} style={styles.weekday}>{d}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (!d) return <View key={'pad' + i} style={styles.cell} />;
                const str = toDateStr(d);
                const disabled = (max && str > max) || (min && str < min);
                const active = str === value;
                return (
                  <Pressable
                    key={str}
                    onPress={() => !disabled && pick(d)}
                    disabled={disabled}
                    style={styles.cell}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: !!disabled }}
                    accessibilityLabel={d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  >
                    <View style={[styles.cellInner, active && styles.cellInnerActive]}>
                      <Text
                        style={[
                          styles.cellText,
                          active && styles.cellTextActive,
                          disabled && styles.cellTextOff,
                        ]}
                      >
                        {d.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable onPress={() => pick(new Date())} style={styles.todayBtn} accessibilityRole="button">
                <Text style={styles.todayText}>Jump to today</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} style={styles.doneBtn} accessibilityRole="button">
                <Text style={styles.doneText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.trackBg,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  fieldText: { ...typography.bodyLg, color: semantic.textPrimary, flex: 1 },
  chip: { backgroundColor: semantic.cardBg, borderRadius: radius.DEFAULT, paddingHorizontal: 6, paddingVertical: 2 },
  chipText: { ...typography.labelSm, fontSize: 9, color: semantic.textMuted },

  scrim: {
    flex: 1,
    backgroundColor: 'rgba(28,28,25,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  navTitle: { ...typography.headlineSm, color: semantic.textPrimary },
  weekRow: { flexDirection: 'row' },
  weekday: { ...typography.labelSm, color: semantic.textMuted, flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellInner: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  cellInnerActive: { backgroundColor: semantic.expense },
  cellText: { ...typography.bodyMd, color: semantic.textPrimary },
  cellTextActive: { color: semantic.onExpense, fontFamily: 'DMSans_700Bold' },
  cellTextOff: { color: colors.outlineVariant },
  footer: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  todayBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: semantic.cardBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: { ...typography.bodyMd, color: semantic.textPrimary },
  doneBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: colors.primaryFixed },
});
