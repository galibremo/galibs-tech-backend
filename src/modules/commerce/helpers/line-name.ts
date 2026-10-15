/**
 * Display name for a cart / order line.
 *
 * Variant titles are normally just the option labels ("32GB / 512GB"), so the
 * product name is prefixed. If a title already starts with the product name
 * (older seed data, or an admin who typed the full name), it is used as-is so
 * the name is never doubled.
 */
export const buildLineName = (
  productName: string,
  variantTitle?: string | null,
): string => {
  const title = variantTitle?.trim();
  if (!title) return productName;
  if (title.toLowerCase().startsWith(productName.trim().toLowerCase())) {
    return title;
  }
  return `${productName} - ${title}`;
};
