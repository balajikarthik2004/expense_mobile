import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

/**
 * The KB ledger emblem, rebuilt locally.
 *
 * The Stitch export referenced a googleusercontent.com URL that will expire, so
 * this reproduces the mark in code: dark ink tile, hairline inset rule, "K" in
 * parchment and "B" in rust.
 */
export default function Emblem({ size = 32 }) {
  const inset = Math.round(size * 0.09);
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <View
        style={[
          styles.rule,
          { top: inset, left: inset, right: inset, bottom: inset, borderRadius: size * 0.2 },
        ]}
      />
      <Text style={[styles.text, { fontSize: size * 0.42 }]}>
        <Text style={styles.k}>K</Text>
        <Text style={styles.b}>B</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rule: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(241,224,206,0.35)',
    borderStyle: 'dotted',
  },
  text: { fontFamily: 'PlayfairDisplay_600SemiBold', letterSpacing: -0.5 },
  k: { color: colors.primaryFixed },
  b: { color: colors.secondaryContainer },
});

export { radius };
