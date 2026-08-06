import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';

export type SpecificationsDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class SpecificationsRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: SpecificationsDatabase,
  ) {}

  findGroupById(
    id: string,
  ): Promise<typeof schema.specificationGroups.$inferSelect | undefined> {
    return this.db.query.specificationGroups.findFirst({
      where: eq(schema.specificationGroups.id, id),
    });
  }

  findProductById(
    id: string,
  ): Promise<typeof schema.products.$inferSelect | undefined> {
    return this.db.query.products.findFirst({
      where: and(
        eq(schema.products.id, id),
        isNull(schema.products.deletedAt),
      ),
    });
  }

  findFieldsByIds(
    ids: string[],
  ): Promise<(typeof schema.specificationFields.$inferSelect)[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.db
      .select()
      .from(schema.specificationFields)
      .where(inArray(schema.specificationFields.id, ids));
  }

  async createGroup(
    data: typeof schema.specificationGroups.$inferInsert,
  ): Promise<typeof schema.specificationGroups.$inferSelect | undefined> {
    return this.db
      .insert(schema.specificationGroups)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async createField(
    data: typeof schema.specificationFields.$inferInsert,
  ): Promise<typeof schema.specificationFields.$inferSelect | undefined> {
    return this.db
      .insert(schema.specificationFields)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async upsertProductSpecs(
    productId: string,
    specs: { fieldId: string; value: string }[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(schema.productSpecifications)
        .where(eq(schema.productSpecifications.productId, productId));

      if (specs && specs.length > 0) {
        const values = specs.map((spec) => ({
          productId,
          fieldId: spec.fieldId,
          value: spec.value,
        }));
        await tx.insert(schema.productSpecifications).values(values);
      }
    });
  }

  async getProductSpecs(productId: string) {
    return this.db.query.productSpecifications.findMany({
      where: eq(schema.productSpecifications.productId, productId),
      with: {
        field: {
          with: {
            group: true,
          },
        },
      },
    });
  }
}
