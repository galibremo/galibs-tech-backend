import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../../helpers';
import { users } from './auth.drizzle.schema';
import {
  cartStatusEnum,
  orderStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
} from './enum.drizzle.schema';
import { products } from './product.drizzle.schema';
import { productVariants } from './variant.drizzle.schema';

export type ShippingAddress = {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  district: string;
  postalCode?: string | null;
};

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    guestToken: uuid('guest_token'),
    status: cartStatusEnum('status').notNull().default('ACTIVE'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('carts_user_active_uidx')
      .on(table.userId)
      .where(sql`${table.status} = 'ACTIVE' AND ${table.userId} IS NOT NULL`),
    uniqueIndex('carts_guest_active_uidx')
      .on(table.guestToken)
      .where(
        sql`${table.status} = 'ACTIVE' AND ${table.guestToken} IS NOT NULL`,
      ),
    index('carts_user_idx').on(table.userId),
    index('carts_guest_token_idx').on(table.guestToken),
  ],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'cascade',
    }),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: integer('unit_price').notNull(),
    ...timestamps,
  },
  (table) => [
    index('cart_items_cart_product_variant_idx').on(
      table.cartId,
      table.productId,
      table.variantId,
    ),
    index('cart_items_cart_idx').on(table.cartId),
    index('cart_items_product_idx').on(table.productId),
  ],
);

export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    guestToken: uuid('guest_token'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('wishlists_user_uidx')
      .on(table.userId)
      .where(sql`${table.userId} IS NOT NULL`),
    uniqueIndex('wishlists_guest_uidx')
      .on(table.guestToken)
      .where(sql`${table.guestToken} IS NOT NULL`),
    index('wishlists_user_idx').on(table.userId),
    index('wishlists_guest_token_idx').on(table.guestToken),
  ],
);

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wishlistId: uuid('wishlist_id')
      .notNull()
      .references(() => wishlists.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'cascade',
    }),
    ...timestamps,
  },
  (table) => [
    index('wishlist_items_wishlist_product_variant_idx').on(
      table.wishlistId,
      table.productId,
      table.variantId,
    ),
    index('wishlist_items_wishlist_idx').on(table.wishlistId),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 40 }).notNull(),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    guestToken: uuid('guest_token'),
    guestEmail: varchar('guest_email', { length: 255 }),
    guestPhone: varchar('guest_phone', { length: 32 }),
    status: orderStatusEnum('status').notNull().default('PENDING'),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('COD'),
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('PENDING'),
    subtotal: integer('subtotal').notNull(),
    shippingFee: integer('shipping_fee').notNull().default(0),
    total: integer('total').notNull(),
    shippingAddress: jsonb('shipping_address').$type<ShippingAddress>().notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('orders_order_number_uidx').on(table.orderNumber),
    index('orders_user_idx').on(table.userId),
    index('orders_guest_token_idx').on(table.guestToken),
    index('orders_status_idx').on(table.status),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    variantId: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'restrict',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 120 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
    lineTotal: integer('line_total').notNull(),
    ...timestamps,
  },
  (table) => [index('order_items_order_idx').on(table.orderId)],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    method: paymentMethodEnum('method').notNull().default('COD'),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    amount: integer('amount').notNull(),
    ...timestamps,
  },
  (table) => [
    index('payments_order_idx').on(table.orderId),
    index('payments_status_idx').on(table.status),
  ],
);
