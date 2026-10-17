import { Inject, Injectable } from "@nestjs/common";
import { eq, count, asc, desc, or, ilike, and, like, sql, type SQL } from "drizzle-orm";
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

    async listCategories(params: {
        page: number;
        limit: number;
        search?: string;
        isActive: boolean;
        sort?: string;
        dir?: 'asc' | 'desc';
    }): Promise<{
        rows: typeof schema.categories.$inferSelect[];
        total: number;
        page: number;
        limit: number;
    }> {
        const { page, limit, search, isActive, sort, dir } = params;
        const offset = (page - 1) * limit;
        const term = search?.trim();

        const conditions: SQL[] = [eq(schema.categories.isActive, isActive)];
        if (term) {
            const termForIlike = term.replace(/[%_]/g, '\\$&');
            conditions.push(
                or(
                    ilike(schema.categories.name, `%${termForIlike}%`),
                    ilike(schema.categories.slug, `%${termForIlike}%`),
                )!,
            );
        }

        const where = and(...conditions);
        const orderBy = this.buildListOrder(sort, dir);

        const [rows, totalRows] = await Promise.all([
            this.db
                .select()
                .from(schema.categories)
                .where(where)
                .orderBy(...orderBy)
                .limit(limit)
                .offset(offset),
            this.db.select({ value: count() }).from(schema.categories).where(where),
        ]);

        return {
            rows,
            total: Number(totalRows[0]?.value ?? 0),
            page,
            limit,
        };
    }

    /**
     * Honours the list `sort`/`dir` params; without them the list follows the
     * admin's `sortOrder`, then name, so it matches the storefront menu.
     */
    private buildListOrder(sort?: string, dir?: 'asc' | 'desc'): SQL[] {
        const direction = dir === 'desc' ? desc : asc;
        switch (sort) {
            case 'name':
                return [direction(schema.categories.name)];
            case 'createdAt':
                return [direction(schema.categories.createdAt), asc(schema.categories.name)];
            case 'updatedAt':
                return [direction(schema.categories.updatedAt), asc(schema.categories.name)];
            case 'sortOrder':
            default:
                return [direction(schema.categories.sortOrder), asc(schema.categories.name)];
        }
    }

    /**
     * Rows for the storefront tree: active, flagged for the menu, in
     * `sortOrder` then name. The service drops any branch whose parent is
     * excluded, so hiding a parent hides its subtree.
     */
    async getMenuCategories(): Promise<typeof schema.categories.$inferSelect[]> {
        return this.db.query.categories.findMany({
            where: and(
                eq(schema.categories.isActive, true),
                eq(schema.categories.showInMenu, true),
            ),
            orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
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

    /**
     * Updates a category and, in the same transaction, rewrites the materialised
     * `path` and `depth` of every descendant (rows whose path starts with
     * `oldPath/`). Descendants keep their suffix below the moved node:
     * `oldPath/x/y` becomes `newPath/x/y`, and depth shifts by `depthDelta`.
     */
    async updateCategoryAndSubtree(
        id: string,
        data: Partial<typeof schema.categories.$inferInsert>,
        oldPath: string,
        newPath: string,
        depthDelta: number,
    ): Promise<typeof schema.categories.$inferSelect | undefined> {
        return this.db.transaction(async (tx) => {
            const [updated] = await tx
                .update(schema.categories)
                .set(data)
                .where(eq(schema.categories.id, id))
                .returning();

            if (!updated) return undefined;

            const escapedOldPath = oldPath.replace(/[\\%_]/g, (char) => `\\${char}`);
            await tx
                .update(schema.categories)
                .set({
                    path: sql`${newPath}::varchar || substr(${schema.categories.path}, ${oldPath.length + 1})`,
                    depth: sql`${schema.categories.depth} + ${depthDelta}`,
                })
                .where(like(schema.categories.path, `${escapedOldPath}/%`));

            return updated;
        });
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
