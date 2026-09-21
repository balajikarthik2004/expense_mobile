import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { axis, chart } from '../../theme/chart';
import { radius, semantic, spacing, typography } from '../../theme';
import { formatCurrency } from '../../lib/format';

const H = 132;
const PAD_T = 12;
const PAD_B = 22;

// Catmull-Rom → cubic Bézier. A monotone-ish smoothing that will not overshoot
// into negative territory the way a naive spline does on spiky spend data.
const smoothPath = (pts) => {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
};

/**
 * Single-series trend. One series needs no legend — the title names it — so the
 * only identity cue required is the tapped-point readout.
 */
export default function AreaTrend({ data, color, currency, width, id = 'trend' }) {
  const [active, setActive] = useState(null);
  const w = Math.max(width, 120);

  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const plotH = H - PAD_T - PAD_B;
  const pts = data.map((d, i) => ({
    x: data.length > 1 ? i * step : w / 2,
    y: PAD_T + plotH - (d.value / max) * plotH,
    ...d,
  }));

  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1].x},${PAD_T + plotH} L${pts[0].x},${PAD_T + plotH} Z`;
  const shown = active != null ? pts[active] : null;

  return (
    <View>
      <View style={styles.readoutRow}>
        <Text style={styles.readoutLabel}>
          {shown ? shown.fullLabel : `Peak · ${pts.reduce((a, b) => (b.value > a.value ? b : a)).fullLabel}`}
        </Text>
        <Text style={[styles.readoutValue, { color }]}>
          {formatCurrency(
            shown ? shown.value : Math.max(...data.map((d) => d.value)),
            currency,
          )}
        </Text>
      </View>

      <Svg width={w} height={H}>
        <Defs>
          <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.18" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

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

        <Path d={area} fill={`url(#${id}-fill)`} />
        <Path
          d={line}
          stroke={color}
          strokeWidth={chart.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pts.map((p, i) => (
          <Circle
            key={p.key}
            cx={p.x}
            cy={p.y}
            r={active === i ? 6 : chart.dotRadius}
            fill={color}
            stroke={semantic.cardBg}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Touch targets are full-height columns, far larger than the 8px marks. */}
      <View style={[styles.hitRow, { width: w }]} pointerEvents="box-none">
        {pts.map((p, i) => (
          <Pressable
            key={p.key}
            onPress={() => setActive(active === i ? null : i)}
            style={styles.hit}
            accessibilityLabel={`${p.fullLabel}: ${formatCurrency(p.value, currency)}`}
          />
        ))}
      </View>

      <View style={[styles.axisRow, { width: w }]}>
        {pts.map((p, i) => (
          <Text
            key={p.key}
            style={[styles.axisLabel, active === i && { color, fontFamily: 'DMSans_700Bold' }]}
            numberOfLines={1}
          >
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  readoutLabel: { ...typography.bodySm, color: semantic.textMuted },
  readoutValue: { ...typography.labelNumericMd },
  hitRow: { position: 'absolute', top: 24, bottom: PAD_B, flexDirection: 'row' },
  hit: { flex: 1, minWidth: 0 },
  axisRow: { flexDirection: 'row', marginTop: -PAD_B + 4 },
  axisLabel: { ...typography.bodySm, fontSize: 10, color: axis.label, flex: 1, textAlign: 'center' },
});
