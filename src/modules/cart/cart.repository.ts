import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';
import { notFoundError } from '../../core/errors/domain-error';
import type { ShopperContext } from '../commerce/commerce-shopper.service';
import type { CartResponse } from './schemas/cart.schema';

export type CartDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class CartRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: CartDatabase,
  ) {}

  async findActiveCartForShopper(shopper: ShopperContext) {
    if (shopper.kind === 'user') {
      return this.db.query.carts.findFirst({
        where: and(
          eq(schema.carts.userId, shopper.userId),
          eq(schema.carts.status, 'ACTIVE'),
        ),
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

    return this.db.query.carts.findFirst({
      where: and(
        eq(schema.carts.guestToken, shopper.guestToken),
        eq(schema.carts.status, 'ACTIVE'),
      ),
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

  async createActiveCart(shopper: ShopperContext) {
    const values =
      shopper.kind === 'user'
        ? { userId: shopper.userId, status: 'ACTIVE' as const }
        : { guestToken: shopper.guestToken, status: 'ACTIVE' as const };

    const [cart] = await this.db.insert(schema.carts).values(values).returning();
    return cart;
  }

  async findGuestActiveCart(guestToken: string) {
    return this.db.query.carts.findFirst({
      where: and(
        eq(schema.carts.guestToken, guestToken),
        eq(schema.carts.status, 'ACTIVE'),
      ),
      with: {
        items: true,
      },
    });
  }

  /**
   * Merge guest cart items into the user cart, then convert the guest cart.
   */
  async mergeGuestCartIntoUser(params: {
    userId: number;
    guestToken: string;
  }): Promise<void> {
    const guestCart = await this.findGuestActiveCart(params.guestToken);
    if (!guestCart || guestCart.items.length === 0) {
      if (guestCart) {
        await this.db
          .update(schema.carts)
          .set({ status: 'CONVERTED' })
          .where(eq(schema.carts.id, guestCart.id));
      }
      return;
    }

    let userCart = await this.db.query.carts.findFirst({
      where: and(
        eq(schema.carts.userId, params.userId),
        eq(schema.carts.status, 'ACTIVE'),
      ),
    });

    if (!userCart) {
      const [created] = await this.db
        .insert(schema.carts)
        .values({ userId: params.userId, status: 'ACTIVE' })
        .returning();
      userCart = created;
    }

    await this.db.transaction(async (tx) => {
      for (const item of guestCart.items) {
        const existing = await tx.query.cartItems.findFirst({
          where: and(
            eq(schema.cartItems.cartId, userCart.id),
            eq(schema.cartItems.productId, item.productId),
            item.variantId
              ? eq(schema.cartItems.variantId, item.variantId)
              : isNull(schema.cartItems.variantId),
          ),
        });

        if (existing) {
          await tx
            .update(schema.cartItems)
            .set({
              quantity: existing.quantity + item.quantity,
              unitPrice: item.unitPrice,
            })
            .where(eq(schema.cartItems.id, existing.id));
        } else {
          await tx.insert(schema.cartItems).values({
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          });
        }
      }

      await tx
        .update(schema.carts)
        .set({ status: 'CONVERTED' })
        .where(eq(schema.carts.id, guestCart.id));
    });
  }

  async findCartItem(cartId: string, itemId: string) {
    return this.db.query.cartItems.findFirst({
      where: and(
        eq(schema.cartItems.id, itemId),
        eq(schema.cartItems.cartId, cartId),
      ),
    });
  }

  async findLineByProductVariant(params: {
    cartId: string;
    productId: string;
    variantId: string | null;
  }) {
    return this.db.query.cartItems.findFirst({
      where: and(
        eq(schema.cartItems.cartId, params.cartId),
        eq(schema.cartItems.productId, params.productId),
        params.variantId
          ? eq(schema.cartItems.variantId, params.variantId)
          : isNull(schema.cartItems.variantId),
      ),
    });
  }

  async insertItem(data: typeof schema.cartItems.$inferInsert) {
    const [row] = await this.db.insert(schema.cartItems).values(data).returning();
    return row;
  }

  async updateItemQuantity(itemId: string, quantity: number, unitPrice: number) {
    const [row] = await this.db
      .update(schema.cartItems)
      .set({ quantity, unitPrice })
      .where(eq(schema.cartItems.id, itemId))
      .returning();
    return row;
  }

  async deleteItem(itemId: string) {
    await this.db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.id, itemId));
  }

  async clearItems(cartId: string) {
    await this.db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.cartId, cartId));
  }

  async markConverted(cartId: string) {
    await this.db
      .update(schema.carts)
      .set({ status: 'CONVERTED' })
      .where(eq(schema.carts.id, cartId));
  }

  mapCartToResponse(
    cart: NonNullable<Awaited<ReturnType<CartRepository['findActiveCartForShopper']>>>,
  ): CartResponse {
    const items = cart.items.map((item) => {
      const name =
        item.variant != null
          ? `${item.product.name} - ${item.variant.title}`
          : item.product.name;
      const sku =
        item.variant?.sku ?? item.product.sku ?? item.product.productCode;
      const thumbnailUrl =
        item.variant?.thumbnailUrl ?? item.product.thumbnailUrl ?? null;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name,
        sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
        thumbnailUrl,
      };
    });

    return {
      id: cart.id,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    };
  }

  ensureCartFound<T>(cart: T | undefined | null): T {
    if (!cart) {
      throw notFoundError('cart_not_found', 'Cart not found');
    }
    return cart;
  }
}
