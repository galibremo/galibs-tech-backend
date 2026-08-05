import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';
import { syncVariableProductCaches } from './helpers/sync-variable-product-caches';

export type VariantsDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class VariantsRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: VariantsDatabase,
  ) {}

  findProductById(
    id: string,
  ): Promise<typeof schema.products.$inferSelect | undefined> {
    return this.db.query.products.findFirst({
      where: and(eq(schema.products.id, id), isNull(schema.products.deletedAt)),
    });
  }

  findOptionGroupById(id: string) {
    return this.db.query.productOptionGroups.findFirst({
      where: eq(schema.productOptionGroups.id, id),
      with: {
        values: true,
      },
    });
  }

  findOptionValueById(id: string) {
    return this.db.query.productOptionValues.findFirst({
      where: eq(schema.productOptionValues.id, id),
      with: {
        group: true,
      },
    });
  }

  listOptionGroupsByProductId(productId: string) {
    return this.db.query.productOptionGroups.findMany({
      where: eq(schema.productOptionGroups.productId, productId),
      orderBy: (groups, { asc }) => [asc(groups.sortOrder)],
      with: {
        values: {
          orderBy: (values, { asc }) => [asc(values.sortOrder)],
        },
      },
    });
  }

  async createOptionGroup(
    data: typeof schema.productOptionGroups.$inferInsert,
  ): Promise<typeof schema.productOptionGroups.$inferSelect | undefined> {
    return this.db
      .insert(schema.productOptionGroups)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async createOptionValue(
    data: typeof schema.productOptionValues.$inferInsert,
  ): Promise<typeof schema.productOptionValues.$inferSelect | undefined> {
    return this.db
      .insert(schema.productOptionValues)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async updateOptionValue(
    id: string,
    data: Partial<typeof schema.productOptionValues.$inferInsert>,
  ): Promise<typeof schema.productOptionValues.$inferSelect | undefined> {
    return this.db
      .update(schema.productOptionValues)
      .set(data)
      .where(eq(schema.productOptionValues.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  async countVariantsUsingOptionGroup(groupId: string): Promise<number> {
    const values = await this.db
      .select({ id: schema.productOptionValues.id })
      .from(schema.productOptionValues)
      .where(eq(schema.productOptionValues.groupId, groupId));

    if (values.length === 0) return 0;

    const valueIds = values.map((value) => value.id);
    const [result] = await this.db
      .select({ value: count() })
      .from(schema.productVariantOptionValues)
      .innerJoin(
        schema.productVariants,
        eq(
          schema.productVariantOptionValues.variantId,
          schema.productVariants.id,
        ),
      )
      .where(
        and(
          inArray(schema.productVariantOptionValues.optionValueId, valueIds),
          isNull(schema.productVariants.deletedAt),
        ),
      );

    return Number(result?.value ?? 0);
  }

  async deleteOptionGroup(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(schema.productOptionGroups)
      .where(eq(schema.productOptionGroups.id, id))
      .returning();
    return deleted.length > 0;
  }

  findVariantById(id: string) {
    return this.db.query.productVariants.findFirst({
      where: and(
        eq(schema.productVariants.id, id),
        isNull(schema.productVariants.deletedAt),
      ),
      with: {
        optionValues: true,
      },
    });
  }

  listVariantsByProductId(productId: string) {
    return this.db.query.productVariants.findMany({
      where: and(
        eq(schema.productVariants.productId, productId),
        isNull(schema.productVariants.deletedAt),
      ),
      orderBy: (variants, { desc }) => [
        desc(variants.isDefault),
        desc(variants.createdAt),
      ],
      with: {
        optionValues: true,
      },
    });
  }

  findOptionValuesByIds(ids: string[]) {
    if (ids.length === 0) {
      return Promise.resolve(
        [] as Array<
          typeof schema.productOptionValues.$inferSelect & {
            group: typeof schema.productOptionGroups.$inferSelect;
          }
        >,
      );
    }
    return this.db.query.productOptionValues.findMany({
      where: inArray(schema.productOptionValues.id, ids),
      with: {
        group: true,
      },
    });
  }

  findAttributeOptionsByIds(ids: string[]): Promise<typeof schema.attributeOptions.$inferSelect[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db.query.attributeOptions.findMany({
      where: inArray(schema.attributeOptions.id, ids),
    });
  }

  findVariantByFingerprint(productId: string, fingerprint: string) {
    return this.db.query.productVariants.findFirst({
      where: and(
        eq(schema.productVariants.productId, productId),
        eq(schema.productVariants.fingerprint, fingerprint),
        isNull(schema.productVariants.deletedAt),
      ),
    });
  }

  async createVariant(params: {
    variant: typeof schema.productVariants.$inferInsert;
    optionValueIds: string[];
    attributeValues: { attributeId: string; attributeOptionId: string }[];
    unsetOtherDefaults: boolean;
  }): Promise<typeof schema.productVariants.$inferSelect | undefined> {
    return this.db.transaction(async (tx) => {
      if (params.unsetOtherDefaults) {
        await tx
          .update(schema.productVariants)
          .set({ isDefault: false })
          .where(eq(schema.productVariants.productId, params.variant.productId));
      }

      const [created] = await tx
        .insert(schema.productVariants)
        .values(params.variant)
        .returning();

      if (!created) return undefined;

      await tx.insert(schema.productVariantOptionValues).values(
        params.optionValueIds.map((optionValueId) => ({
          variantId: created.id,
          optionValueId,
        })),
      );

      if (params.attributeValues.length > 0) {
        await tx.insert(schema.productVariantAttributeValues).values(
          params.attributeValues.map((value) => ({
            variantId: created.id,
            attributeId: value.attributeId,
            attributeOptionId: value.attributeOptionId,
          })),
        );
      }

      await syncVariableProductCaches(tx, created.productId);

      return created;
    });
  }

  async updateVariant(
    id: string,
    productId: string,
    data: Partial<typeof schema.productVariants.$inferInsert>,
  ): Promise<typeof schema.productVariants.$inferSelect | undefined> {
    return this.db.transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx
          .update(schema.productVariants)
          .set({ isDefault: false })
          .where(eq(schema.productVariants.productId, productId));
      }

      const [updated] = await tx
        .update(schema.productVariants)
        .set(data)
        .where(
          and(
            eq(schema.productVariants.id, id),
            isNull(schema.productVariants.deletedAt),
          ),
        )
        .returning();

      if (updated) {
        await syncVariableProductCaches(tx, productId);
      }

      return updated;
    });
  }

  async softDeleteVariant(
    id: string,
    productId: string,
  ): Promise<typeof schema.productVariants.$inferSelect | undefined> {
    return this.db.transaction(async (tx) => {
      const [deleted] = await tx
        .update(schema.productVariants)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(schema.productVariants.id, id),
            isNull(schema.productVariants.deletedAt),
          ),
        )
        .returning();

      if (deleted) {
        await syncVariableProductCaches(tx, productId);
      }

      return deleted;
    });
  }

  async syncProductCaches(productId: string): Promise<void> {
    await syncVariableProductCaches(this.db, productId);
  }
}
