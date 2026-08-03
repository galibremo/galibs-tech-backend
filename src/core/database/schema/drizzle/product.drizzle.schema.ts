import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../../helpers';
import { brands } from './brand.drizzle.schema';
import { categories } from './category.drizzle.schema';
import { productTypeEnum, stockStatusEnum } from './enum.drizzle.schema';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: productTypeEnum('type').notNull().default('SIMPLE'),
    productCode: varchar('product_code', { length: 64 }).notNull(),
    sku: varchar('sku', { length: 120 }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'restrict' }),
    primaryCategoryId: uuid('primary_category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    keyFeatures: jsonb('key_features').$type<string[]>().notNull().default([]),
    price: integer('price').notNull(),
    regularPrice: integer('regular_price'),
    maxPrice: integer('max_price'),
    availability: stockStatusEnum('availability').notNull().default('IN_STOCK'),
    stockQty: integer('stock_qty').notNull().default(0),
    earnPoints: integer('earn_points').notNull().default(0),
    warrantyText: varchar('warranty_text', { length: 255 }),
    warrantyMonths: integer('warranty_months'),
    emiMonthlyAmount: integer('emi_monthly_amount'),
    thumbnailUrl: text('thumbnail_url'),
    badges: jsonb('badges').$type<string[]>().notNull().default([]),
    shortDescription: text('short_description'),
    description: text('description'),
    searchDocument: text('search_document'),
    isActive: boolean('is_active').notNull().default(true),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('products_slug_uidx').on(table.slug),
    uniqueIndex('products_product_code_uidx').on(table.productCode),
    index('products_brand_idx').on(table.brandId),
    index('products_listing_idx').on(
      table.isActive,
      table.availability,
      table.primaryCategoryId,
      table.price,
    ),
    index('products_deleted_at_idx').on(table.deletedAt),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    // Optional link to a variant SKU (FK enforced at app layer to avoid circular schema imports)
    variantId: uuid('variant_id'),
    url: text('url').notNull(),
    altText: varchar('alt_text', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index('product_images_product_idx').on(table.productId, table.sortOrder),
    index('product_images_variant_idx').on(table.variantId),
  ],
);

export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index('product_categories_category_idx').on(table.categoryId),
    index('product_categories_primary_idx').on(table.productId, table.isPrimary),
  ],
);
