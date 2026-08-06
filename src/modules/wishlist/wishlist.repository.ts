import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';
import { notFoundError } from '../../core/errors/domain-error';
import type { ShopperContext } from '../commerce/commerce-shopper.service';
import type { WishlistResponse } from './schemas/wishlist.schema';

export type WishlistDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class WishlistRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: WishlistDatabase,
  ) {}

  async findWishlistForShopper(shopper: ShopperContext) {
    if (shopper.kind === 'user') {
      return this.db.query.wishlists.findFirst({
        where: eq(schema.wishlists.userId, shopper.userId),
        with: {
          items: {
            with: {
              product: true,
              variant: true,
            },
          },
        },
      });
    }

    return this.db.query.wishlists.findFirst({
      where: eq(schema.wishlists.guestToken, shopper.guestToken),
      with: {
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }

  async createWishlist(shopper: ShopperContext) {
    const values =
      shopper.kind === 'user'
        ? { userId: shopper.userId }
        : { guestToken: shopper.guestToken };

    const [row] = await this.db
      .insert(schema.wishlists)
      .values(values)
      .returning();
    return row;
  }

  async findGuestWishlist(guestToken: string) {
    return this.db.query.wishlists.findFirst({
      where: eq(schema.wishlists.guestToken, guestToken),
      with: { items: true },
    });
  }

  async mergeGuestWishlistIntoUser(params: {
    userId: number;
    guestToken: string;
  }): Promise<void> {
    const guestWishlist = await this.findGuestWishlist(params.guestToken);
    if (!guestWishlist) {
      return;
    }

    let userWishlist = await this.db.query.wishlists.findFirst({
      where: eq(schema.wishlists.userId, params.userId),
    });

    if (!userWishlist) {
      const [created] = await this.db
        .insert(schema.wishlists)
        .values({ userId: params.userId })
        .returning();
      userWishlist = created;
    }

    await this.db.transaction(async (tx) => {
      for (const item of guestWishlist.items) {
        const existing = await tx.query.wishlistItems.findFirst({
          where: and(
            eq(schema.wishlistItems.wishlistId, userWishlist!.id),
            eq(schema.wishlistItems.productId, item.productId),
            item.variantId
              ? eq(schema.wishlistItems.variantId, item.variantId)
              : isNull(schema.wishlistItems.variantId),
          ),
        });

        if (!existing) {
          await tx.insert(schema.wishlistItems).values({
            wishlistId: userWishlist!.id,
            productId: item.productId,
            variantId: item.variantId,
          });
        }
      }

      await tx
        .delete(schema.wishlistItems)
        .where(eq(schema.wishlistItems.wishlistId, guestWishlist.id));
      await tx
        .delete(schema.wishlists)
        .where(eq(schema.wishlists.id, guestWishlist.id));
    });
  }

  async findItem(wishlistId: string, itemId: string) {
    return this.db.query.wishlistItems.findFirst({
      where: and(
        eq(schema.wishlistItems.id, itemId),
        eq(schema.wishlistItems.wishlistId, wishlistId),
      ),
    });
  }

  async findLine(params: {
    wishlistId: string;
    productId: string;
    variantId: string | null;
  }) {
    return this.db.query.wishlistItems.findFirst({
      where: and(
        eq(schema.wishlistItems.wishlistId, params.wishlistId),
        eq(schema.wishlistItems.productId, params.productId),
        params.variantId
          ? eq(schema.wishlistItems.variantId, params.variantId)
          : isNull(schema.wishlistItems.variantId),
      ),
    });
  }

  async insertItem(data: typeof schema.wishlistItems.$inferInsert) {
    const [row] = await this.db
      .insert(schema.wishlistItems)
      .values(data)
      .returning();
    return row;
  }

  async deleteItem(itemId: string) {
    await this.db
      .delete(schema.wishlistItems)
      .where(eq(schema.wishlistItems.id, itemId));
  }

  mapToResponse(
    wishlist: NonNullable<
      Awaited<ReturnType<WishlistRepository['findWishlistForShopper']>>
    >,
  ): WishlistResponse {
    const items = wishlist.items.map((item) => {
      const name =
        item.variant != null
          ? `${item.product.name} - ${item.variant.title}`
          : item.product.name;
      const sku =
        item.variant?.sku ?? item.product.sku ?? item.product.productCode;
      const price = item.variant?.price ?? item.product.price;
      const thumbnailUrl =
        item.variant?.thumbnailUrl ?? item.product.thumbnailUrl ?? null;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name,
        sku,
        price,
        thumbnailUrl,
      };
    });

    return {
      id: wishlist.id,
      items,
      itemCount: items.length,
    };
  }

  ensureFound<T>(value: T | undefined | null, code: string, message: string): T {
    if (!value) {
      throw notFoundError(code, message);
    }
    return value;
  }
}
