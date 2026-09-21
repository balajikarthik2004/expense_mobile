import { colors, radius, spacing, typography, shadows, gradients } from './tokens';

// Semantic aliases layered over the raw Stitch tokens, named for what the screens
// actually do rather than for M3 slots. Components should import these.
export const semantic = {
  screenBg: colors.surface,
  cardBg: colors.surfaceContainerLowest,
  cardBgSubtle: colors.surfaceContainerLow,
  railBg: colors.surfaceContainer,
  trackBg: colors.surfaceContainerHigh,

  textPrimary: colors.onSurface,
  textMuted: colors.onSurfaceVariant,
  hairline: colors.outlineVariant,

  // Expenses / destructive / primary CTA all share the rust ramp.
  expense: colors.secondary,
  expenseBright: colors.secondaryContainer,
  onExpense: colors.onSecondary,

  // Income / positive.
  income: colors.onTertiaryFixedVariant,
  incomeSurface: colors.tertiaryContainer,
  onIncomeSurface: colors.tertiaryFixed,
  onIncomeSurfaceMuted: colors.tertiaryFixedDim,

  // Ink — dark editorial blocks and the active segmented pill.
  ink: colors.primaryContainer,
  onInk: colors.primaryFixed,
  onInkMuted: colors.onPrimaryContainer,

  danger: colors.error,
  onDanger: colors.onError,
  dangerSurface: colors.errorContainer,
};

export const layout = {
  headerHeight: 64,
  tabBarHeight: 64,
  fabSize: 56,
  swipeActionWidth: 128, // matches the -128px reveal in the Stitch export
};

export { colors, radius, spacing, typography, shadows, gradients };

export default { colors, radius, spacing, typography, shadows, gradients, semantic, layout };
