import {
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../../helpers';
import { products } from './product.drizzle.schema';

export const specificationGroups = pgTable('specification_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

export const specificationFields = pgTable('specification_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => specificationGroups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

export const productSpecifications = pgTable(
  'product_specifications',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    fieldId: uuid('field_id')
      .notNull()
      .references(() => specificationFields.id, { onDelete: 'cascade' }),
    value: text('value').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.fieldId] }),
  ],
);
