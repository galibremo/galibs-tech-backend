import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../../helpers';
import { offerTypeEnum } from './enum.drizzle.schema';
import { products } from './product.drizzle.schema';

export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    type: offerTypeEnum('type').notNull(),
    description: text('description'),
    bannerImageUrl: text('banner_image_url'),
    showInPromotional: boolean('show_in_promotional')
      .notNull()
      .default(false),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('offers_slug_uidx').on(table.slug),
    index('offers_active_schedule_idx').on(
      table.isActive,
      table.startsAt,
      table.endsAt,
      table.sortOrder,
    ),
    index('offers_promotional_idx').on(
      table.showInPromotional,
      table.isActive,
      table.startsAt,
      table.endsAt,
      table.sortOrder,
    ),
  ],
);

export const offerProducts = pgTable(
  'offer_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    offerId: uuid('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id'),
    offerPrice: integer('offer_price'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('offer_products_offer_product_variant_uidx').on(
      table.offerId,
      table.productId,
      table.variantId,
    ),
    index('offer_products_offer_idx').on(table.offerId, table.sortOrder),
    index('offer_products_product_idx').on(table.productId),
  ],
);
