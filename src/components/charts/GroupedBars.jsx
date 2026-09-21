import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { axis, chart, series } from '../../theme/chart';
import { radius, semantic, spacing, typography } from '../../theme';
import { formatCurrency } from '../../lib/format';

const H = 150;
const PAD_T = 8;
const PAD_B = 20;

const SERIES = [
  { key: 'income',  label: 'Income',  color: series.income },
  { key: 'expense', label: 'Expense', color: series.expense },
  { key: 'savings', label: 'Savings', color: series.savings },
];

/**
 * Income / expense / savings per month.
 *
 * Three series on ONE shared scale — all three are rupee amounts, so a second
 * axis would be both unnecessary and misleading. Legend is always present, and
 * tapping a month direct-labels all three values, which is also what relieves
 * the gold's sub-3:1 contrast against the parchment surface.
 */
export default function GroupedBars({ data, currency, width }) {
  const [active, setActive] = useState(null);
  const w = Math.max(width, 160);

  if (!data.length) return null;

  const max = Math.max(...data.flatMap((d) => [d.income, d.expense, d.savings]), 1);
  const plotH = H - PAD_T - PAD_B;
  const groupW = w / data.length;
  const barW = Math.max(4, (groupW - chart.barGap * 4 - 8) / 3);
  const shown = active != null ? data[active] : null;

  return (
    <View>
      <View style={styles.legend}>
        {SERIES.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Svg width={w} height={H}>
        {[0, 0.5, 1].map((t) => (
          <Line
            key={t}
            x1={0}
            x2={w}
            y1={PAD_T + plotH * t}
            y2={PAD_T + plotH * t}
            stroke={axis.grid}
            strokeWidth={1}
          />
        ))}

        {data.map((d, gi) => {
          const groupX = gi * groupW + 4;
          return SERIES.map((s, si) => {
            const value = d[s.key];
            const h = Math.max(value > 0 ? 2 : 0, (value / max) * plotH);
            const x = groupX + si * (barW + chart.barGap);
            const dim = active != null && active !== gi;
            return (
              <Rect
                key={`${d.key}-${s.key}`}
                x={x}
                y={PAD_T + plotH - h}
                width={barW}
                height={h}
                rx={chart.barRadius}
                fill={s.color}
                opacity={dim ? 0.3 : 1}
              />
            );
          });
        })}

        <Line
          x1={0}
          x2={w}
          y1={PAD_T + plotH}
          y2={PAD_T + plotH}
          stroke={axis.baseline}
          strokeWidth={1}
        />
      </Svg>

      <View style={[styles.hitRow, { width: w }]}>
        {data.map((d, i) => (
          <Pressable
            key={d.key}
            onPress={() => setActive(active === i ? null : i)}
            style={styles.hit}
            accessibilityLabel={`${d.label}: income ${formatCurrency(d.income, currency)}, expense ${formatCurrency(d.expense, currency)}, savings ${formatCurrency(d.savings, currency)}`}
          />
        ))}
      </View>

      <View style={[styles.axisRow, { width: w }]}>
        {data.map((d, i) => (
          <Text
            key={d.key}
            style={[styles.axisLabel, active === i && styles.axisLabelActive]}
            numberOfLines={1}
          >
            {d.label}
          </Text>
        ))}
      </View>

      {!!shown && (
        <View style={styles.readout}>
          <Text style={styles.readoutTitle}>{shown.label}</Text>
          {SERIES.map((s) => (
            <View key={s.key} style={styles.readoutRow}>
              <View style={[styles.swatch, { backgroundColor: s.color }]} />
              <Text style={styles.readoutLabel}>{s.label}</Text>
              <Text style={styles.readoutValue}>{formatCurrency(shown[s.key], currency)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 8, height: 8, borderRadius: radius.full },
  legendText: { ...typography.bodySm, color: semantic.textMuted },

  hitRow: { position: 'absolute', top: 22, height: H - PAD_B, flexDirection: 'row' },
  hit: { flex: 1, minWidth: 0 },
  axisRow: { flexDirection: 'row', marginTop: -PAD_B + 2 },
  axisLabel: { ...typography.bodySm, fontSize: 10, color: axis.label, flex: 1, textAlign: 'center' },
  axisLabelActive: { color: semantic.textPrimary, fontFamily: 'DMSans_700Bold' },

  readout: {
    marginTop: spacing.sm,
    backgroundColor: semantic.cardBgSubtle,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  readoutTitle: { ...typography.labelSm, color: semantic.textMuted },
  readoutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  readoutLabel: { ...typography.bodySm, color: semantic.textPrimary, flex: 1 },
  readoutValue: { ...typography.labelNumericSm, color: semantic.textPrimary },
});
