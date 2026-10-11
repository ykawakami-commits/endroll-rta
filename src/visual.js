// Japanese UI matches the font stack used by Pancake Canvas.
// Keep these canvas fonts aligned with --sans and --display in style.css.
export const VISUAL = Object.freeze({
  uiFont: '"Hiragino Maru Gothic ProN", "Zen Maru Gothic", "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", "Meiryo", system-ui, sans-serif',
  // Use local fallbacks for the rolling names so unseen Unicode ranges never wait for a webfont.
  creditFont: 'Arial, "Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", system-ui, sans-serif',
  displayFont: '"Chakra Petch", "Arial", sans-serif',
});
