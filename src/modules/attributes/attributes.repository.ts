import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DATABASE_CONNECTION } from 'src/core/database/drizzle/drizzle.tokens';
import schema from 'src/core/database/drizzle/drizzle.schema';

export type AttributesDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class AttributesRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE_CONNECTION)
    private readonly db: AttributesDatabase,
  ) {}

  findAttributeById(
    id: string,
  ): Promise<typeof schema.attributes.$inferSelect | undefined> {
    return this.db.query.attributes.findFirst({
      where: eq(schema.attributes.id, id),
    });
  }

  findAttributeByCode(
    code: string,
  ): Promise<typeof schema.attributes.$inferSelect | undefined> {
    return this.db.query.attributes.findFirst({
      where: eq(schema.attributes.code, code),
    });
  }

  findAttributeWithOptions(id: string) {
    return this.db.query.attributes.findFirst({
      where: eq(schema.attributes.id, id),
      with: {
        options: {
          orderBy: [asc(schema.attributeOptions.sortOrder)],
        },
      },
    });
  }

  findAttributeWithOptionsByCode(code: string) {
    return this.db.query.attributes.findFirst({
      where: eq(schema.attributes.code, code),
      with: {
        options: {
          orderBy: [asc(schema.attributeOptions.sortOrder)],
        },
      },
    });
  }

  async listAttributes(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{
    rows: (typeof schema.attributes.$inferSelect)[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(schema.attributes)
        .orderBy(
          asc(schema.attributes.sortOrder),
          desc(schema.attributes.createdAt),
        )
        .limit(pageSize)
        .offset(offset),
      this.db.select({ value: count() }).from(schema.attributes),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  async createAttribute(
    data: typeof schema.attributes.$inferInsert,
  ): Promise<typeof schema.attributes.$inferSelect | undefined> {
    return this.db
      .insert(schema.attributes)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async updateAttribute(
    id: string,
    data: Partial<typeof schema.attributes.$inferInsert>,
  ): Promise<typeof schema.attributes.$inferSelect | undefined> {
    return this.db
      .update(schema.attributes)
      .set(data)
      .where(eq(schema.attributes.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  findOptionById(
    id: string,
  ): Promise<typeof schema.attributeOptions.$inferSelect | undefined> {
    return this.db.query.attributeOptions.findFirst({
      where: eq(schema.attributeOptions.id, id),
    });
  }

  async listOptionsByAttributeId(
    attributeId: string,
  ): Promise<(typeof schema.attributeOptions.$inferSelect)[]> {
    return this.db
      .select()
      .from(schema.attributeOptions)
      .where(eq(schema.attributeOptions.attributeId, attributeId))
      .orderBy(asc(schema.attributeOptions.sortOrder));
  }

  async createOption(
    data: typeof schema.attributeOptions.$inferInsert,
  ): Promise<typeof schema.attributeOptions.$inferSelect | undefined> {
    return this.db
      .insert(schema.attributeOptions)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async updateOption(
    id: string,
    data: Partial<typeof schema.attributeOptions.$inferInsert>,
  ): Promise<typeof schema.attributeOptions.$inferSelect | undefined> {
    return this.db
      .update(schema.attributeOptions)
      .set(data)
      .where(eq(schema.attributeOptions.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

  async deactivateOption(
    id: string,
  ): Promise<typeof schema.attributeOptions.$inferSelect | undefined> {
    return this.db
      .update(schema.attributeOptions)
      .set({ isActive: false })
      .where(eq(schema.attributeOptions.id, id))
      .returning()
      .then((rows) => rows[0]);
  }

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

  findCategoryAttribute(categoryId: string, attributeId: string) {
    return this.db.query.categoryAttributes.findFirst({
      where: and(
        eq(schema.categoryAttributes.categoryId, categoryId),
        eq(schema.categoryAttributes.attributeId, attributeId),
      ),
    });
  }

  async assignCategoryAttribute(
    data: typeof schema.categoryAttributes.$inferInsert,
  ): Promise<typeof schema.categoryAttributes.$inferSelect | undefined> {
    return this.db
      .insert(schema.categoryAttributes)
      .values(data)
      .returning()
      .then((rows) => rows[0]);
  }

  async updateCategoryAttribute(
    categoryId: string,
    attributeId: string,
    data: Partial<typeof schema.categoryAttributes.$inferInsert>,
  ): Promise<typeof schema.categoryAttributes.$inferSelect | undefined> {
    return this.db
      .update(schema.categoryAttributes)
      .set(data)
      .where(
        and(
          eq(schema.categoryAttributes.categoryId, categoryId),
          eq(schema.categoryAttributes.attributeId, attributeId),
        ),
      )
      .returning()
      .then((rows) => rows[0]);
  }

  async getCategoryFilters(categoryId: string) {
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

    return mappings;
  }
}
