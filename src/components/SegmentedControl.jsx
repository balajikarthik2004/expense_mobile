import { View, Text, Pressable, StyleSheet } from 'react-native';
import { semantic, typography, spacing, radius, colors } from '../theme';

/** Period pill row — ink-filled active segment on a parchment rail. */
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.rail}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: 'row',
    backgroundColor: semantic.railBg,
    borderRadius: radius.xl,
    padding: spacing.xs,
    gap: spacing.xs / 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primaryContainer,
    shadowColor: '#231a0f',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: { ...typography.labelSm, color: semantic.textMuted },
  labelActive: { color: colors.primaryFixed, fontFamily: 'DMSans_700Bold' },
});
