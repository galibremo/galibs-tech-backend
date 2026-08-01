import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { notFoundError, conflictError, isDatabaseUniqueViolation } from '../../core/errors/domain-error';
import {
    ProductResponseSchema,
    type ProductsListQueryDto,
    type CreateProductDto,
    type UpdateProductDto,
    type ProductResponse,
    type ProductListResponse,
    type DeleteProductResponse
} from './schemas/products.schema';


@Injectable()
export class ProductsService {
    constructor(private readonly productsRepository: ProductsRepository) { }

    private generateSku(prefix: string = 'PROD'): string {
        return `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    }

    async listProducts(query: ProductsListQueryDto): Promise<ProductListResponse> {
        const result = await this.productsRepository.listProducts(query);
        return {
            rows: result.rows.map(row => ProductResponseSchema.parse(row)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
        };
    }

    async getProductById(id: string): Promise<ProductResponse> {
        const product = await this.productsRepository.findProductById(id);
        if (!product) throw notFoundError('product_not_found', 'Product not found');
        return ProductResponseSchema.parse(product);
    }

    async getProductBySlug(slug: string): Promise<ProductResponse> {
        const product = await this.productsRepository.findProductBySlug(slug);
        if (!product) throw notFoundError('product_not_found', 'Product not found');
        return ProductResponseSchema.parse(product);
    }

    async createProduct(data: CreateProductDto): Promise<ProductResponse> {
        try {
            const productSku = data.sku || this.generateSku();

            const variantsData = data.variants.map((v, index) => ({
                sku: v.sku || `${productSku}-V${index + 1}`,
                regularPrice: v.regularPrice || data.regularPrice,
                discountPrice: v.discountPrice || null,
                variantCombination: v.variantCombination || {},
                stock: v.stock || 0,
            }));

            const createdProduct = await this.productsRepository.createProductWithVariants(
                {
                    categoryId: data.categoryId,
                    brandId: data.brandId || null,
                    name: data.name,
                    slug: data.slug,
                    sku: productSku,
                    shortDescription: data.shortDescription || null,
                    description: data.description || null,
                    regularPrice: data.regularPrice,
                    discountPrice: data.discountPrice || null,
                    stock: data.stock,
                    stockStatus: data.stockStatus,
                    images: data.images,
                    specifications: data.specifications,
                    warranty: data.warranty || null,
                    isActive: data.isActive,
                    isFeatured: data.isFeatured,
                    isTrending: data.isTrending,
                },
                variantsData
            );

            return ProductResponseSchema.parse(createdProduct);
        } catch (error) {
            if (isDatabaseUniqueViolation(error)) {
                throw conflictError('unique_constraint_violation', 'A product with this slug or SKU already exists.');
            }
            throw error;
        }
    }

    async updateProduct(id: string, data: UpdateProductDto): Promise<ProductResponse> {
        const targetProduct = await this.productsRepository.findProductById(id);
        if (!targetProduct) {
            throw notFoundError('product_not_found', 'Product not found');
        }

        try {
            // In a full implementation, you'd also want to handle updating/deleting/inserting variants in a transaction.
            const productUpdates = { ...data };
            delete productUpdates.variants;

            const updatedProduct = await this.productsRepository.updateProduct(targetProduct.id, productUpdates);
            if (!updatedProduct) throw notFoundError('product_not_found', 'Product not found after update');

            // Re-fetch to get relations if needed, or just return updated fields.
            return await this.getProductById(targetProduct.id);
        } catch (error) {
            if (isDatabaseUniqueViolation(error)) {
                throw conflictError('unique_constraint_violation', 'A product with this slug or SKU already exists.');
            }
            throw error;
        }
    }

    async deleteProduct(id: string): Promise<DeleteProductResponse> {
        const targetProduct = await this.productsRepository.findProductById(id);
        if (!targetProduct) {
            throw notFoundError('product_not_found', 'Product not found');
        }

        const deletedProduct = await this.productsRepository.deleteProduct(targetProduct.id);
        if (!deletedProduct) throw notFoundError('product_not_found', 'Product not found');

        return { deleted: true };
    }
}
