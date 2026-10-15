import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
  uuid
} from "drizzle-orm/pg-core";
import { brands } from "./brand.drizzle.schema";
import { categories } from "./category.drizzle.schema";
import { attributeDataTypeEnum, attributeInputTypeEnum } from "./enum.drizzle.schema";
import { products } from "./product.drizzle.schema";
import { timestamps } from "../../helpers";

export const attributes = pgTable(
  "attributes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    inputType: attributeInputTypeEnum("input_type").notNull().default("MULTI_SELECT"),
    dataType: attributeDataTypeEnum("data_type").notNull().default("STRING"),
    unit: varchar("unit", { length: 32 }),
    description: text("description"),
    isFilterable: boolean("is_filterable").notNull().default(true),
    isBrandAttribute: boolean("is_brand_attribute").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("attributes_code_uidx").on(table.code),
    index("attributes_filterable_idx").on(table.isFilterable),
  ],
);

export const attributeOptions = pgTable(
  "attribute_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    label: varchar("label", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    sortValue: integer("sort_value"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("attribute_options_attr_slug_uidx").on(table.attributeId, table.slug),
    index("attribute_options_attribute_idx").on(table.attributeId, table.sortOrder),
    index("attribute_options_brand_idx").on(table.brandId),
  ],
);

export const categoryAttributes = pgTable(
  "category_attributes",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    isCollapsed: boolean("is_collapsed").notNull().default(false),
    showProductCount: boolean("show_product_count").notNull().default(true),
  },
  (table) => [
    // Composite keys are declared in alphabetical column order: drizzle-kit
    // reads them back from Postgres 18 in that order, and a different order
    // makes `db:push` drop and re-create the key on every run.
    primaryKey({ columns: [table.attributeId, table.categoryId] }),
    // The key now leads with attribute_id, so category lookups need their own index.
    index("category_attributes_category_idx").on(table.categoryId),
  ],
);

export const productAttributeValues = pgTable(
  "product_attribute_values",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    // FK declared below with an explicit name: the generated one exceeds
    // Postgres's 63-char identifier limit and gets truncated.
    attributeOptionId: uuid("attribute_option_id").notNull(),
  },
  (table) => [
    // Alphabetical column order (see categoryAttributes). This key now also
    // covers the former pav_option_product_idx / pav_option_only_idx.
    primaryKey({ columns: [table.attributeOptionId, table.productId] }),
    foreignKey({
      name: "pav_attribute_option_fk",
      columns: [table.attributeOptionId],
      foreignColumns: [attributeOptions.id],
    }).onDelete("cascade"),
    index("pav_product_attr_idx").on(table.productId, table.attributeId),
    index("pav_attr_option_idx").on(table.attributeId, table.attributeOptionId),
  ],
);

export const productNumericAttributes = pgTable(
  "product_numeric_attributes",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    value: numeric("value", { precision: 18, scale: 4 }).notNull(),
  },
  (table) => [
    // Alphabetical column order (see categoryAttributes).
    primaryKey({ columns: [table.attributeId, table.productId] }),
    index("product_numeric_attr_value_idx").on(table.attributeId, table.value),
    // The key now leads with attribute_id, so per-product lookups need their own index.
    index("product_numeric_attributes_product_idx").on(table.productId),
  ],
);

export const categoryFacetCounts = pgTable(
  "category_facet_counts",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    // FK declared below with an explicit name (generated name exceeds 63 chars).
    attributeOptionId: uuid("attribute_option_id").notNull(),
    productCount: integer("product_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    // Alphabetical column order (see categoryAttributes). This key now also
    // covers the former category_facet_counts_option_idx.
    primaryKey({ columns: [table.attributeOptionId, table.categoryId] }),
    foreignKey({
      name: "cfc_attribute_option_fk",
      columns: [table.attributeOptionId],
      foreignColumns: [attributeOptions.id],
    }).onDelete("cascade"),
    // The key now leads with attribute_option_id, so per-category lookups need their own index.
    index("category_facet_counts_category_idx").on(table.categoryId),
    index("category_facet_counts_nonzero_idx")
      .on(table.categoryId, table.productCount)
      .where(sql`${table.productCount} > 0`),
  ],
);
