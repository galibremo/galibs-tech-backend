/**
 * Returns whether a scheduled item is currently live.
 */
export function isWithinSchedule(
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (startsAt && startsAt > now) {
    return false;
  }
  if (endsAt && endsAt < now) {
    return false;
  }
  return true;
}

/**
 * Computes save amount and percent from regular and sale prices (integer BDT).
 */
export function computeProductSavings(
  price: number,
  regularPrice: number | null | undefined,
): { saveAmount: number | null; savePercent: number | null } {
  if (regularPrice == null || regularPrice <= price) {
    return { saveAmount: null, savePercent: null };
  }

  const saveAmount = regularPrice - price;
  const savePercent = Math.round((saveAmount / regularPrice) * 100);

  return { saveAmount, savePercent };
}
