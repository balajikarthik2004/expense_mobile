import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, semantic, spacing, typography } from '../theme';

/**
 * Destructive-action confirm. Used instead of RN's Alert so the dialog carries
 * the app's typography and the destructive button is unmistakably the rust one.
 */
export default function ConfirmDialog({
  visible, title, body, confirmLabel = 'Delete', cancelLabel = 'Keep',
  destructive = true, busy = false, onConfirm, onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, !destructive && styles.iconWrapNeutral]}>
            <MaterialCommunityIcons
              name={destructive ? 'alert-outline' : 'help-circle-outline'}
              size={22}
              color={destructive ? semantic.expense : semantic.textPrimary}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          {!!body && <Text style={styles.body}>{body}</Text>}

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              style={styles.cancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              style={[styles.confirm, !destructive && styles.confirmNeutral, busy && styles.busy]}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>{busy ? 'Working…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(28,28,25,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: '#ffdbd0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapNeutral: { backgroundColor: semantic.trackBg },
  title: { ...typography.headlineSm, color: semantic.textPrimary, textAlign: 'center' },
  body: { ...typography.bodyMd, color: semantic.textMuted, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignSelf: 'stretch' },
  cancel: {
    flex: 1,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: semantic.cardBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...typography.bodyMd, color: semantic.textPrimary },
  confirm: {
    flex: 1,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: semantic.expense,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmNeutral: { backgroundColor: colors.primaryContainer },
  busy: { opacity: 0.7 },
  confirmText: { ...typography.bodyMd, fontFamily: 'DMSans_700Bold', color: semantic.onExpense },
});
