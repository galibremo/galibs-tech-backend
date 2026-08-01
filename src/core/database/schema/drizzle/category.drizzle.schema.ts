import { foreignKey, pgTable, varchar, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../helpers';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    parentId: uuid('parent_id'),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
    }).onDelete('cascade'),
  ],
);
