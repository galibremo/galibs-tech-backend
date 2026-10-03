import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  ilike,
  or,
  sql,
  getTableColumns,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';

export type ProductsDatabase = NodePgDatabase<typeof schema>;
export type ProductResponse = Omit<
  typeof schema.products.$inferSelect,
  'searchVector'
>;

export const { searchVector: _searchVector, ...publicProductColumns } = getTableColumns(schema.products);

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

  findProductById(id: string): Promise<ProductResponse | undefined> {
    return this.db.query.products.findFirst({
      columns: { searchVector: false },
      where: and(eq(schema.products.id, id), isNull(schema.products.deletedAt)),
    });
  }

  findProductByIdIncludingDeleted(
    id: string,
  ): Promise<ProductResponse | undefined> {
    return this.db.query.products.findFirst({
      columns: { searchVector: false },
      where: eq(schema.products.id, id),
    });
  }

  findProductDetailBySlug(slug: string) {
    return this.db.query.products.findFirst({
      columns: { searchVector: false },
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
    limit: number = 10,
    search?: string,
  ): Promise<{
    rows: ProductResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const term = search?.trim();

    const conditions = [isNull(schema.products.deletedAt)];

    // reused in WHERE and ORDER BY
    const tsQuery = term ? sql`websearch_to_tsquery('english', ${term})` : null;
    const rank = tsQuery
      ? sql`ts_rank(${schema.products.searchVector}, ${tsQuery})`
      : null;

    if (term && tsQuery) {
      const termForIlike = term.replace(/[%_]/g, '\\$&');
      conditions.push(
        or(
          // 1. word-based match: "shoe running" finds "Running Shoes"
          sql`${schema.products.searchVector} @@ ${tsQuery}`,
          // 2. partial match: "galax" finds "Galaxy"
          ilike(schema.products.name, `%${termForIlike}%`),
          ilike(schema.products.searchDocument, `%${termForIlike}%`),
          // 3. typo match (word similarity handles long names better): "samsng" finds "Samsung Galaxy..."
          sql`${term} <% ${schema.products.name}`,
          // 4. your existing category match
          inArray(
            schema.products.primaryCategoryId,
            this.db
              .select({ id: schema.categories.id })
              .from(schema.categories)
              .where(ilike(schema.categories.name, `%${termForIlike}%`)),
          ),
        )!,
      );
    }

    const where = and(...conditions);

    // when searching, best matches first; otherwise newest first
    const orderBy = rank
      ? [desc(rank), desc(schema.products.createdAt), desc(schema.products.id)]
      : [desc(schema.products.createdAt), desc(schema.products.id)];

    const [rows, totalRows] = await Promise.all([
      this.db
        .select(publicProductColumns)
        .from(schema.products)
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(schema.products).where(where),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.value ?? 0),
      page,
      limit,
    };
  }

  async listFeaturedProducts(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    rows: ProductResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const featuredCondition = and(
      isNull(schema.products.deletedAt),
      eq(schema.products.isActive, true),
      eq(schema.products.isFeatured, true),
    );

    const [rows, totalRows] = await Promise.all([
      this.db
        .select(publicProductColumns)
        .from(schema.products)
        .where(featuredCondition)
        .orderBy(
          asc(schema.products.featuredSortOrder),
          asc(schema.products.createdAt),
          desc(schema.products.id),
        )
        .limit(limit)
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
      limit,
    };
  }

  async createProductWithPrimaryCategory(
    data: typeof schema.products.$inferInsert,
  ): Promise<ProductResponse | undefined> {
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
  ): Promise<ProductResponse | undefined> {
    return this.db
      .update(schema.products)
      .set(data)
      .where(and(eq(schema.products.id, id), isNull(schema.products.deletedAt)))
      .returning(publicProductColumns)
      .then((rows) => rows[0] as ProductResponse);
  }

  async softDeleteProduct(id: string): Promise<ProductResponse | undefined> {
    return this.db
      .update(schema.products)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(and(eq(schema.products.id, id), isNull(schema.products.deletedAt)))
      .returning(publicProductColumns)
      .then((rows) => rows[0] as ProductResponse);
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
        eq(schema.productAttributeValues.attributeId, schema.attributes.id),
      )
      .innerJoin(
        schema.attributeOptions,
        eq(
          schema.productAttributeValues.attributeOptionId,
          schema.attributeOptions.id,
        ),
      )
      .where(eq(schema.productAttributeValues.productId, productId))
      .orderBy(schema.attributes.sortOrder, schema.attributeOptions.sortOrder);
  }

  async syncBrandFromOption(productId: string, brandId: string): Promise<void> {
    await this.db
      .update(schema.products)
      .set({ brandId })
      .where(eq(schema.products.id, productId));
  }
}
