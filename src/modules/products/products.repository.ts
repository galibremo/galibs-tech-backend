import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';

export type ProductsDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class ProductsRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: ProductsDatabase,
  ) {}

  findBrandById(
    id: string,
  ): Promise<typeof schema.brands.$inferSelect | undefined> {
    return this.db.query.brands.findFirst({
      where: eq(schema.brands.id, id),
    });
  }

  findCategoryById(
    id: string,
  ): Promise<typeof schema.categories.$inferSelect | undefined> {
    return this.db.query.categories.findFirst({
      where: eq(schema.categories.id, id),
    });
  }

  findCategoriesByIds(
    ids: string[],
  ): Promise<(typeof schema.categories.$inferSelect)[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db
      .select()
      .from(schema.categories)
      .where(inArray(schema.categories.id, ids));
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

  findProductByIdIncludingDeleted(
    id: string,
  ): Promise<typeof schema.products.$inferSelect | undefined> {
    return this.db.query.products.findFirst({
      where: eq(schema.products.id, id),
    });
  }

  findProductDetailBySlug(slug: string) {
    return this.db.query.products.findFirst({
      where: and(
        eq(schema.products.slug, slug),
        isNull(schema.products.deletedAt),
      ),
      with: {
        brand: {
          columns: { id: true, name: true, slug: true },
        },
        primaryCategory: {
          columns: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.sortOrder)],
        },
        categories: {
          with: {
            category: {
              columns: { id: true, name: true, slug: true },
            },
          },
        },
        optionGroups: {
          orderBy: (groups, { asc }) => [asc(groups.sortOrder)],
          with: {
            values: {
              orderBy: (values, { asc }) => [asc(values.sortOrder)],
            },
          },
        },
        variants: {
          where: (variants, { isNull: isNullOp }) =>
            isNullOp(variants.deletedAt),
          orderBy: (variants, { desc: descOp }) => [
            descOp(variants.isDefault),
            descOp(variants.createdAt),
          ],
          with: {
            optionValues: true,
          },
        },
      },
    });
  }

  async listProducts(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{
    rows: (typeof schema.products.$inferSelect)[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const offset = (page - 1) * pageSize;
    const notDeleted = isNull(schema.products.deletedAt);

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(schema.products)
        .where(notDeleted)
        .orderBy(desc(schema.products.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(schema.products)
        .where(notDeleted),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  async listFeaturedProducts(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    rows: (typeof schema.products.$inferSelect)[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const offset = (page - 1) * pageSize;
    const featuredCondition = and(
      isNull(schema.products.deletedAt),
      eq(schema.products.isActive, true),
      eq(schema.products.isFeatured, true),
    );

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(schema.products)
        .where(featuredCondition)
        .orderBy(
          asc(schema.products.featuredSortOrder),
          asc(schema.products.createdAt),
        )
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(schema.products)
        .where(featuredCondition),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  async createProductWithPrimaryCategory(
    data: typeof schema.products.$inferInsert,
  ): Promise<typeof schema.products.$inferSelect | undefined> {
    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.products)
        .values(data)
        .returning();

      if (!created) return undefined;

      await tx.insert(schema.productCategories).values({
        productId: created.id,
        categoryId: created.primaryCategoryId,
        isPrimary: true,
      });

      return created;
    });
  }

  async updateProduct(
    id: string,
    data: Partial<typeof schema.products.$inferInsert>,
  ): Promise<typeof schema.products.$inferSelect | undefined> {
    return this.db
      .update(schema.products)
      .set(data)
      .where(and(eq(schema.products.id, id), isNull(schema.products.deletedAt)))
      .returning()
      .then((rows) => rows[0]);
  }

  async softDeleteProduct(
    id: string,
  ): Promise<typeof schema.products.$inferSelect | undefined> {
    return this.db
      .update(schema.products)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(and(eq(schema.products.id, id), isNull(schema.products.deletedAt)))
      .returning()
      .then((rows) => rows[0]);
  }

  async addProductImage(
    data: typeof schema.productImages.$inferInsert,
  ): Promise<typeof schema.productImages.$inferSelect | undefined> {
    return this.db.transaction(async (tx) => {
      if (data.isPrimary) {
        await tx
          .update(schema.productImages)
          .set({ isPrimary: false })
          .where(eq(schema.productImages.productId, data.productId));
      }

      const [created] = await tx
        .insert(schema.productImages)
        .values(data)
        .returning();

      return created;
    });
  }

  async linkProductCategories(
    productId: string,
    categoryIds: string[],
  ): Promise<void> {
    if (categoryIds.length === 0) return;

    await this.db
      .insert(schema.productCategories)
      .values(
        categoryIds.map((categoryId) => ({
          productId,
          categoryId,
          isPrimary: false,
        })),
      )
      .onConflictDoNothing();
  }

  findAttributeOptionsByIds(optionIds: string[]) {
    return this.db.query.attributeOptions.findMany({
      where: inArray(schema.attributeOptions.id, optionIds),
      with: {
        attribute: true,
      },
    });
  }

  async replaceProductAttributes(
    productId: string,
    values: {
      attributeId: string;
      attributeOptionId: string;
    }[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(schema.productAttributeValues)
        .where(eq(schema.productAttributeValues.productId, productId));

      if (values.length > 0) {
        await tx.insert(schema.productAttributeValues).values(
          values.map((value) => ({
            productId,
            attributeId: value.attributeId,
            attributeOptionId: value.attributeOptionId,
          })),
        );
      }
    });
  }

  async addProductAttributes(
    productId: string,
    values: {
      attributeId: string;
      attributeOptionId: string;
    }[],
  ): Promise<void> {
    if (values.length === 0) return;

    await this.db
      .insert(schema.productAttributeValues)
      .values(
        values.map((value) => ({
          productId,
          attributeId: value.attributeId,
          attributeOptionId: value.attributeOptionId,
        })),
      )
      .onConflictDoNothing();
  }

  async removeProductAttribute(
    productId: string,
    optionId: string,
  ): Promise<boolean> {
    const deleted = await this.db
      .delete(schema.productAttributeValues)
      .where(
        and(
          eq(schema.productAttributeValues.productId, productId),
          eq(schema.productAttributeValues.attributeOptionId, optionId),
        ),
      )
      .returning();

    return deleted.length > 0;
  }

  async listProductAttributes(productId: string) {
    return this.db
      .select({
        attributeId: schema.attributes.id,
        attributeCode: schema.attributes.code,
        attributeName: schema.attributes.name,
        optionId: schema.attributeOptions.id,
        label: schema.attributeOptions.label,
        slug: schema.attributeOptions.slug,
      })
      .from(schema.productAttributeValues)
      .innerJoin(
        schema.attributes,
        eq(
          schema.productAttributeValues.attributeId,
          schema.attributes.id,
        ),
      )
      .innerJoin(
        schema.attributeOptions,
        eq(
          schema.productAttributeValues.attributeOptionId,
          schema.attributeOptions.id,
        ),
      )
      .where(eq(schema.productAttributeValues.productId, productId))
      .orderBy(
        schema.attributes.sortOrder,
        schema.attributeOptions.sortOrder,
      );
  }

  async syncBrandFromOption(
    productId: string,
    brandId: string,
  ): Promise<void> {
    await this.db
      .update(schema.products)
      .set({ brandId })
      .where(eq(schema.products.id, productId));
  }
}
