import { pgTable, text, varchar, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../helpers';

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  logo: text('logo'),
  ...timestamps,
});
