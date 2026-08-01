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
import { stockStatusEnum } from './enum.drizzle.schema';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .references(() => categories.id)
    .notNull(),
  brandId: uuid('brand_id').references(() => brands.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  hasVariants: boolean('has_variants').default(false).notNull(),
  regularPrice: decimal('regular_price', { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal('discount_price', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0).notNull(),
  stockStatus: stockStatusEnum('stock_status').default('IN_STOCK'),
  image: varchar('image', { length: 500 }),
  images: jsonb('images').default([]).notNull(),
  specifications: jsonb('specifications').default({}).notNull(),
  warranty: varchar('warranty', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isTrending: boolean('is_trending').default(false).notNull(),
  ...timestamps,
});

export const variantTypes = pgTable('variant_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).unique().notNull(), // e.g., 'Color', 'Size'
});

export const variantValues = pgTable('variant_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  typeId: uuid('type_id')
    .references(() => variantTypes.id, { onDelete: 'cascade' })
    .notNull(),
  value: varchar('value', { length: 100 }).notNull(), // e.g., 'Red', 'XL'
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  regularPrice: decimal('regular_price', { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal('discount_price', { precision: 10, scale: 2 }),
  stock: integer('stock').default(0).notNull(),
  stockStatus: stockStatusEnum('stock_status').default('IN_STOCK'),
  variantCombination: jsonb('variant_combination').default({}).notNull(),
});
