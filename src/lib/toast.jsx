import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, semantic, spacing, typography } from '../theme';

const ToastContext = createContext(null);

const TONE = {
  success: { icon: 'check-circle-outline', tint: '#a1d2ad' },
  error:   { icon: 'alert-circle-outline', tint: '#ffb59d' },
  info:    { icon: 'information-outline',  tint: colors.primaryFixed },
};

/**
 * Snackbar host. RN's Alert is modal and jarring for a confirmation of an
 * action the user just took, so writes report through this instead and reserve
 * Alert-style dialogs for destructive confirms.
 */
export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true })
      .start(() => setToast(null));
  }, [opacity]);

  const show = useCallback(
    (message, tone = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, tone === 'error' ? 4200 : 2600);
    },
    [hide, opacity],
  );

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const value = useMemo(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
    }),
    [show],
  );

  const tone = toast ? TONE[toast.tone] ?? TONE.info : TONE.info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {!!toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { opacity, bottom: insets.bottom + spacing.xl * 3 }]}
        >
          <Pressable onPress={hide} style={styles.toast} accessibilityRole="alert">
            <MaterialCommunityIcons name={tone.icon} size={18} color={tone.tint} />
            <Text style={styles.text} numberOfLines={3}>{toast.message}</Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.gutter, right: spacing.gutter, zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    shadowColor: '#231a0f',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: { ...typography.bodyMd, color: colors.primaryFixed, flex: 1 },
});
