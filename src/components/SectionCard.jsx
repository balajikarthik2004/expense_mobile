import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, semantic, spacing, typography } from '../theme';

/** Card shell with an optional collapsible header and trailing badge. */
export default function SectionCard({
  title, subtitle, icon, iconColor, badge, badgeTone = 'neutral',
  collapsible = false, defaultOpen = true, right, children, style,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const body = !collapsible || open;

  const Header = (
    <View style={styles.head}>
      {!!icon && (
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={18} color={iconColor || semantic.expense} />
        </View>
      )}
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
      </View>
      {!!badge && (
        <View style={[styles.badge, badgeTone === 'good' && styles.badgeGood, badgeTone === 'warn' && styles.badgeWarn]}>
          <Text
            style={[
              styles.badgeText,
              badgeTone === 'good' && styles.badgeTextGood,
              badgeTone === 'warn' && styles.badgeTextWarn,
            ]}
          >
            {badge}
          </Text>
        </View>
      )}
      {right}
      {collapsible && (
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={semantic.textMuted}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.card, style]}>
      {collapsible ? (
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={title}
        >
          {Header}
        </Pressable>
      ) : (
        Header
      )}
      {body && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: semantic.cardBgSubtle,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 34, height: 34, borderRadius: radius.full,
    backgroundColor: semantic.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { ...typography.headlineSm, color: semantic.textPrimary },
  subtitle: { ...typography.bodySm, color: semantic.textMuted },
  badge: {
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3,
    backgroundColor: semantic.trackBg,
  },
  badgeGood: { backgroundColor: '#d8f0dd' },
  badgeWarn: { backgroundColor: '#ffdbd0' },
  badgeText: { ...typography.labelSm, color: semantic.textMuted },
  badgeTextGood: { color: '#1b5e34' },
  badgeTextWarn: { color: '#842600' },
  body: { marginTop: spacing.md, gap: spacing.sm },
});
