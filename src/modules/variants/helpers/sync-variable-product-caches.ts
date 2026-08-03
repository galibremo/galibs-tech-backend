import { and, eq, isNull, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import schema from 'src/core/database/drizzle/drizzle.schema';

type VariantsDatabase = NodePgDatabase<typeof schema>;

/**
 * Refresh parent product min/max price and stock from non-deleted variants.
 */
export async function syncVariableProductCaches(
  db: VariantsDatabase,
  productId: string,
): Promise<void> {
  const [aggregates] = await db
    .select({
      minPrice: sql<number>`coalesce(min(${schema.productVariants.price}), 0)`,
      maxPrice: sql<number>`coalesce(max(${schema.productVariants.price}), 0)`,
      stockQty: sql<number>`coalesce(sum(${schema.productVariants.stockQty}), 0)`,
      variantCount: sql<number>`count(*)::int`,
    })
    .from(schema.productVariants)
    .where(
      and(
        eq(schema.productVariants.productId, productId),
        isNull(schema.productVariants.deletedAt),
      ),
    );

  const stockQty = Number(aggregates?.stockQty ?? 0);
  const variantCount = Number(aggregates?.variantCount ?? 0);
  const minPrice = Number(aggregates?.minPrice ?? 0);
  const maxPrice = Number(aggregates?.maxPrice ?? 0);

  let availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK' = 'OUT_OF_STOCK';
  if (variantCount > 0 && stockQty > 0) {
    availability = stockQty <= 5 ? 'LOW_STOCK' : 'IN_STOCK';
  }

  await db
    .update(schema.products)
    .set({
      price: minPrice,
      maxPrice: variantCount > 0 ? maxPrice : null,
      stockQty,
      availability,
    })
    .where(eq(schema.products.id, productId));
}
