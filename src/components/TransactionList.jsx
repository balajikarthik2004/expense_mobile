import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TransactionRow from './TransactionRow';
import { radius, semantic, spacing, typography } from '../theme';
import { formatCurrency, formatRelativeDate, groupByDate, sum } from '../lib/format';

function DateGroup({ date, items, kind, currency, resolve, onEdit, onDelete, collapsible }) {
  const [open, setOpen] = useState(true);
  const total = sum(items);
  const isIncome = kind === 'income';

  const Head = (
    <View style={styles.groupHead}>
      {collapsible && (
        <MaterialCommunityIcons
          name={open ? 'chevron-down' : 'chevron-right'}
          size={18}
          color={semantic.textMuted}
        />
      )}
      <Text style={styles.groupDate} numberOfLines={1}>{formatRelativeDate(date)}</Text>
      <View style={styles.countPill}>
        <Text style={styles.countText}>
          {items.length} {items.length === 1 ? 'folio' : 'folios'}
        </Text>
      </View>
      <Text style={[styles.groupTotal, isIncome ? styles.totalIn : styles.totalOut]} numberOfLines={1}>
        {isIncome ? '+' : '−'}{formatCurrency(total, currency)}
      </Text>
    </View>
  );

  return (
    <View style={styles.group}>
      {collapsible ? (
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${formatRelativeDate(date)}, ${items.length} entries`}
        >
          {Head}
        </Pressable>
      ) : (
        Head
      )}

      {open && (
        <View style={styles.rows}>
          {items.map((item) => (
            <TransactionRow
              key={item._id}
              item={item}
              category={resolve(item.category)}
              kind={kind}
              currency={currency}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/** Date-grouped ledger list. Expense groups collapse; income groups do not. */
export default function TransactionList({
  items, kind = 'expense', currency, resolve, onEdit, onDelete, collapsible = true,
}) {
  const groups = groupByDate(items);
  return (
    <View style={styles.list}>
      {groups.map(([date, rows]) => (
        <DateGroup
          key={date}
          date={date}
          items={rows}
          kind={kind}
          currency={currency}
          resolve={resolve}
          onEdit={onEdit}
          onDelete={onDelete}
          collapsible={collapsible}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupDate: { ...typography.headlineSm, color: semantic.textPrimary, flexShrink: 1 },
  countPill: {
    backgroundColor: semantic.trackBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countText: { ...typography.labelSm, color: semantic.textMuted },
  groupTotal: { ...typography.labelNumericSm, marginLeft: 'auto' },
  totalOut: { color: semantic.expense },
  totalIn: { color: '#1f6b43' },
  rows: { gap: spacing.sm },
});
