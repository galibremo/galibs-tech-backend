import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';
import type { ShippingAddress } from 'src/core/database/schema/drizzle/commerce.drizzle.schema';
import { notFoundError } from '../../core/errors/domain-error';
import type { OrderResponse } from './schemas/orders.schema';

export type OrdersDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class OrdersRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: OrdersDatabase,
  ) {}

  generateOrderNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `ST-${date}-${suffix}`;
  }

  async createOrderWithPayment(params: {
    userId: number | null;
    guestToken: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
    shippingAddress: ShippingAddress;
    notes: string | null;
    subtotal: number;
    shippingFee: number;
    total: number;
    items: {
      productId: string;
      variantId: string | null;
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
    cartId: string;
  }): Promise<string> {
    return this.db.transaction(async (tx) => {
      const orderNumber = this.generateOrderNumber();

      const [order] = await tx
        .insert(schema.orders)
        .values({
          orderNumber,
          userId: params.userId,
          guestToken: params.guestToken,
          guestEmail: params.guestEmail,
          guestPhone: params.guestPhone,
          status: 'PENDING',
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          subtotal: params.subtotal,
          shippingFee: params.shippingFee,
          total: params.total,
          shippingAddress: params.shippingAddress,
          notes: params.notes,
        })
        .returning();

      await tx.insert(schema.orderItems).values(
        params.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
      );

      await tx.insert(schema.payments).values({
        orderId: order.id,
        method: 'COD',
        status: 'PENDING',
        amount: params.total,
      });

      for (const item of params.items) {
        if (item.variantId) {
          await tx
            .update(schema.productVariants)
            .set({
              stockQty: sql`${schema.productVariants.stockQty} - ${item.quantity}`,
            })
            .where(eq(schema.productVariants.id, item.variantId));
        } else {
          await tx
            .update(schema.products)
            .set({
              stockQty: sql`${schema.products.stockQty} - ${item.quantity}`,
            })
            .where(eq(schema.products.id, item.productId));
        }
      }

      await tx
        .update(schema.carts)
        .set({ status: 'CONVERTED' })
        .where(eq(schema.carts.id, params.cartId));

      return order.id;
    });
  }

  async findOrderById(orderId: string) {
    return this.db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      with: {
        items: true,
        payments: true,
      },
    });
  }

  async listOrdersByUserId(userId: number) {
    return this.db.query.orders.findMany({
      where: eq(schema.orders.userId, userId),
      orderBy: [desc(schema.orders.createdAt)],
      with: {
        items: true,
        payments: true,
      },
    });
  }

  async updatePaymentStatus(params: {
    orderId: string;
    paymentStatus: 'PAID' | 'CANCELLED';
  }) {
    const orderStatus =
      params.paymentStatus === 'PAID' ? 'CONFIRMED' : 'CANCELLED';

    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.orders)
        .set({
          paymentStatus: params.paymentStatus,
          status: orderStatus,
        })
        .where(eq(schema.orders.id, params.orderId));

      await tx
        .update(schema.payments)
        .set({ status: params.paymentStatus })
        .where(eq(schema.payments.orderId, params.orderId));
    });
  }

  mapOrderToResponse(
    order: NonNullable<Awaited<ReturnType<OrdersRepository['findOrderById']>>>,
  ): OrderResponse {
    const payment = order.payments[0] ?? null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: 'COD',
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      payment: payment
        ? {
            id: payment.id,
            method: 'COD' as const,
            status: payment.status,
            amount: payment.amount,
          }
        : null,
      createdAt: order.createdAt.toISOString(),
    };
  }

  ensureOrderFound(
    order: Awaited<ReturnType<OrdersRepository['findOrderById']>>,
  ) {
    if (!order) {
      throw notFoundError('order_not_found', 'Order not found');
    }
    return order;
  }

  canAccessOrder(
    order: NonNullable<Awaited<ReturnType<OrdersRepository['findOrderById']>>>,
    access: { userId?: number; guestToken?: string },
  ): boolean {
    if (access.userId != null && order.userId === access.userId) {
      return true;
    }
    if (
      access.guestToken &&
      order.guestToken &&
      order.guestToken === access.guestToken
    ) {
      return true;
    }
    return false;
  }
}
