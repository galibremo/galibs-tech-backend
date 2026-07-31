import { Inject, Injectable } from "@nestjs/common";
import { eq, count, desc } from "drizzle-orm";
import { DRIZZLE_DATABASE_CONNECTION } from "src/core/database/drizzle/drizzle.tokens";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import schema from "src/core/database/drizzle/drizzle.schema";

export type CategoriesDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class CategoriesRepository {
    constructor(
        @Inject(DRIZZLE_DATABASE_CONNECTION)
        private readonly db: CategoriesDatabase,
    ) { }

    findBrandById(id: string): Promise<typeof schema.brands.$inferSelect | undefined> {
        return this.db.query.brands.findFirst({
            where: eq(schema.brands.id, id),
        });
    }

    findBrandBySlug(slug: string): Promise<typeof schema.brands.$inferSelect | undefined> {
        return this.db.query.brands.findFirst({
            where: eq(schema.brands.slug, slug),
        });
    }

    async listBrands(
        page: number = 1,
        pageSize: number = 10,
    ): Promise<{
        rows: typeof schema.brands.$inferSelect[];
        total: number;
        page: number;
        pageSize: number;
    }> {
        const offset = (page - 1) * pageSize;

        const [rows, totalRows] = await Promise.all([
            this.db
                .select()
                .from(schema.brands)
                .orderBy(desc(schema.brands.createdAt))
                .limit(pageSize)
                .offset(offset),
            this.db.select({ value: count() }).from(schema.brands),
        ]);

        return {
            rows,
            total: Number(totalRows[0]?.value ?? 0),
            page,
            pageSize,
        };
    }

    async createBrand(
        data: typeof schema.brands.$inferInsert,
    ): Promise<typeof schema.brands.$inferSelect | undefined> {
        return this.db
            .insert(schema.brands)
            .values(data)
            .returning()
            .then((rows) => rows[0]);
    }

    async updateBrand(
        id: string,
        data: Partial<typeof schema.brands.$inferInsert>,
    ): Promise<typeof schema.brands.$inferSelect | undefined> {
        return this.db
            .update(schema.brands)
            .set(data)
            .where(eq(schema.brands.id, id))
            .returning()
            .then((rows) => rows[0]);
    }

    async deleteBrand(id: string): Promise<typeof schema.brands.$inferSelect | undefined> {
        return this.db
            .delete(schema.brands)
            .where(eq(schema.brands.id, id))
            .returning()
            .then((rows) => rows[0]);
    }
}
