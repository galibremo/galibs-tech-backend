import { Injectable } from '@nestjs/common';

import {
  badRequestError,
  conflictError,
  isDatabaseUniqueViolation,
  notFoundError,
} from '../../core/errors/domain-error';
import { ProductsRepository } from './products.repository';
import type {
  AddProductCategoriesDto,
  AddProductImageDto,
  CreateProductDto,
  DeleteProductResponse,
  ProductAttributesResponse,
  ProductAttributeOptionsDto,
  ProductImageResponse,
  ProductListResponse,
  ProductResponse,
  ProductsListQueryDto,
  UpdateProductDto,
} from './schemas/products.schema';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async listProducts(
    query: ProductsListQueryDto,
  ): Promise<ProductListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const products = await this.productsRepository.listProducts(page, pageSize);

    return {
      rows: products.rows.map((row) => this.mapProductRow(row)),
      total: products.total,
      page: products.page,
      pageSize: products.pageSize,
    };
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    const product =
      await this.productsRepository.findProductDetailBySlug(slug);
    if (!product) {
      throw notFoundError('product_not_found', 'Product not found');
    }

    return {
      ...this.mapProductRow(product),
      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            slug: product.brand.slug,
          }
        : undefined,
      primaryCategory: product.primaryCategory
        ? {
            id: product.primaryCategory.id,
            name: product.primaryCategory.name,
            slug: product.primaryCategory.slug,
          }
        : undefined,
      images: product.images?.map((image) => ({
        id: image.id,
        productId: image.productId,
        variantId: image.variantId,
        url: image.url,
        altText: image.altText,
        sortOrder: image.sortOrder,
        isPrimary: image.isPrimary,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
      })),
      categories: product.categories?.map((link) => ({
        categoryId: link.categoryId,
        isPrimary: link.isPrimary,
        category: link.category
          ? {
              id: link.category.id,
              name: link.category.name,
              slug: link.category.slug,
            }
          : undefined,
      })),
      optionGroups:
        product.type === 'VARIABLE'
          ? product.optionGroups?.map((group) => ({
              id: group.id,
              name: group.name,
              code: group.code,
              sortOrder: group.sortOrder,
              values: group.values.map((value) => ({
                id: value.id,
                label: value.label,
                slug: value.slug,
                swatchValue: value.swatchValue,
                sortOrder: value.sortOrder,
              })),
            }))
          : undefined,
      variants:
        product.type === 'VARIABLE'
          ? product.variants?.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              title: variant.title,
              price: variant.price,
              regularPrice: variant.regularPrice,
              stockQty: variant.stockQty,
              availability: variant.availability,
              isDefault: variant.isDefault,
              thumbnailUrl: variant.thumbnailUrl,
              optionValueIds: variant.optionValues.map(
                (link) => link.optionValueId,
              ),
            }))
          : undefined,
    };
  }

  async createProduct(data: CreateProductDto): Promise<ProductResponse> {
    const brand = await this.productsRepository.findBrandById(data.brandId);
    if (!brand) {
      throw notFoundError('brand_not_found', 'Brand not found');
    }

    const category = await this.productsRepository.findCategoryById(
      data.primaryCategoryId,
    );
    if (!category) {
      throw notFoundError('category_not_found', 'Primary category not found');
    }

    try {
      const created =
        await this.productsRepository.createProductWithPrimaryCategory({
          type: data.type,
          productCode: data.productCode,
          sku: data.type === 'SIMPLE' ? (data.sku ?? null) : null,
          name: data.name,
          slug: data.slug,
          brandId: data.brandId,
          primaryCategoryId: data.primaryCategoryId,
          price: data.price,
          regularPrice: data.regularPrice ?? null,
          availability: data.availability,
          stockQty: data.stockQty,
          keyFeatures: data.keyFeatures,
          shortDescription: data.shortDescription ?? null,
          description: data.description ?? null,
          thumbnailUrl: data.thumbnailUrl ?? null,
          warrantyText: data.warrantyText ?? null,
          warrantyMonths: data.warrantyMonths ?? null,
          earnPoints: data.earnPoints,
          emiMonthlyAmount: data.emiMonthlyAmount ?? null,
          badges: data.badges,
        });

      if (!created) {
        throw notFoundError(
          'product_not_found',
          'Product could not be created',
        );
      }

      return this.mapProductRow(created);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'product_already_exists',
          'A product with this slug or product code already exists.',
        );
      }
      throw error;
    }
  }

  async updateProduct(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductResponse> {
    const existing = await this.productsRepository.findProductById(id);
    if (!existing) {
      throw notFoundError('product_not_found', 'Product not found');
    }

    if (data.brandId) {
      const brand = await this.productsRepository.findBrandById(data.brandId);
      if (!brand) {
        throw notFoundError('brand_not_found', 'Brand not found');
      }
    }

    if (data.primaryCategoryId) {
      const category = await this.productsRepository.findCategoryById(
        data.primaryCategoryId,
      );
      if (!category) {
        throw notFoundError(
          'category_not_found',
          'Primary category not found',
        );
      }
    }

    try {
      const updated = await this.productsRepository.updateProduct(id, data);
      if (!updated) {
        throw notFoundError(
          'product_not_found',
          'Product not found after update',
        );
      }
      return this.mapProductRow(updated);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'product_already_exists',
          'A product with this slug or product code already exists.',
        );
      }
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<DeleteProductResponse> {
    const existing = await this.productsRepository.findProductById(id);
    if (!existing) {
      throw notFoundError('product_not_found', 'Product not found');
    }

    const deleted = await this.productsRepository.softDeleteProduct(id);
    if (!deleted) {
      throw notFoundError('product_not_found', 'Product not found');
    }

    return { deleted: true };
  }

  async addProductImage(
    productId: string,
    data: AddProductImageDto,
  ): Promise<ProductImageResponse> {
    const product = await this.productsRepository.findProductById(productId);
    if (!product) {
      throw notFoundError('product_not_found', 'Product not found');
    }

    const created = await this.productsRepository.addProductImage({
      productId,
      url: data.url,
      altText: data.altText ?? null,
      sortOrder: data.sortOrder,
      isPrimary: data.isPrimary,
      variantId: data.variantId ?? null,
    });

    if (!created) {
      throw notFoundError(
        'product_image_not_found',
        'Product image could not be created',
      );
    }

    return created;
  }

  async addProductCategories(
    productId: string,
    data: AddProductCategoriesDto,
  ): Promise<ProductResponse> {
    const product = await this.productsRepository.findProductById(productId);
    if (!product) {
      throw notFoundError('product_not_found', 'Product not found');
    }

    const categories = await this.productsRepository.findCategoriesByIds(
      data.categoryIds,
    );
    if (categories.length !== data.categoryIds.length) {
      throw badRequestError('One or more category IDs are invalid');
    }

    await this.productsRepository.linkProductCategories(
      productId,
      data.categoryIds,
    );

    return this.mapProductRow(product);
  }

  async replaceProductAttributes(
    productId: string,
    data: ProductAttributeOptionsDto,
  ): Promise<ProductAttributesResponse> {
    await this.ensureProductExists(productId);
    const resolved = await this.resolveAttributeOptions(data.optionIds);

    await this.productsRepository.replaceProductAttributes(
      productId,
      resolved.map((option) => ({
        attributeId: option.attributeId,
        attributeOptionId: option.id,
      })),
    );

    await this.maybeSyncBrand(productId, resolved);

    return this.getProductAttributes(productId);
  }

  async addProductAttributes(
    productId: string,
    data: ProductAttributeOptionsDto,
  ): Promise<ProductAttributesResponse> {
    await this.ensureProductExists(productId);
    const resolved = await this.resolveAttributeOptions(data.optionIds);

    await this.productsRepository.addProductAttributes(
      productId,
      resolved.map((option) => ({
        attributeId: option.attributeId,
        attributeOptionId: option.id,
      })),
    );

    await this.maybeSyncBrand(productId, resolved);

    return this.getProductAttributes(productId);
  }

  async getProductAttributes(
    productId: string,
  ): Promise<ProductAttributesResponse> {
    await this.ensureProductExists(productId);
    const rows =
      await this.productsRepository.listProductAttributes(productId);

    const groupsMap = new Map<
      string,
      ProductAttributesResponse['groups'][number]
    >();

    for (const row of rows) {
      const existing = groupsMap.get(row.attributeId);
      if (existing) {
        existing.options.push({
          id: row.optionId,
          label: row.label,
          slug: row.slug,
        });
      } else {
        groupsMap.set(row.attributeId, {
          attributeId: row.attributeId,
          code: row.attributeCode,
          name: row.attributeName,
          options: [
            {
              id: row.optionId,
              label: row.label,
              slug: row.slug,
            },
          ],
        });
      }
    }

    return {
      productId,
      groups: Array.from(groupsMap.values()),
    };
  }

  async removeProductAttribute(
    productId: string,
    optionId: string,
  ): Promise<{ deleted: boolean }> {
    await this.ensureProductExists(productId);
    const deleted = await this.productsRepository.removeProductAttribute(
      productId,
      optionId,
    );
    if (!deleted) {
      throw notFoundError(
        'product_attribute_not_found',
        'Product attribute option not found',
      );
    }
    return { deleted: true };
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const product = await this.productsRepository.findProductById(productId);
    if (!product) {
      throw notFoundError('product_not_found', 'Product not found');
    }
  }

  private async resolveAttributeOptions(optionIds: string[]) {
    const uniqueIds = [...new Set(optionIds)];
    const options =
      await this.productsRepository.findAttributeOptionsByIds(uniqueIds);

    if (options.length !== uniqueIds.length) {
      throw badRequestError('One or more attribute option IDs are invalid');
    }

    return options;
  }

  private async maybeSyncBrand(
    productId: string,
    options: Awaited<
      ReturnType<ProductsRepository['findAttributeOptionsByIds']>
    >,
  ): Promise<void> {
    const brandOption = options.find((option) => option.brandId);
    if (brandOption?.brandId) {
      await this.productsRepository.syncBrandFromOption(
        productId,
        brandOption.brandId,
      );
    }
  }

  private mapProductRow(
    row: {
      id: string;
      type: 'SIMPLE' | 'VARIABLE';
      productCode: string;
      sku: string | null;
      name: string;
      slug: string;
      brandId: string;
      primaryCategoryId: string;
      keyFeatures: string[];
      price: number;
      regularPrice: number | null;
      maxPrice: number | null;
      availability:
        | 'IN_STOCK'
        | 'OUT_OF_STOCK'
        | 'LOW_STOCK'
        | 'PRE_ORDER'
        | 'UPCOMING';
      stockQty: number;
      earnPoints: number;
      warrantyText: string | null;
      warrantyMonths: number | null;
      emiMonthlyAmount: number | null;
      thumbnailUrl: string | null;
      badges: string[];
      shortDescription: string | null;
      description: string | null;
      searchDocument: string | null;
      isActive: boolean;
      deletedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ): ProductResponse {
    return {
      id: row.id,
      type: row.type,
      productCode: row.productCode,
      sku: row.sku,
      name: row.name,
      slug: row.slug,
      brandId: row.brandId,
      primaryCategoryId: row.primaryCategoryId,
      keyFeatures: row.keyFeatures ?? [],
      price: row.price,
      regularPrice: row.regularPrice,
      maxPrice: row.maxPrice,
      availability: row.availability,
      stockQty: row.stockQty,
      earnPoints: row.earnPoints,
      warrantyText: row.warrantyText,
      warrantyMonths: row.warrantyMonths,
      emiMonthlyAmount: row.emiMonthlyAmount,
      thumbnailUrl: row.thumbnailUrl,
      badges: row.badges ?? [],
      shortDescription: row.shortDescription,
      description: row.description,
      searchDocument: row.searchDocument,
      isActive: row.isActive,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
