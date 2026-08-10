import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';

export type PromotionalDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class PromotionalRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: PromotionalDatabase,
  ) {}

  private activeScheduleCondition(
    isActiveColumn: typeof schema.heroSlides.isActive,
    startsAtColumn: typeof schema.heroSlides.startsAt,
    endsAtColumn: typeof schema.heroSlides.endsAt,
    now: Date,
  ) {
    return and(
      eq(isActiveColumn, true),
      or(isNull(startsAtColumn), lte(startsAtColumn, now)),
      or(isNull(endsAtColumn), gte(endsAtColumn, now)),
    );
  }

  listActiveHeroSlides(now: Date = new Date()) {
    return this.db
      .select()
      .from(schema.heroSlides)
      .where(
        this.activeScheduleCondition(
          schema.heroSlides.isActive,
          schema.heroSlides.startsAt,
          schema.heroSlides.endsAt,
          now,
        ),
      )
      .orderBy(asc(schema.heroSlides.sortOrder), asc(schema.heroSlides.createdAt));
  }

  listAllHeroSlides() {
    return this.db
      .select()
      .from(schema.heroSlides)
      .orderBy(asc(schema.heroSlides.sortOrder), asc(schema.heroSlides.createdAt));
  }

  findHeroSlideById(id: string) {
    return this.db.query.heroSlides.findFirst({
      where: eq(schema.heroSlides.id, id),
    });
  }

  createHeroSlide(data: typeof schema.heroSlides.$inferInsert) {
    return this.db
      .insert(schema.heroSlides)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  updateHeroSlide(
    id: string,
    data: Partial<typeof schema.heroSlides.$inferInsert>,
  ) {
    return this.db
      .update(schema.heroSlides)
      .set(data)
      .where(eq(schema.heroSlides.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  deleteHeroSlide(id: string) {
    return this.db
      .delete(schema.heroSlides)
      .where(eq(schema.heroSlides.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  listActivePromoNavLinks() {
    return this.db
      .select()
      .from(schema.promoNavLinks)
      .where(eq(schema.promoNavLinks.isActive, true))
      .orderBy(
        asc(schema.promoNavLinks.sortOrder),
        asc(schema.promoNavLinks.createdAt),
      );
  }

  listAllPromoNavLinks() {
    return this.db
      .select()
      .from(schema.promoNavLinks)
      .orderBy(
        asc(schema.promoNavLinks.sortOrder),
        asc(schema.promoNavLinks.createdAt),
      );
  }

  findPromoNavLinkById(id: string) {
    return this.db.query.promoNavLinks.findFirst({
      where: eq(schema.promoNavLinks.id, id),
    });
  }

  createPromoNavLink(data: typeof schema.promoNavLinks.$inferInsert) {
    return this.db
      .insert(schema.promoNavLinks)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  updatePromoNavLink(
    id: string,
    data: Partial<typeof schema.promoNavLinks.$inferInsert>,
  ) {
    return this.db
      .update(schema.promoNavLinks)
      .set(data)
      .where(eq(schema.promoNavLinks.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  deletePromoNavLink(id: string) {
    return this.db
      .delete(schema.promoNavLinks)
      .where(eq(schema.promoNavLinks.id, id))
      .returning()
      .then((rows) => rows[0]);
  }
}
