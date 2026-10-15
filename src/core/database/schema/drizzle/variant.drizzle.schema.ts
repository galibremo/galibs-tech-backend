import {
  boolean,
  foreignKey,
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
    // FK declared below with an explicit name (generated name exceeds 63 chars).
    attributeOptionId: uuid('attribute_option_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: 'pov_attribute_option_fk',
      columns: [table.attributeOptionId],
      foreignColumns: [attributeOptions.id],
    }).onDelete('set null'),
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
    // FK declared below with an explicit name (generated name exceeds 63 chars).
    optionValueId: uuid('option_value_id').notNull(),
  },
  (table) => [
    // Composite keys are declared in alphabetical column order: drizzle-kit
    // reads them back from Postgres 18 in that order, and a different order
    // makes `db:push` drop and re-create the key on every run. This key now
    // also covers the former product_variant_option_values_value_idx.
    primaryKey({ columns: [table.optionValueId, table.variantId] }),
    foreignKey({
      name: 'pvov_option_value_fk',
      columns: [table.optionValueId],
      foreignColumns: [productOptionValues.id],
    }).onDelete('restrict'),
    // The key now leads with option_value_id, so per-variant lookups need their own index.
    index('product_variant_option_values_variant_idx').on(table.variantId),
  ],
);

export const productVariantAttributeValues = pgTable(
  'product_variant_attribute_values',
  {
    // Both FKs declared below with explicit names (generated names exceed 63 chars).
    variantId: uuid('variant_id').notNull(),
    attributeId: uuid('attribute_id')
      .notNull()
      .references(() => attributes.id, { onDelete: 'cascade' }),
    attributeOptionId: uuid('attribute_option_id').notNull(),
  },
  (table) => [
    // Alphabetical column order (see productVariantOptionValues). The
    // generated name would exceed 63 chars, hence the explicit one.
    primaryKey({
      name: 'pvav_pk',
      columns: [table.attributeOptionId, table.variantId],
    }),
    foreignKey({
      name: 'pvav_variant_fk',
      columns: [table.variantId],
      foreignColumns: [productVariants.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'pvav_attribute_option_fk',
      columns: [table.attributeOptionId],
      foreignColumns: [attributeOptions.id],
    }).onDelete('cascade'),
    index('product_variant_attr_values_attr_idx').on(
      table.attributeId,
      table.attributeOptionId,
    ),
    // The key now leads with attribute_option_id, so per-variant lookups need their own index.
    index('product_variant_attribute_values_variant_idx').on(table.variantId),
  ],
);
