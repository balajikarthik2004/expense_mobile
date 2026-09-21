import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, semantic, spacing, typography } from '../theme';
import { CURRENCY_SYMBOL, formatCurrency } from '../lib/format';

/** Uppercase field caption used throughout the entry sheets. */
export function FieldLabel({ children, trailing }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{String(children).toUpperCase()}</Text>
      {trailing}
    </View>
  );
}

// Round numbers people actually reach for, cheapest-first.
const QUICK_ADD = [100, 500, 1000, 5000];

/**
 * The amount well.
 *
 * Value is held as a string so a half-typed "12." is not coerced mid-edit.
 * Quick-add chips increment rather than replace — on a phone, tapping "+500"
 * twice beats typing four digits.
 */
export function AmountField({ value, onChange, currency, tone = 'expense' }) {
  const isIncome = tone === 'income';
  const accent = isIncome ? '#1b5e34' : semantic.expense;
  const amount = Number(value) || 0;

  const bump = (delta) => onChange(String(Math.round(amount + delta)));

  return (
    <View>
      <FieldLabel
        trailing={
          <View style={[styles.entryChip, isIncome && styles.entryChipIn]}>
            <MaterialCommunityIcons
              name={isIncome ? 'arrow-top-right-thick' : 'arrow-bottom-left-thick'}
              size={11}
              color={accent}
            />
            <Text style={[styles.entryChipText, { color: accent }]}>
              {isIncome ? 'Credit' : 'Debit'}
            </Text>
          </View>
        }
      >
        Entry value
      </FieldLabel>

      <View style={[styles.amountWell, { borderColor: accent + '2E' }]}>
        <Text style={[styles.currency, { color: accent }]}>
          {CURRENCY_SYMBOL[currency] || currency}
        </Text>
        <TextInput
          style={styles.amountInput}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
          placeholder="0"
          placeholderTextColor={colors.outlineVariant}
          keyboardType="decimal-pad"
          accessibilityLabel="Amount"
        />
        {amount > 0 && (
          <Pressable
            onPress={() => onChange('')}
            hitSlop={10}
            style={styles.clearBtn}
            accessibilityLabel="Clear amount"
          >
            <MaterialCommunityIcons name="close" size={15} color={semantic.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.quickRow}>
        {QUICK_ADD.map((n) => (
          <Pressable
            key={n}
            onPress={() => bump(n)}
            style={styles.quickChip}
            accessibilityRole="button"
            accessibilityLabel={`Add ${n} to the amount`}
          >
            <Text style={styles.quickText}>
              +{formatCurrency(n, currency).replace(/^[^\d]*/, '')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function TextField({
  label, value, onChange, placeholder, icon, multiline, maxLength, autoCapitalize = 'sentences',
}) {
  return (
    <View>
      <FieldLabel
        trailing={
          multiline && maxLength ? (
            <Text style={styles.counter}>{value.length} / {maxLength}</Text>
          ) : null
        }
      >
        {label}
      </FieldLabel>
      <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
        {!!icon && (
          <View style={[styles.leadIcon, multiline && styles.leadIconTop]}>
            <MaterialCommunityIcons name={icon} size={17} color={semantic.textMuted} />
          </View>
        )}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          multiline={multiline}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

/**
 * Icon tile grid.
 *
 * Each tile carries its own category colour rather than a uniform grey, so the
 * grid is scannable by hue. Selection is signalled three ways — fill, bold
 * label and a check badge — so it never rests on colour alone.
 */
export function CategoryGrid({ categories, value, onChange, label = 'Ledger classification' }) {
  const selected = categories.find((c) => c.id === value);
  return (
    <View>
      <FieldLabel
        trailing={
          selected ? (
            <View style={styles.selectedPill}>
              <View style={[styles.selectedDot, { backgroundColor: selected.color }]} />
              <Text style={styles.selectedName} numberOfLines={1}>{selected.label}</Text>
            </View>
          ) : null
        }
      >
        {label}
      </FieldLabel>

      <View style={styles.grid}>
        {categories.map((cat) => {
          const active = cat.id === value;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onChange(cat.id)}
              style={[styles.tile, active && { backgroundColor: cat.color, borderColor: cat.color }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={cat.label}
            >
              {active && (
                <View style={styles.check}>
                  <MaterialCommunityIcons name="check" size={10} color={cat.color} />
                </View>
              )}
              <View
                style={[
                  styles.tileIcon,
                  { backgroundColor: active ? 'rgba(255,255,255,0.22)' : `${cat.color}1F` },
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={19}
                  color={active ? '#fff' : cat.color}
                />
              </View>
              <Text style={[styles.tileText, active && styles.tileTextActive]} numberOfLines={1}>
                {cat.short}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Pill row used for frequency and other small enum choices. */
export function ChoiceRow({ label, options, value, onChange }) {
  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.choiceRow}>
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={[styles.choice, active && styles.choiceActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
    gap: spacing.sm,
  },
  label: { ...typography.labelSm, color: semantic.textMuted, letterSpacing: 0.6 },
  counter: { ...typography.labelNumericSm, color: semantic.textMuted },

  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: semantic.cardBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexShrink: 1,
  },
  selectedDot: { width: 7, height: 7, borderRadius: radius.full },
  selectedName: { ...typography.bodySm, color: semantic.textPrimary, flexShrink: 1 },

  entryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffdbd0',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  entryChipIn: { backgroundColor: '#d8f0dd' },
  entryChipText: { ...typography.labelSm, fontFamily: 'DMSans_700Bold' },

  amountWell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.cardBg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    height: 76,
  },
  currency: { ...typography.headlineMd, fontFamily: 'JetBrainsMono_500Medium' },
  amountInput: {
    flex: 1,
    ...typography.headlineLg,
    fontFamily: 'JetBrainsMono_500Medium',
    color: semantic.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: semantic.trackBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickChip: {
    flex: 1,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: semantic.trackBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { ...typography.labelNumericSm, color: semantic.textPrimary },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.trackBg,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm + 2,
    minHeight: 54,
  },
  inputRowMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm + 4, minHeight: 100 },
  leadIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
    backgroundColor: semantic.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadIconTop: { marginTop: 2 },
  input: { flex: 1, ...typography.bodyLg, color: semantic.textPrimary, paddingVertical: 0 },
  inputMultiline: { minHeight: 68 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    // Fixed width, never flexGrow: a short final row (income has 7 categories,
    // so the last row holds 3) would otherwise stretch its tiles wider than the
    // full rows above it.
    width: '23%',
    minWidth: 62,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: semantic.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  check: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { ...typography.bodySm, color: semantic.textPrimary },
  tileTextActive: { color: '#fff', fontFamily: 'DMSans_700Bold' },

  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    // Card-white, not cardBgSubtle: these pills sit on a SectionCard that is
    // itself cardBgSubtle, so the subtle tone made unselected options invisible.
    backgroundColor: semantic.cardBg,
  },
  choiceActive: { backgroundColor: colors.primaryContainer },
  choiceText: { ...typography.bodyMd, color: semantic.textPrimary },
  choiceTextActive: { color: colors.primaryFixed, fontFamily: 'DMSans_700Bold' },
});
