import { index, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../../helpers';

export const newsletterStatusEnum = pgEnum('newsletter_status', [
  'SUBSCRIBED',
  'UNSUBSCRIBED',
]);

export const newsletterSubscriptions = pgTable(
  'newsletter_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stored lower-cased and trimmed so re-subscribing is idempotent. */
    email: varchar('email', { length: 320 }).unique().notNull(),
    status: newsletterStatusEnum('status').notNull().default('SUBSCRIBED'),
    /** Where the signup came from, e.g. "home_footer". */
    source: varchar('source', { length: 64 }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    ...timestamps,
  },
  (table) => [index('newsletter_subscriptions_status_idx').on(table.status)],
);
