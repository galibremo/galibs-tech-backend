import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';

type Subscription = typeof schema.newsletterSubscriptions.$inferSelect;

@Injectable()
export class NewsletterRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  findByEmail(email: string): Promise<Subscription | undefined> {
    return this.db.query.newsletterSubscriptions.findFirst({
      where: eq(schema.newsletterSubscriptions.email, email),
    });
  }

  /**
   * Insert, or re-activate an existing row, in one statement so concurrent
   * signups for the same address can't race the unique index.
   */
  async upsertSubscribed(data: {
    email: string;
    source: string | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<Subscription> {
    const [row] = await this.db
      .insert(schema.newsletterSubscriptions)
      .values({ ...data, status: 'SUBSCRIBED' })
      .onConflictDoUpdate({
        target: schema.newsletterSubscriptions.email,
        set: {
          status: 'SUBSCRIBED',
          source: data.source,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return row;
  }
}
