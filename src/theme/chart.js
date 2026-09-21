// Chart-specific palette.
//
// The UI rust and gold are reused verbatim, but the UI forest green (#224f33)
// fails as a chart mark: it sits below the lightness band, reads near-gray at
// chroma 0.069, and lands only ΔE 5.0 from the rust under protanopia — the
// classic red/green confusion, on the one chart where income and expense bars
// sit side by side. #1f9e63 is the nearest green that clears all four checks
// (worst adjacent ΔE 12.2 deutan / 27.3 normal) against the card surface.
//
// Verified with the dataviz validator:
//   validate_palette.js "#1f9e63,#a53c15,#d4a843" --mode light --surface #f6f3ee
export const series = {
  income: '#1f9e63',
  expense: '#a53c15',
  savings: '#d4a843',
};

// Gold sits under 3:1 against the parchment surface, so every chart that uses it
// ships a legend plus direct value labels rather than relying on the fill alone.
export const axis = {
  grid: 'rgba(35,26,15,0.08)',
  label: '#7e766d',
  baseline: 'rgba(35,26,15,0.16)',
};

export const chart = {
  // Thin marks, per the mark spec.
  strokeWidth: 2,
  dotRadius: 4,
  barRadius: 4,
  barGap: 2,
};

export default { series, axis, chart };
