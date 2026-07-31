import {
  decimal,
  integer,
  jsonb,
  pgTable,
  varchar,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../../helpers';
import { users } from './auth.drizzle.schema';
import { products, productVariants } from './product.drizzle.schema';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  sslcommerzTranId: varchar('sslcommerz_tran_id', { length: 255 }),
  sslcommerzValId: varchar('sslcommerz_val_id', { length: 255 }),
  paymentStatus: varchar('payment_status', { length: 50 }).default('UNPAID'),
  shippingAddress: jsonb('shipping_address').notNull(),
  contactPhone: varchar('contact_phone', { length: 50 }).notNull(),
  ...timestamps,
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: decimal('price_at_purchase', {
    precision: 10,
    scale: 2,
  }).notNull(),
});
