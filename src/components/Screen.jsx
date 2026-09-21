import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import { colors, spacing, layout, semantic } from '../theme';

/**
 * Standard screen shell: fixed blurred header, scrolling body padded clear of
 * the header, tab bar and FAB.
 */
export default function Screen({
  title,
  eyebrow,
  onBack,
  onShare,
  onProfile,
  headerRight,
  scroll = true,
  refreshing,
  onRefresh,
  contentStyle,
  children,
}) {
  const insets = useSafeAreaInsets();
  const padTop = insets.top + layout.headerHeight + spacing.sm;
  // Clear the tab bar plus the FAB that floats above it.
  const padBottom = layout.tabBarHeight + layout.fabSize + spacing.xl;

  const body = (
    <View style={[styles.body, { paddingTop: padTop, paddingBottom: padBottom }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      <AppHeader
        title={title}
        eyebrow={eyebrow}
        onBack={onBack}
        onShare={onShare}
        onProfile={onProfile}
        right={headerRight}
      />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={semantic.expense}
                colors={[semantic.expense]}
                progressViewOffset={padTop}
              />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { flexGrow: 1 },
  body: { flex: 1, paddingHorizontal: spacing.gutter, gap: spacing.md },
});
