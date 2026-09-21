import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, semantic, spacing, typography } from '../theme';

export default function EmptyState({ icon, title, body, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={28} color={semantic.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!body && <Text style={styles.body}>{body}</Text>}
      {!!actionLabel && (
        <Pressable onPress={onAction} style={styles.action} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={16} color={semantic.onExpense} />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  iconWrap: {
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: semantic.trackBg, alignItems: 'center', justifyContent: 'center',
  },
  title: { ...typography.headlineSm, color: semantic.textPrimary, textAlign: 'center' },
  body: { ...typography.bodyMd, color: semantic.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: semantic.expense, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs,
  },
  actionText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: semantic.onExpense },
});
