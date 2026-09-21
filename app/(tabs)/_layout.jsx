import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, semantic, typography, spacing, radius, shadows, layout } from '../../src/theme';

const TABS = [
  { name: 'index',     label: 'Dashboard', icon: 'wallet-outline' },
  { name: 'income',    label: 'Income',    icon: 'trending-up' },
  { name: 'analytics', label: 'Analytics', icon: 'chart-bar' },
  { name: 'settings',  label: 'Settings',  icon: 'tune-variant' },
];

function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      <View style={styles.barRow}>
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={styles.tab}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={24}
                color={focused ? semantic.expense : semantic.textMuted}
              />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = (next) => {
    setOpen(next);
    Animated.spring(anim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
  };

  const go = (path) => {
    toggle(false);
    router.push(path);
  };

  const base = layout.tabBarHeight + insets.bottom + spacing.md;

  // Speed-dial: expense is the common case and sits closest to the thumb, but
  // income should not require a trip to another tab to reach.
  const actions = [
    { key: 'income',  label: 'Add income',  icon: 'cash-plus',       path: '/add-income',  tint: colors.tertiaryContainer, offset: 132 },
    { key: 'expense', label: 'Add expense', icon: 'receipt-text-outline', path: '/add-expense', tint: colors.primaryContainer,  offset: 72 },
  ];

  return (
    <View style={styles.flex}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface } }}
      >
        {TABS.map((t) => (
          <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
        ))}
      </Tabs>

      {open && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => toggle(false)}
          accessibilityLabel="Close quick add menu"
        >
          <View style={styles.scrim} />
        </Pressable>
      )}

      {actions.map((a) => (
        <Animated.View
          key={a.key}
          pointerEvents={open ? 'auto' : 'none'}
          style={[
            styles.action,
            {
              bottom: base + a.offset,
              opacity: anim,
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.actionLabel}>
            <Text style={styles.actionLabelText}>{a.label}</Text>
          </View>
          <Pressable
            onPress={() => go(a.path)}
            style={[styles.actionBtn, { backgroundColor: a.tint }]}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <MaterialCommunityIcons name={a.icon} size={22} color="#fff" />
          </Pressable>
        </Animated.View>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close quick add menu' : 'Quick add ledger entry'}
        accessibilityState={{ expanded: open }}
        onPress={() => toggle(!open)}
        style={({ pressed }) => [styles.fab, { bottom: base }, pressed && styles.fabPressed]}
      >
        <Animated.View
          style={{
            transform: [
              { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) },
            ],
          }}
        >
          <MaterialCommunityIcons name="plus" size={28} color={semantic.onExpense} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  bar: {
    backgroundColor: Platform.select({ ios: 'rgba(252,249,244,0.92)', default: colors.surface }),
    ...shadows.navBar,
  },
  barRow: {
    height: layout.tabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.gutter,
  },
  tab: { minWidth: 56, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { ...typography.labelSm, color: semantic.textMuted, marginTop: spacing.xs },
  tabLabelActive: { color: semantic.expense, fontFamily: 'DMSans_700Bold' },

  scrim: { flex: 1, backgroundColor: 'rgba(28,28,25,0.35)' },

  fab: {
    position: 'absolute',
    right: spacing.gutter,
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: radius.full,
    backgroundColor: semantic.expense,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },

  action: {
    position: 'absolute',
    right: spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionLabel: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    ...shadows.card,
  },
  actionLabelText: { ...typography.bodyMd, color: semantic.textPrimary },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
});
