/**
 * Build a display title from option value labels (e.g. "Black / 256GB").
 */
export const buildVariantTitle = (labels: string[]): string =>
  labels.join(' / ');
