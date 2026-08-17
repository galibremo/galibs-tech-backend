import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  or,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';

export type OffersDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class OffersRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: OffersDatabase,
  ) {}

  private activeScheduleCondition(now: Date) {
    return and(
      eq(schema.offers.isActive, true),
      or(isNull(schema.offers.startsAt), lte(schema.offers.startsAt, now)),
      or(isNull(schema.offers.endsAt), gte(schema.offers.endsAt, now)),
    );
  }

  listActiveOffers(now: Date = new Date()) {
    return this.db
      .select()
      .from(schema.offers)
      .where(this.activeScheduleCondition(now))
      .orderBy(asc(schema.offers.sortOrder), asc(schema.offers.createdAt));
  }

  listActivePromotionalOffers(now: Date = new Date()) {
    return this.db
      .select()
      .from(schema.offers)
      .where(
        and(
          eq(schema.offers.showInPromotional, true),
          this.activeScheduleCondition(now),
        ),
      )
      .orderBy(asc(schema.offers.sortOrder), asc(schema.offers.createdAt));
  }

  async listOffers(page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(schema.offers)
        .orderBy(desc(schema.offers.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ value: count() }).from(schema.offers),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  findOfferById(id: string) {
    return this.db.query.offers.findFirst({
      where: eq(schema.offers.id, id),
    });
  }

  findOfferBySlug(slug: string) {
    return this.db.query.offers.findFirst({
      where: eq(schema.offers.slug, slug),
    });
  }

  createOffer(data: typeof schema.offers.$inferInsert) {
    return this.db
      .insert(schema.offers)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  updateOffer(id: string, data: Partial<typeof schema.offers.$inferInsert>) {
    return this.db
      .update(schema.offers)
      .set(data)
      .where(eq(schema.offers.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  deleteOffer(id: string) {
    return this.db
      .delete(schema.offers)
      .where(eq(schema.offers.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  listOfferProducts(offerId: string) {
    return this.db
      .select({
        id: schema.offerProducts.id,
        offerId: schema.offerProducts.offerId,
        productId: schema.offerProducts.productId,
        variantId: schema.offerProducts.variantId,
        offerPrice: schema.offerProducts.offerPrice,
        sortOrder: schema.offerProducts.sortOrder,
        name: schema.products.name,
        slug: schema.products.slug,
        thumbnailUrl: schema.products.thumbnailUrl,
        price: schema.products.price,
        regularPrice: schema.products.regularPrice,
        availability: schema.products.availability,
      })
      .from(schema.offerProducts)
      .innerJoin(
        schema.products,
        eq(schema.offerProducts.productId, schema.products.id),
      )
      .where(
        and(
          eq(schema.offerProducts.offerId, offerId),
          isNull(schema.products.deletedAt),
          eq(schema.products.isActive, true),
        ),
      )
      .orderBy(
        asc(schema.offerProducts.sortOrder),
        asc(schema.offerProducts.createdAt),
      );
  }

  attachOfferProduct(data: typeof schema.offerProducts.$inferInsert) {
    return this.db
      .insert(schema.offerProducts)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async detachOfferProduct(
    offerId: string,
    productId: string,
    variantId: string | null,
  ) {
    const condition =
      variantId == null
        ? and(
            eq(schema.offerProducts.offerId, offerId),
            eq(schema.offerProducts.productId, productId),
            isNull(schema.offerProducts.variantId),
          )
        : and(
            eq(schema.offerProducts.offerId, offerId),
            eq(schema.offerProducts.productId, productId),
            eq(schema.offerProducts.variantId, variantId),
          );

    return this.db
      .delete(schema.offerProducts)
      .where(condition)
      .returning()
      .then((rows) => rows[0]);
  }
}
