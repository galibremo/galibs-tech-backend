import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../../helpers';
import {
  attributeOptions,
  attributes,
} from './attribute.drizzle.schema';
import { stockStatusEnum } from './enum.drizzle.schema';
import { products } from './product.drizzle.schema';

export const productOptionGroups = pgTable(
  'product_option_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    code: varchar('code', { length: 80 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('product_option_groups_product_code_uidx').on(
      table.productId,
      table.code,
    ),
    index('product_option_groups_product_idx').on(
      table.productId,
      table.sortOrder,
    ),
  ],
);

export const productOptionValues = pgTable(
  'product_option_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => productOptionGroups.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 180 }).notNull(),
    swatchValue: varchar('swatch_value', { length: 64 }),
    attributeOptionId: uuid('attribute_option_id').references(
      () => attributeOptions.id,
      { onDelete: 'set null' },
    ),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('product_option_values_group_slug_uidx').on(
      table.groupId,
      table.slug,
    ),
    index('product_option_values_group_idx').on(table.groupId, table.sortOrder),
    index('product_option_values_attr_option_idx').on(table.attributeOptionId),
  ],
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 120 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    fingerprint: varchar('fingerprint', { length: 512 }).notNull(),
    price: integer('price').notNull(),
    regularPrice: integer('regular_price'),
    stockQty: integer('stock_qty').notNull().default(0),
    availability: stockStatusEnum('availability').notNull().default('IN_STOCK'),
    isDefault: boolean('is_default').notNull().default(false),
    thumbnailUrl: text('thumbnail_url'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('product_variants_sku_uidx').on(table.sku),
    uniqueIndex('product_variants_product_fingerprint_uidx').on(
      table.productId,
      table.fingerprint,
    ),
    index('product_variants_product_idx').on(table.productId),
    index('product_variants_deleted_at_idx').on(table.deletedAt),
  ],
);

export const productVariantOptionValues = pgTable(
  'product_variant_option_values',
  {
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    optionValueId: uuid('option_value_id')
      .notNull()
      .references(() => productOptionValues.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.variantId, table.optionValueId] }),
    index('product_variant_option_values_value_idx').on(table.optionValueId),
  ],
);

export const productVariantAttributeValues = pgTable(
  'product_variant_attribute_values',
  {
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    attributeId: uuid('attribute_id')
      .notNull()
      .references(() => attributes.id, { onDelete: 'cascade' }),
    attributeOptionId: uuid('attribute_option_id')
      .notNull()
      .references(() => attributeOptions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.variantId, table.attributeOptionId] }),
    index('product_variant_attr_values_attr_idx').on(
      table.attributeId,
      table.attributeOptionId,
    ),
  ],
);
