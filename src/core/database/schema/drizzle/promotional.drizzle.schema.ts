import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../../helpers';
import { linkTargetEnum } from './enum.drizzle.schema';

export const heroSlides = pgTable(
  'hero_slides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }),
    subtitle: text('subtitle'),
    imageUrl: text('image_url').notNull(),
    mobileImageUrl: text('mobile_image_url'),
    linkUrl: text('link_url'),
    linkTarget: linkTargetEnum('link_target').notNull().default('_self'),
    altText: varchar('alt_text', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('hero_slides_active_sort_idx').on(table.isActive, table.sortOrder),
    index('hero_slides_schedule_idx').on(table.startsAt, table.endsAt),
  ],
);

