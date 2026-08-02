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

    findCategoryById(id: string): Promise<typeof schema.categories.$inferSelect | undefined> {
        return this.db.query.categories.findFirst({
            where: eq(schema.categories.id, id),
        });
    }

    findCategoryBySlug(slug: string): Promise<typeof schema.categories.$inferSelect | undefined> {
        return this.db.query.categories.findFirst({
            where: eq(schema.categories.slug, slug),
        });
    }

    async listCategories(
        page: number = 1,
        pageSize: number = 10,
    ): Promise<{
        rows: typeof schema.categories.$inferSelect[];
        total: number;
        page: number;
        pageSize: number;
    }> {
        const offset = (page - 1) * pageSize;

        const [rows, totalRows] = await Promise.all([
            this.db
                .select()
                .from(schema.categories)
                .orderBy(desc(schema.categories.createdAt))
                .limit(pageSize)
                .offset(offset),
            this.db.select({ value: count() }).from(schema.categories),
        ]);

        return {
            rows,
            total: Number(totalRows[0]?.value ?? 0),
            page,
            pageSize,
        };
    }
    
    async getAllCategories(): Promise<typeof schema.categories.$inferSelect[]> {
        return this.db.query.categories.findMany({
            orderBy: desc(schema.categories.createdAt)
        });
    }

    async createCategory(
        data: typeof schema.categories.$inferInsert,
    ): Promise<typeof schema.categories.$inferSelect | undefined> {
        return this.db
            .insert(schema.categories)
            .values(data)
            .returning()
            .then((rows) => rows[0]);
    }

    async updateCategory(
        id: string,
        data: Partial<typeof schema.categories.$inferInsert>,
    ): Promise<typeof schema.categories.$inferSelect | undefined> {
        return this.db
            .update(schema.categories)
            .set(data)
            .where(eq(schema.categories.id, id))
            .returning()
            .then((rows) => rows[0]);
    }

    async deleteCategory(id: string): Promise<typeof schema.categories.$inferSelect | undefined> {
        return this.db
            .update(schema.categories)
            .set({ isActive: false })
            .where(eq(schema.categories.id, id))
            .returning()
            .then((rows) => rows[0]);
    }
}
