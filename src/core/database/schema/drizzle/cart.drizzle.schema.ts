import { integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../helpers';
import { users } from './auth.drizzle.schema';
import { products, productVariants } from './product.drizzle.schema';

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  ...timestamps,
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id')
    .references(() => carts.id, { onDelete: 'cascade' })
    .notNull(),
  productId: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').default(1).notNull(),
});
