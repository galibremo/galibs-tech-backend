import { sql } from "drizzle-orm";
import {
  boolean,
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
    primaryKey({ columns: [table.categoryId, table.attributeId] }),
    index("category_attributes_attr_idx").on(table.attributeId),
  ],
);

export const productAttributeValues = pgTable(
  "product_attribute_values",
  {
    productId: uuid("product_id").notNull(), // TODO: Add .references(() => products.id) when products table is added
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    attributeOptionId: uuid("attribute_option_id")
      .notNull()
      .references(() => attributeOptions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.productId, table.attributeOptionId],
    }),
    index("pav_option_product_idx").on(table.attributeOptionId, table.productId),
    index("pav_product_attr_idx").on(table.productId, table.attributeId),
    index("pav_attr_option_idx").on(table.attributeId, table.attributeOptionId),
    index("pav_option_only_idx").on(table.attributeOptionId),
  ],
);

export const productNumericAttributes = pgTable(
  "product_numeric_attributes",
  {
    productId: uuid("product_id").notNull(), // TODO: Add .references(() => products.id) when products table is added
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    value: numeric("value", { precision: 18, scale: 4 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.attributeId] }),
    index("product_numeric_attr_value_idx").on(table.attributeId, table.value),
  ],
);

export const categoryFacetCounts = pgTable(
  "category_facet_counts",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    attributeOptionId: uuid("attribute_option_id")
      .notNull()
      .references(() => attributeOptions.id, { onDelete: "cascade" }),
    productCount: integer("product_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.categoryId, table.attributeOptionId] }),
    index("category_facet_counts_option_idx").on(table.attributeOptionId),
    index("category_facet_counts_nonzero_idx")
      .on(table.categoryId, table.productCount)
      .where(sql`${table.productCount} > 0`),
  ],
);
