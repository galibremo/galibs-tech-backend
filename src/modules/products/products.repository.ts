import { Inject, Injectable } from "@nestjs/common";
import { eq, count, desc, asc, and, gte, lte, ilike, SQL } from "drizzle-orm";
import { DRIZZLE_DATABASE_CONNECTION } from "../../core/database/drizzle/drizzle.tokens";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import schema from "../../core/database/drizzle/drizzle.schema";
import type { ProductsListQueryDto } from "./schemas/products.schema";

export type ProductsDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class ProductsRepository {
    constructor(
        @Inject(DRIZZLE_DATABASE_CONNECTION)
        private readonly db: ProductsDatabase,
    ) {}

    findProductById(id: string) {
        return this.db.query.products.findFirst({
            where: eq(schema.products.id, id),
            with: {
                variants: true,
                brand: true,
                category: true,
            },
        });
    }

    findProductBySlug(slug: string) {
        return this.db.query.products.findFirst({
            where: eq(schema.products.slug, slug),
            with: {
                variants: true,
                brand: true,
                category: true,
            },
        });
    }

    findProductBySku(sku: string) {
        return this.db.query.products.findFirst({
            where: eq(schema.products.sku, sku),
        });
    }

    findVariantBySku(sku: string) {
        return this.db.query.productVariants.findFirst({
            where: eq(schema.productVariants.sku, sku),
        });
    }

    async listProducts(
        query: ProductsListQueryDto,
    ) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const offset = (page - 1) * pageSize;

        const filters: SQL[] = [];

        if (query.categoryId) {
            filters.push(eq(schema.products.categoryId, query.categoryId));
        }
        if (query.brandId) {
            filters.push(eq(schema.products.brandId, query.brandId));
        }
        if (query.isFeatured !== undefined) {
            filters.push(eq(schema.products.isFeatured, query.isFeatured));
        }
        if (query.isTrending !== undefined) {
            filters.push(eq(schema.products.isTrending, query.isTrending));
        }
        if (query.minPrice !== undefined) {
            filters.push(gte(schema.products.regularPrice, query.minPrice.toString()));
        }
        if (query.maxPrice !== undefined) {
            filters.push(lte(schema.products.regularPrice, query.maxPrice.toString()));
        }
        if (query.search) {
            filters.push(ilike(schema.products.name, `%${query.search}%`));
        }

        const whereCondition = filters.length > 0 ? and(...filters) : undefined;

        const getSortField = (sort?: string) => {
            switch (sort) {
                case 'price': return schema.products.regularPrice;
                case 'name': return schema.products.name;
                case 'updatedAt': return schema.products.updatedAt;
                case 'createdAt':
                default: return schema.products.createdAt;
            }
        };

        let orderByCondition = desc(schema.products.createdAt);
        if (query.sort) {
            const sortField = getSortField(query.sort);
            orderByCondition = query.dir === 'asc' ? asc(sortField) : desc(sortField);
        }

        const [rows, totalRows] = await Promise.all([
            this.db.query.products.findMany({
                where: whereCondition,
                orderBy: orderByCondition,
                limit: pageSize,
                offset: offset,
                with: {
                    variants: true,
                }
            }),
            this.db.select({ value: count() }).from(schema.products).where(whereCondition),
        ]);

        return {
            rows,
            total: Number(totalRows[0]?.value ?? 0),
            page,
            pageSize,
        };
    }

    async createProductWithVariants(
        productData: typeof schema.products.$inferInsert,
        variantsData: Omit<typeof schema.productVariants.$inferInsert, 'productId'>[],
    ) {
        return this.db.transaction(async (tx) => {
            const [createdProduct] = await tx
                .insert(schema.products)
                .values(productData)
                .returning();

            if (!createdProduct) {
                throw new Error("Failed to create product");
            }

            let createdVariants: (typeof schema.productVariants.$inferSelect)[] = [];

            if (variantsData.length > 0) {
                const variantsToInsert = variantsData.map(v => ({
                    ...v,
                    productId: createdProduct.id,
                }));
                
                createdVariants = await tx
                    .insert(schema.productVariants)
                    .values(variantsToInsert)
                    .returning();
            }

            return {
                ...createdProduct,
                variants: createdVariants,
            };
        });
    }

    async updateProduct(
        id: string,
        productData: Partial<typeof schema.products.$inferInsert>,
    ) {
        return this.db
            .update(schema.products)
            .set(productData)
            .where(eq(schema.products.id, id))
            .returning()
            .then((rows) => rows[0]);
    }

    async deleteProduct(id: string) {
        return this.db
            .delete(schema.products)
            .where(eq(schema.products.id, id))
            .returning()
            .then((rows) => rows[0]);
    }
}
