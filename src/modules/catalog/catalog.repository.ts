import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';
import type { CatalogSort, StockStatus } from './schemas/catalog.schema';

export type CatalogDatabase = NodePgDatabase<typeof schema>;

export type CatalogProductCard = {
  id: string;
  name: string;
  slug: string;
  type: 'SIMPLE' | 'VARIABLE';
  price: number;
  regularPrice: number | null;
  availability: StockStatus;
  thumbnailUrl: string | null;
  keyFeatures: string[];
};

export type AttributeOptionMeta = {
  id: string;
  label: string;
  attributeId: string;
  attributeCode: string;
  attributeName: string;
  attributeSortOrder: number;
  optionSortOrder: number;
};

export type CategoryFilterDefinition = {
  attributeId: string;
  attributeCode: string;
  attributeName: string;
  sortOrder: number;
  options: { id: string; label: string; sortOrder: number }[];
};

@Injectable()
export class CatalogRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: CatalogDatabase,
  ) {}

  findCategoryBySlug(
    slug: string,
  ): Promise<typeof schema.categories.$inferSelect | undefined> {
    return this.db.query.categories.findFirst({
      where: eq(schema.categories.slug, slug),
    });
  }

  async getCategoryFilterDefinitions(
    categoryId: string,
  ): Promise<CategoryFilterDefinition[]> {
    const mappings = await this.db.query.categoryAttributes.findMany({
      where: eq(schema.categoryAttributes.categoryId, categoryId),
      orderBy: [asc(schema.categoryAttributes.sortOrder)],
      with: {
        attribute: {
          with: {
            options: {
              where: eq(schema.attributeOptions.isActive, true),
              orderBy: [asc(schema.attributeOptions.sortOrder)],
            },
          },
        },
      },
    });

    return mappings
      .filter((mapping) => mapping.attribute.isFilterable)
      .map((mapping) => ({
        attributeId: mapping.attribute.id,
        attributeCode: mapping.attribute.code,
        attributeName: mapping.attribute.name,
        sortOrder: mapping.sortOrder,
        options: mapping.attribute.options.map((option) => ({
          id: option.id,
          label: option.label,
          sortOrder: option.sortOrder,
        })),
      }));
  }

  async findAttributeOptionsByIds(
    optionIds: string[],
  ): Promise<AttributeOptionMeta[]> {
    if (optionIds.length === 0) {
      return [];
    }

    return this.db
      .select({
        id: schema.attributeOptions.id,
        label: schema.attributeOptions.label,
        attributeId: schema.attributes.id,
        attributeCode: schema.attributes.code,
        attributeName: schema.attributes.name,
        attributeSortOrder: schema.attributes.sortOrder,
        optionSortOrder: schema.attributeOptions.sortOrder,
      })
      .from(schema.attributeOptions)
      .innerJoin(
        schema.attributes,
        eq(schema.attributeOptions.attributeId, schema.attributes.id),
      )
      .where(inArray(schema.attributeOptions.id, optionIds));
  }

  /**
   * Returns parent product IDs in a category that match price, availability,
   * and attribute filters (OR within attribute group, AND across groups).
   * Matches options on the parent product or any of its variants.
   */
  async findMatchingProductIds(params: {
    categoryId: string;
    priceMin?: number;
    priceMax?: number;
    availability: StockStatus[];
    filtersByAttribute: Map<string, string[]>;
  }): Promise<string[]> {
    const baseConditions = this.buildBaseConditions(params);
    const filterConditions = this.buildAttributeFilterConditions(
      params.filtersByAttribute,
    );

    const whereClause =
      filterConditions.length > 0
        ? and(...baseConditions, ...filterConditions)
        : and(...baseConditions);

    const rows = await this.db
      .selectDistinct({ id: schema.products.id })
      .from(schema.products)
      .innerJoin(
        schema.productCategories,
        eq(schema.productCategories.productId, schema.products.id),
      )
      .where(whereClause);

    return rows.map((row) => row.id);
  }

  async listProductsByIds(params: {
    productIds: string[];
    sort: CatalogSort;
    page: number;
    limit: number;
  }): Promise<{ items: CatalogProductCard[]; total: number }> {
    const { productIds, sort, page, limit } = params;
    if (productIds.length === 0) {
      return { items: [], total: 0 };
    }

    const total = productIds.length;
    const offset = (page - 1) * limit;

    const orderBy =
      sort === 'price_asc'
        ? [asc(schema.products.price), asc(schema.products.name)]
        : sort === 'price_desc'
          ? [desc(schema.products.price), asc(schema.products.name)]
          : [desc(schema.products.createdAt), asc(schema.products.name)];

    const items = await this.db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        slug: schema.products.slug,
        type: schema.products.type,
        price: schema.products.price,
        regularPrice: schema.products.regularPrice,
        availability: schema.products.availability,
        thumbnailUrl: schema.products.thumbnailUrl,
        keyFeatures: schema.products.keyFeatures,
      })
      .from(schema.products)
      .where(inArray(schema.products.id, productIds))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    return {
      items: items.map((item) => ({
        ...item,
        keyFeatures: item.keyFeatures ?? [],
      })),
      total,
    };
  }

  /**
   * Count distinct products that have each option (parent or variant),
   * restricted to the candidate product ID set.
   */
  async countProductsByOptionIds(params: {
    candidateProductIds: string[];
    optionIds: string[];
  }): Promise<Map<string, number>> {
    const { candidateProductIds, optionIds } = params;
    const result = new Map<string, number>();
    for (const optionId of optionIds) {
      result.set(optionId, 0);
    }

    if (candidateProductIds.length === 0 || optionIds.length === 0) {
      return result;
    }

    const productIdList = sql.join(
      candidateProductIds.map((id) => sql`${id}::uuid`),
      sql`, `,
    );
    const optionIdList = sql.join(
      optionIds.map((id) => sql`${id}::uuid`),
      sql`, `,
    );

    const unionCounts = await this.db.execute<{
      option_id: string;
      product_count: number;
    }>(sql`
      SELECT option_id, COUNT(DISTINCT product_id)::int AS product_count
      FROM (
        SELECT pav.attribute_option_id AS option_id, pav.product_id
        FROM product_attribute_values pav
        WHERE pav.product_id IN (${productIdList})
          AND pav.attribute_option_id IN (${optionIdList})
        UNION
        SELECT pvav.attribute_option_id AS option_id, pv.product_id
        FROM product_variant_attribute_values pvav
        INNER JOIN product_variants pv ON pv.id = pvav.variant_id
        WHERE pv.product_id IN (${productIdList})
          AND pv.deleted_at IS NULL
          AND pvav.attribute_option_id IN (${optionIdList})
      ) matched
      GROUP BY option_id
    `);

    const rows = this.extractRows(unionCounts);
    for (const row of rows) {
      result.set(String(row.option_id), Number(row.product_count));
    }

    return result;
  }

  private extractRows<T extends Record<string, unknown>>(
    result: unknown,
  ): T[] {
    if (Array.isArray(result)) {
      return result as T[];
    }
    if (
      typeof result === 'object' &&
      result !== null &&
      'rows' in result &&
      Array.isArray((result).rows)
    ) {
      return (result as { rows: T[] }).rows;
    }
    return [];
  }

  private buildBaseConditions(params: {
    categoryId: string;
    priceMin?: number;
    priceMax?: number;
    availability: StockStatus[];
  }): SQL[] {
    const conditions: SQL[] = [
      eq(schema.productCategories.categoryId, params.categoryId),
      eq(schema.products.isActive, true),
      isNull(schema.products.deletedAt),
    ];

    if (params.priceMin !== undefined) {
      conditions.push(gte(schema.products.price, params.priceMin));
    }
    if (params.priceMax !== undefined) {
      conditions.push(lte(schema.products.price, params.priceMax));
    }
    if (params.availability.length > 0) {
      conditions.push(
        inArray(schema.products.availability, params.availability),
      );
    }

    return conditions;
  }

  private buildAttributeFilterConditions(
    filtersByAttribute: Map<string, string[]>,
  ): SQL[] {
    const conditions: SQL[] = [];

    for (const optionIds of filtersByAttribute.values()) {
      if (optionIds.length === 0) {
        continue;
      }

      conditions.push(
        sql`(
          EXISTS (
            SELECT 1
            FROM ${schema.productAttributeValues} pav
            WHERE pav.product_id = ${schema.products.id}
              AND pav.attribute_option_id IN (${sql.join(
                optionIds.map((id) => sql`${id}::uuid`),
                sql`, `,
              )})
          )
          OR EXISTS (
            SELECT 1
            FROM ${schema.productVariantAttributeValues} pvav
            INNER JOIN ${schema.productVariants} pv
              ON pv.id = pvav.variant_id
            WHERE pv.product_id = ${schema.products.id}
              AND pv.deleted_at IS NULL
              AND pvav.attribute_option_id IN (${sql.join(
                optionIds.map((id) => sql`${id}::uuid`),
                sql`, `,
              )})
          )
        )`,
      );
    }

    return conditions;
  }
}
