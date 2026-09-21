// KB_Expense — design tokens extracted verbatim from the Google Stitch project
// "KB Expense Mobile App" (project 7689753928201528472).
// The same token block appears in every exported screen, so this is the whole system.
//
// NOTE: Stitch generated a Material-3 style palette that does NOT match the existing
// web app's palette. See design/STITCH_DESIGN.md for the drift table before adopting.

export const colors = {
  // Surfaces (warm parchment ramp)
  surface: '#fcf9f4',
  surfaceBright: '#fcf9f4',
  surfaceDim: '#dcdad5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f6f3ee',
  surfaceContainer: '#f0ede9',
  surfaceContainerHigh: '#ebe8e3',
  surfaceContainerHighest: '#e5e2dd',
  surfaceVariant: '#e5e2dd',
  surfaceTint: '#695c4f',
  background: '#fcf9f4',

  // Foreground
  onSurface: '#1c1c19',
  onSurfaceVariant: '#4d463e',
  onBackground: '#1c1c19',
  outline: '#7e766d',
  outlineVariant: '#cfc5bb',
  inverseSurface: '#31302d',
  inverseOnSurface: '#f3f0eb',
  inversePrimary: '#d4c4b3',

  // Primary = ink / dark editorial (headers, active pills, dark cards)
  primary: '#000000',
  onPrimary: '#ffffff',
  primaryContainer: '#231a0f',
  onPrimaryContainer: '#908273',
  primaryFixed: '#f1e0ce',
  primaryFixedDim: '#d4c4b3',
  onPrimaryFixed: '#231a0f',
  onPrimaryFixedVariant: '#504538',

  // Secondary = rust / expenses / primary CTA
  secondary: '#a53c15',
  onSecondary: '#ffffff',
  secondaryContainer: '#ff7e52',
  onSecondaryContainer: '#6d1e00',
  secondaryFixed: '#ffdbd0',
  secondaryFixedDim: '#ffb59d',
  onSecondaryFixed: '#390b00',
  onSecondaryFixedVariant: '#842600',

  // Tertiary = forest / income / positive
  tertiary: '#000000',
  onTertiary: '#ffffff',
  tertiaryContainer: '#00210f',
  onTertiaryContainer: '#608e6d',
  tertiaryFixed: '#bceec8',
  tertiaryFixedDim: '#a1d2ad',
  onTertiaryFixed: '#00210f',
  onTertiaryFixedVariant: '#224f33',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
};

export const radius = {
  DEFAULT: 4,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 16,
  gutterSm: 12,
  margin: 20,
  marginMobile: 16,
};

// Three families: Playfair Display (editorial headlines), DM Sans (body/labels),
// JetBrains Mono (every numeric value).
export const typography = {
  headlineXl:       { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
  headlineXlMobile: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  headlineLg:       { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 28, lineHeight: 36, letterSpacing: -0.28 },
  headlineMd:       { fontFamily: 'PlayfairDisplay_500Medium',   fontSize: 22, lineHeight: 28 },
  headlineSm:       { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 18, lineHeight: 24 },

  bodyLg:           { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 24 },
  bodyMd:           { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 },
  bodySm:           { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16 },
  labelSm:          { fontFamily: 'DMSans_500Medium',  fontSize: 11, lineHeight: 14, letterSpacing: 0.44 },

  labelNumericLg:   { fontFamily: 'JetBrainsMono_500Medium',  fontSize: 24, lineHeight: 32, letterSpacing: -0.72 },
  labelNumericMd:   { fontFamily: 'JetBrainsMono_500Medium',  fontSize: 15, lineHeight: 20, letterSpacing: -0.3 },
  labelNumericSm:   { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, lineHeight: 16 },
};

// Shadows observed in the exports, translated to RN.
export const shadows = {
  header:  { shadowColor: '#000',    shadowOpacity: 0.04, shadowRadius: 8,  shadowOffset: { width: 0, height: 1 },  elevation: 2 },
  card:    { shadowColor: '#231a0f', shadowOpacity: 0.04, shadowRadius: 8,  shadowOffset: { width: 0, height: 2 },  elevation: 2 },
  avatar:  { shadowColor: '#231a0f', shadowOpacity: 0.12, shadowRadius: 6,  shadowOffset: { width: 0, height: 2 },  elevation: 3 },
  fab:     { shadowColor: '#a53c15', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },  elevation: 8 },
  navBar:  { shadowColor: '#231a0f', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -1 }, elevation: 8 },
};

// Gradients used on hero cards and the primary CTA (for expo-linear-gradient).
export const gradients = {
  // Sheet headers are fully opaque on purpose. The Stitch export ended these on
  // a translucent stop — rgba(105,92,79,0.6) — which let the cream surface bleed
  // through and turned the lower half of the header into grey haze with the
  // title sitting on top of it. Both stops are now solid, so the panel reads as
  // a deliberate block of colour instead of fog.
  sheetHeader:       ['#2a1a0b', '#6d3517'],          // Record Expense
  sheetHeaderIncome: ['#052012', '#17553a'],          // Record Income
  primaryCta:   ['#a53c15', '#ff7e52'],               // "Record ... in Ledger"
  incomeCta:    ['#1b5e34', '#3d8f5c'],
  categoryTile: ['#a53c15', '#ff7e52'],               // selected category tile
};

export default { colors, radius, spacing, typography, shadows, gradients };
