import { pgTable, varchar, uuid, boolean, integer, text, uniqueIndex, index, AnyPgColumn } from 'drizzle-orm/pg-core';
import { timestamps } from '../../helpers';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    path: varchar('path', { length: 512 }).notNull(),
    depth: integer('depth').notNull().default(0),
    description: text('description'),
    shortDescription: text('short_description'),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    showInMenu: boolean('show_in_menu').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    minPrice: integer('min_price'),
    maxPrice: integer('max_price'),
    productCount: integer('product_count').notNull().default(0),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    seoContent: text('seo_content'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("categories_slug_uidx").on(table.slug),
    uniqueIndex("categories_path_uidx").on(table.path),
    index("categories_parent_idx").on(table.parentId),
    index("categories_menu_idx").on(table.showInMenu, table.isActive, table.sortOrder),
    index("categories_path_prefix_idx").using("btree", table.path),
    index("categories_active_featured_idx").on(table.isActive, table.isFeatured),
  ],
);
