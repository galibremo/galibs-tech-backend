import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  baseQuerySchema,
  type SortableField,
} from '../../../core/validators/base-query.schema';
import {
  validateArray,
  validateBoolean,
  validateDate,
  validateEnum,
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

export const PRODUCT_TYPES = ['SIMPLE', 'VARIABLE'] as const;
export const STOCK_STATUSES = [
  'IN_STOCK',
  'OUT_OF_STOCK',
  'LOW_STOCK',
  'PRE_ORDER',
  'UPCOMING',
] as const;

const PRODUCT_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'name', queryName: 'name' },
  { name: 'price', queryName: 'price' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'updatedAt', queryName: 'updatedAt' },
] as const;

export const ProductsListQuerySchema = baseQuerySchema(
  PRODUCT_SORTABLE_FIELDS,
).extend({
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const CreateProductSchema = z
  .object({
    type: validateEnum('Type', PRODUCT_TYPES).optional().default('SIMPLE'),
    productCode: validateString('Product Code', { max: 64 }),
    sku: validateString('SKU', { max: 120 }).nullable().optional(),
    name: validateString('Name', { max: 255 }),
    slug: validateString('Slug', { max: 255 }),
    brandId: validateUUID('Brand ID'),
    primaryCategoryId: validateUUID('Primary Category ID'),
    price: validateNumber('Price', { min: 0, int: true }),
    regularPrice: validateNumber('Regular Price', { min: 0, int: true })
      .nullable()
      .optional(),
    availability: validateEnum('Availability', STOCK_STATUSES)
      .optional()
      .default('IN_STOCK'),
    stockQty: validateNumber('Stock Qty', { min: 0, int: true })
      .optional()
      .default(0),
    keyFeatures: validateArray(
      'Key Features',
      validateString('Key Feature', { max: 500 }),
    )
      .optional()
      .default([]),
    shortDescription: validateString('Short Description').nullable().optional(),
    description: validateString('Description').nullable().optional(),
    thumbnailUrl: validateString('Thumbnail URL').nullable().optional(),
    warrantyText: validateString('Warranty Text', { max: 255 })
      .nullable()
      .optional(),
    warrantyMonths: validateNumber('Warranty Months', { min: 0, int: true })
      .nullable()
      .optional(),
    emiMonthlyAmount: validateNumber('EMI Monthly Amount', {
      min: 0,
      int: true,
    })
      .nullable()
      .optional(),
    badges: validateArray('Badges', validateString('Badge', { max: 80 }))
      .optional()
      .default([]),
    isFeatured: validateBoolean('Is Featured').optional().default(false),
    featuredSortOrder: validateNumber('Featured Sort Order', {
      min: 0,
      int: true,
    })
      .optional()
      .default(0),
  })
  .strict();

export const UpdateProductSchema = z
  .object({
    type: validateEnum('Type', PRODUCT_TYPES).optional(),
    productCode: validateString('Product Code', { max: 64 }).optional(),
    sku: validateString('SKU', { max: 120 }).nullable().optional(),
    name: validateString('Name', { max: 255 }).optional(),
    slug: validateString('Slug', { max: 255 }).optional(),
    brandId: validateUUID('Brand ID').optional(),
    primaryCategoryId: validateUUID('Primary Category ID').optional(),
    price: validateNumber('Price', { min: 0, int: true }).optional(),
    regularPrice: validateNumber('Regular Price', { min: 0, int: true })
      .nullable()
      .optional(),
    maxPrice: validateNumber('Max Price', { min: 0, int: true })
      .nullable()
      .optional(),
    availability: validateEnum('Availability', STOCK_STATUSES).optional(),
    stockQty: validateNumber('Stock Qty', { min: 0, int: true }).optional(),
    keyFeatures: validateArray(
      'Key Features',
      validateString('Key Feature', { max: 500 }),
    ).optional(),
    shortDescription: validateString('Short Description').nullable().optional(),
    description: validateString('Description').nullable().optional(),
    thumbnailUrl: validateString('Thumbnail URL').nullable().optional(),
    warrantyText: validateString('Warranty Text', { max: 255 })
      .nullable()
      .optional(),
    warrantyMonths: validateNumber('Warranty Months', { min: 0, int: true })
      .nullable()
      .optional(),
    emiMonthlyAmount: validateNumber('EMI Monthly Amount', {
      min: 0,
      int: true,
    })
      .nullable()
      .optional(),
    badges: validateArray(
      'Badges',
      validateString('Badge', { max: 80 }),
    ).optional(),
    isActive: validateBoolean('Is Active').optional(),
    isFeatured: validateBoolean('Is Featured').optional(),
    featuredSortOrder: validateNumber('Featured Sort Order', {
      min: 0,
      int: true,
    }).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const AddProductImageSchema = z
  .object({
    url: validateString('URL'),
    altText: validateString('Alt Text', { max: 255 }).nullable().optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
    isPrimary: validateBoolean('Is Primary').optional().default(false),
    variantId: validateUUID('Variant ID').nullable().optional(),
  })
  .strict();

export const AddProductCategoriesSchema = z
  .object({
    categoryIds: validateArray(
      'Category IDs',
      validateUUID('Category ID'),
      { min: 1 },
    ),
  })
  .strict();

export const ProductAttributeOptionsSchema = z
  .object({
    optionIds: validateArray('Option IDs', validateUUID('Option ID'), {
      min: 1,
    }),
  })
  .strict();

export const BrandSummarySchema = z.object({
  id: validateUUID('Brand ID'),
  name: validateString('Name'),
  slug: validateString('Slug'),
});

export const CategorySummarySchema = z.object({
  id: validateUUID('Category ID'),
  name: validateString('Name'),
  slug: validateString('Slug'),
});

export const ProductImageResponseSchema = z.object({
  id: validateUUID('Image ID'),
  productId: validateUUID('Product ID'),
  variantId: validateUUID('Variant ID').nullable(),
  url: validateString('URL'),
  altText: validateString('Alt Text').nullable(),
  sortOrder: validateNumber('Sort Order'),
  isPrimary: validateBoolean('Is Primary'),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const ProductCategoryLinkSchema = z.object({
  categoryId: validateUUID('Category ID'),
  isPrimary: validateBoolean('Is Primary'),
  category: CategorySummarySchema.optional(),
});

export const ProductOptionValueSummarySchema = z.object({
  id: validateUUID('Option Value ID'),
  label: validateString('Label'),
  slug: validateString('Slug'),
  swatchValue: validateString('Swatch Value').nullable(),
  sortOrder: validateNumber('Sort Order'),
});

export const ProductOptionGroupSummarySchema = z.object({
  id: validateUUID('Option Group ID'),
  name: validateString('Name'),
  code: validateString('Code'),
  sortOrder: validateNumber('Sort Order'),
  values: z.array(ProductOptionValueSummarySchema),
});

export const ProductVariantSummarySchema = z.object({
  id: validateUUID('Variant ID'),
  sku: validateString('SKU'),
  title: validateString('Title'),
  price: validateNumber('Price'),
  regularPrice: validateNumber('Regular Price').nullable(),
  stockQty: validateNumber('Stock Qty'),
  availability: validateEnum('Availability', STOCK_STATUSES),
  isDefault: validateBoolean('Is Default'),
  thumbnailUrl: validateString('Thumbnail URL').nullable(),
  optionValueIds: z.array(validateUUID('Option Value ID')),
});

export const FeaturedProductCardResponseSchema = z.object({
  id: validateUUID('Product ID'),
  name: validateString('Name'),
  slug: validateString('Slug'),
  thumbnailUrl: validateString('Thumbnail URL').nullable(),
  price: validateNumber('Price'),
  regularPrice: validateNumber('Regular Price').nullable(),
  saveAmount: validateNumber('Save Amount').nullable(),
  savePercent: validateNumber('Save Percent').nullable(),
  availability: validateEnum('Availability', STOCK_STATUSES),
  featuredSortOrder: validateNumber('Featured Sort Order'),
});

export const ProductResponseSchema = z.object({
  id: validateUUID('Product ID'),
  type: validateEnum('Type', PRODUCT_TYPES),
  productCode: validateString('Product Code'),
  sku: validateString('SKU').nullable(),
  name: validateString('Name'),
  slug: validateString('Slug'),
  brandId: validateUUID('Brand ID'),
  primaryCategoryId: validateUUID('Primary Category ID'),
  keyFeatures: z.array(validateString('Key Feature')),
  price: validateNumber('Price'),
  regularPrice: validateNumber('Regular Price').nullable(),
  maxPrice: validateNumber('Max Price').nullable(),
  availability: validateEnum('Availability', STOCK_STATUSES),
  stockQty: validateNumber('Stock Qty'),
  warrantyText: validateString('Warranty Text').nullable(),
  warrantyMonths: validateNumber('Warranty Months').nullable(),
  emiMonthlyAmount: validateNumber('EMI Monthly Amount').nullable(),
  thumbnailUrl: validateString('Thumbnail URL').nullable(),
  badges: z.array(validateString('Badge')),
  shortDescription: validateString('Short Description').nullable(),
  description: validateString('Description').nullable(),
  searchDocument: validateString('Search Document').nullable(),
  isActive: validateBoolean('Is Active'),
  isFeatured: validateBoolean('Is Featured'),
  featuredSortOrder: validateNumber('Featured Sort Order'),
  deletedAt: validateDate('Deleted At').nullable(),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
  brand: BrandSummarySchema.optional(),
  primaryCategory: CategorySummarySchema.optional(),
  images: z.array(ProductImageResponseSchema).optional(),
  categories: z.array(ProductCategoryLinkSchema).optional(),
  optionGroups: z.array(ProductOptionGroupSummarySchema).optional(),
  variants: z.array(ProductVariantSummarySchema).optional(),
});

export const ProductListResponseSchema = z.object({
  rows: z.array(ProductResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const FeaturedProductListResponseSchema = z.object({
  rows: z.array(FeaturedProductCardResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const DeleteProductResponseSchema = z.object({
  deleted: z.boolean(),
});

export const ProductAttributeOptionResponseSchema = z.object({
  attributeId: validateUUID('Attribute ID'),
  attributeCode: validateString('Attribute Code'),
  attributeName: validateString('Attribute Name'),
  optionId: validateUUID('Option ID'),
  label: validateString('Label'),
  slug: validateString('Slug'),
});

export const ProductAttributesGroupedSchema = z.object({
  attributeId: validateUUID('Attribute ID'),
  code: validateString('Code'),
  name: validateString('Name'),
  options: z.array(
    z.object({
      id: validateUUID('Option ID'),
      label: validateString('Label'),
      slug: validateString('Slug'),
    }),
  ),
});

export const ProductAttributesResponseSchema = z.object({
  productId: validateUUID('Product ID'),
  groups: z.array(ProductAttributesGroupedSchema),
});

export const ProductApiResponseSchema =
  createApiResponseSchema(ProductResponseSchema);
export const ProductListApiResponseSchema = createApiResponseSchema(
  ProductListResponseSchema,
);
export const FeaturedProductListApiResponseSchema = createApiResponseSchema(
  FeaturedProductListResponseSchema,
);
export const DeleteProductApiResponseSchema = createApiResponseSchema(
  DeleteProductResponseSchema,
);
export const ProductImageApiResponseSchema = createApiResponseSchema(
  ProductImageResponseSchema,
);
export const ProductAttributesApiResponseSchema = createApiResponseSchema(
  ProductAttributesResponseSchema,
);
export const DeleteProductAttributeApiResponseSchema = createApiResponseSchema(
  z.object({ deleted: z.boolean() }),
);

export type ProductsListQueryDto = z.infer<typeof ProductsListQuerySchema>;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type AddProductImageDto = z.infer<typeof AddProductImageSchema>;
export type AddProductCategoriesDto = z.infer<
  typeof AddProductCategoriesSchema
>;
export type ProductAttributeOptionsDto = z.infer<
  typeof ProductAttributeOptionsSchema
>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
export type FeaturedProductCardResponse = z.infer<
  typeof FeaturedProductCardResponseSchema
>;
export type FeaturedProductListResponse = z.infer<
  typeof FeaturedProductListResponseSchema
>;
export type DeleteProductResponse = z.infer<typeof DeleteProductResponseSchema>;
export type ProductImageResponse = z.infer<typeof ProductImageResponseSchema>;
export type ProductAttributesResponse = z.infer<
  typeof ProductAttributesResponseSchema
>;
export type ProductApiResponse = z.infer<typeof ProductApiResponseSchema>;
export type ProductListApiResponse = z.infer<
  typeof ProductListApiResponseSchema
>;
export type FeaturedProductListApiResponse = z.infer<
  typeof FeaturedProductListApiResponseSchema
>;
export type DeleteProductApiResponse = z.infer<
  typeof DeleteProductApiResponseSchema
>;
export type ProductImageApiResponse = z.infer<
  typeof ProductImageApiResponseSchema
>;
export type ProductAttributesApiResponse = z.infer<
  typeof ProductAttributesApiResponseSchema
>;
export type DeleteProductAttributeApiResponse = z.infer<
  typeof DeleteProductAttributeApiResponseSchema
>;
