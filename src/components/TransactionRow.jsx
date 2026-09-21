import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, layout, radius, semantic, spacing, typography } from '../theme';
import { formatCurrency } from '../lib/format';

/**
 * A ledger line with swipe-to-reveal Edit / Delete.
 *
 * Uses the RN-Animated `Swipeable` rather than the Reanimated one: this project
 * has no babel.config.js, so relying on the Reanimated worklets plugin would be
 * a runtime gamble. Long-press is wired to the same edit action so the gesture
 * is never the only way to reach it.
 */
export default function TransactionRow({
  item, category, kind = 'expense', currency, onEdit, onDelete,
}) {
  const swipeRef = useRef(null);
  const isIncome = kind === 'income';
  const close = () => swipeRef.current?.close();

  const renderActions = (progress) => {
    const translate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [layout.swipeActionWidth, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.actions, { transform: [{ translateX: translate }] }]}>
        <Pressable
          onPress={() => { close(); onEdit(item); }}
          style={[styles.action, styles.edit]}
          accessibilityLabel={`Edit ${item.description}`}
        >
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primaryContainer} />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => { close(); onDelete(item); }}
          style={[styles.action, styles.delete]}
          accessibilityLabel={`Delete ${item.description}`}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={semantic.onExpense} />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderActions}
      overshootRight={false}
      rightThreshold={36}
      friction={1.8}
    >
      <Pressable
        onPress={() => onEdit(item)}
        onLongPress={() => onEdit(item)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${item.description}, ${formatCurrency(item.amount, currency)}, ${category.label}`}
        accessibilityHint="Opens the entry for editing. Swipe left for delete."
      >
        <View style={[styles.icon, { backgroundColor: `${category.color}1A` }]}>
          <MaterialCommunityIcons name={category.icon} size={20} color={category.color} />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{item.description}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{category.short.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.sub} numberOfLines={1}>
            {category.label}{item.note ? ` · ${item.note}` : ''}
          </Text>
        </View>

        <Text
          style={[styles.amount, isIncome ? styles.amountIn : styles.amountOut]}
          numberOfLines={1}
        >
          {isIncome ? '+' : '−'}{formatCurrency(item.amount, currency)}
        </Text>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.cardBg,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    minHeight: 64,
  },
  rowPressed: { backgroundColor: semantic.cardBgSubtle },
  icon: {
    width: 40, height: 40, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { ...typography.bodyLg, fontFamily: 'DMSans_500Medium', color: semantic.textPrimary, flexShrink: 1 },
  tag: {
    backgroundColor: semantic.trackBg,
    borderRadius: radius.DEFAULT,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  tagText: { ...typography.labelSm, fontSize: 9, color: semantic.textMuted },
  sub: { ...typography.bodySm, color: semantic.textMuted },
  amount: { ...typography.labelNumericMd, flexShrink: 0 },
  amountOut: { color: semantic.expense },
  amountIn: { color: '#1f6b43' },

  actions: { flexDirection: 'row', width: layout.swipeActionWidth },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  edit: { backgroundColor: '#f1e0ce' },
  editText: { ...typography.labelSm, color: colors.primaryContainer },
  delete: { backgroundColor: semantic.expense, borderTopRightRadius: radius.xl, borderBottomRightRadius: radius.xl },
  deleteText: { ...typography.labelSm, color: semantic.onExpense },
});
