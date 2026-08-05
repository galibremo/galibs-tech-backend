import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE_DATABASE_CONNECTION } from "src/core/database/drizzle/drizzle.tokens";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import schema from "src/core/database/drizzle/drizzle.schema";

export type SpecificationsDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class SpecificationsRepository {
    constructor(
        @Inject(DRIZZLE_DATABASE_CONNECTION)
        private readonly db: SpecificationsDatabase,
    ) { }

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
        specs: { fieldId: string; value: string }[]
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            // Delete existing specs for this product
            await tx
                .delete(schema.productSpecifications)
                .where(eq(schema.productSpecifications.productId, productId));

            // Insert new specs if provided
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
                        group: true
                    }
                }
            }
        });
    }
}
