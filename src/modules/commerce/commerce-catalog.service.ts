import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';
import {
  badRequestError,
  notFoundError,
} from '../../core/errors/domain-error';

export type CommerceDatabase = NodePgDatabase<typeof schema>;

export type PurchasableLine = {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  unitPrice: number;
  stockQty: number;
  availability: string;
  type: 'SIMPLE' | 'VARIABLE';
};

@Injectable()
export class CommerceCatalogService {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: CommerceDatabase,
  ) {}

  /**
   * Resolve product/variant for cart/wishlist/checkout with type rules and stock.
   */
  async resolvePurchasable(params: {
    productId: string;
    variantId?: string | null;
  }): Promise<PurchasableLine> {
    const product = await this.db.query.products.findFirst({
      where: and(
        eq(schema.products.id, params.productId),
        isNull(schema.products.deletedAt),
      ),
    });

    if (!product || !product.isActive) {
      throw notFoundError('product_not_found', 'Product not found');
    }

    if (product.type === 'VARIABLE') {
      if (!params.variantId) {
        throw badRequestError(
          'variantId is required for variable products',
        );
      }

      const variant = await this.db.query.productVariants.findFirst({
        where: and(
          eq(schema.productVariants.id, params.variantId),
          eq(schema.productVariants.productId, product.id),
          isNull(schema.productVariants.deletedAt),
        ),
      });

      if (!variant) {
        throw notFoundError('variant_not_found', 'Product variant not found');
      }

      return {
        productId: product.id,
        variantId: variant.id,
        name: `${product.name} - ${variant.title}`,
        sku: variant.sku,
        unitPrice: variant.price,
        stockQty: variant.stockQty,
        availability: variant.availability,
        type: 'VARIABLE',
      };
    }

    if (params.variantId) {
      throw badRequestError(
        'variantId must not be set for simple products',
      );
    }

    return {
      productId: product.id,
      variantId: null,
      name: product.name,
      sku: product.sku ?? product.productCode,
      unitPrice: product.price,
      stockQty: product.stockQty,
      availability: product.availability,
      type: 'SIMPLE',
    };
  }

  assertInStock(line: PurchasableLine, quantity: number): void {
    if (quantity < 1) {
      throw badRequestError('Quantity must be at least 1');
    }

    if (
      line.availability === 'OUT_OF_STOCK' ||
      line.stockQty < quantity
    ) {
      throw badRequestError(
        'Insufficient stock for the requested quantity',
        { available: line.stockQty },
      );
    }
  }
}
