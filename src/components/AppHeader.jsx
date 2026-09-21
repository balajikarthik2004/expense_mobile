import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, semantic, typography, spacing, layout, radius } from '../theme';
import Emblem from './Emblem';

/**
 * The fixed translucent header shared by every screen in the Stitch design:
 * emblem + title/eyebrow on the left, share and profile actions on the right.
 */
export default function AppHeader({
  title,
  eyebrow = 'KB_Expense Ledger',
  onBack,
  onShare,
  onProfile,
  right,
}) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={40} tint="light" style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {onBack && (
            <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Go back">
              <MaterialCommunityIcons name="chevron-left" size={26} color={semantic.textPrimary} />
            </Pressable>
          )}
          <Emblem size={32} />
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {!!eyebrow && <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text>}
          </View>
        </View>

        <View style={styles.right}>
          {right}
          {onShare && (
            <Pressable onPress={onShare} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Export ledger records">
              <MaterialCommunityIcons name="export-variant" size={21} color={semantic.textMuted} />
            </Pressable>
          )}
          {onProfile && (
            <Pressable onPress={onProfile} hitSlop={8} style={styles.avatarBtn} accessibilityLabel="Account profile">
              <View style={styles.avatarFallback}>
                <MaterialCommunityIcons name="account" size={18} color={semantic.onInkMuted} />
              </View>
            </Pressable>
          )}
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    // BlurView alone reads too transparent over busy lists; a wash keeps text legible.
    backgroundColor: Platform.select({ ios: 'rgba(252,249,244,0.72)', default: 'rgba(252,249,244,0.94)' }),
    ...{
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
  },
  row: {
    height: layout.headerHeight,
    paddingHorizontal: spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1, minWidth: 0 },
  titleBlock: { flexShrink: 1, minWidth: 0 },
  title: { ...typography.headlineSm, color: semantic.textPrimary },
  eyebrow: { ...typography.labelSm, color: semantic.textMuted, textTransform: 'uppercase' },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 0 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  avatarBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
