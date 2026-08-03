/**
 * Build a stable fingerprint from option value IDs (sorted UUID join).
 */
export const buildOptionFingerprint = (optionValueIds: string[]): string =>
  [...optionValueIds].sort().join('|');
