import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { radius, semantic, spacing, typography } from '../../theme';
import { formatCurrency } from '../../lib/format';

const SIZE = 148;
const THICK = 22;
const R = (SIZE - THICK) / 2;
const C = SIZE / 2;

// Arc path with a 2px surface gap between neighbouring segments, per the mark spec.
const arc = (startDeg, endDeg) => {
  const toXY = (deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [C + R * Math.cos(rad), C + R * Math.sin(rad)];
  };
  const [x1, y1] = toXY(startDeg);
  const [x2, y2] = toXY(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2}`;
};

/**
 * Category split. Identity comes from the legend list beside it, never from the
 * ring alone — each legend row carries its own swatch, label and value.
 */
export default function DonutChart({ slices, total, currency, centerLabel = 'Total' }) {
  if (!slices.length || total <= 0) return null;

  // Anything under 2% collapses into "Other" rather than becoming an
  // unreadable sliver.
  const threshold = total * 0.02;
  const major = slices.filter((s) => s.amount >= threshold);
  const minorTotal = slices
    .filter((s) => s.amount < threshold)
    .reduce((sum, s) => sum + s.amount, 0);
  const shown = minorTotal > 0
    ? [...major, { id: '__other', label: 'Other categories', color: '#9a938b', amount: minorTotal }]
    : major;

  const GAP = 2.2;
  let cursor = 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={C} cy={C} r={R} stroke={semantic.trackBg} strokeWidth={THICK} fill="none" />
          <G>
            {shown.map((s) => {
              const sweep = (s.amount / total) * 360;
              const start = cursor;
              const end = cursor + sweep;
              cursor = end;
              if (sweep <= GAP) return null;
              return (
                <Path
                  key={s.id}
                  d={arc(start + GAP / 2, end - GAP / 2)}
                  stroke={s.color}
                  strokeWidth={THICK}
                  strokeLinecap="butt"
                  fill="none"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerLabel}>{centerLabel.toUpperCase()}</Text>
          <Text style={styles.centerValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {formatCurrency(total, currency)}
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        {shown.slice(0, 6).map((s) => (
          <View key={s.id} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{s.label}</Text>
            <Text style={styles.legendPct}>{Math.round((s.amount / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', paddingHorizontal: spacing.md },
  centerLabel: { ...typography.labelSm, fontSize: 9, color: semantic.textMuted },
  centerValue: { ...typography.labelNumericMd, color: semantic.textPrimary },
  legend: { flex: 1, minWidth: 0, gap: spacing.xs + 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 8, height: 8, borderRadius: radius.full, flexShrink: 0 },
  legendLabel: { ...typography.bodySm, color: semantic.textPrimary, flex: 1 },
  legendPct: { ...typography.labelNumericSm, color: semantic.textMuted },
});
