import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  varchar,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../../helpers';
import { categories } from './category.drizzle.schema';
import { brands } from './brand.drizzle.schema';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .references(() => categories.id)
    .notNull(),
  brandId: uuid('brand_id').references(() => brands.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  summary: text('summary'),
  description: text('description'),
  regularPrice: decimal('regular_price', { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal('discount_price', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0).notNull(),
  stockStatus: varchar('stock_status', { length: 50 }).default('IN_STOCK'),
  images: jsonb('images').default([]).notNull(),
  specifications: jsonb('specifications').default({}).notNull(),
  warranty: varchar('warranty', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isTrending: boolean('is_trending').default(false).notNull(),
  ...timestamps,
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  color: varchar('color', { length: 50 }),
  size: varchar('size', { length: 50 }),
  priceAdjustment: decimal('price_adjustment', {
    precision: 10,
    scale: 2,
  }).default('0'),
  stock: integer('stock').default(0).notNull(),
});
