import { z } from 'zod';
import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  baseQuerySchema,
  type SortableField,
} from '../../../core/validators/base-query.schema';
import {
  validateBoolean,
  validateDate,
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

const PRODUCT_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'name', queryName: 'name' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'updatedAt', queryName: 'updatedAt' },
  { name: 'regularPrice', queryName: 'price' },
] as const;

export const ProductsListQuerySchema = baseQuerySchema(PRODUCT_SORTABLE_FIELDS).extend({
  categoryId: validateUUID('Category ID').optional(),
  brandId: validateUUID('Brand ID').optional(),
  minPrice: validateNumber('Min Price', { min: 0 }).optional(),
  maxPrice: validateNumber('Max Price', { min: 0 }).optional(),
  isFeatured: validateBoolean('Is Featured').optional(),
  isTrending: validateBoolean('Is Trending').optional(),
});

export const CreateProductVariantSchema = z
  .object({
    sku: validateString('SKU', { max: 100 }).optional(), // Optional, auto-generated if not provided
    color: validateString('Color', { max: 50 }).nullable().optional(),
    size: validateString('Size', { max: 50 }).nullable().optional(),
    priceAdjustment: z.union([z.string(), z.number()]).optional().transform((v) => (v ? String(v) : '0')),
    stock: validateNumber('Stock', { min: 0, int: true }).default(0),
  })
  .strict();

export const CreateProductSchema = z
  .object({
    categoryId: validateUUID('Category ID'),
    brandId: validateUUID('Brand ID').nullable().optional(),
    name: validateString('Name', { max: 255 }),
    slug: validateString('Slug', { max: 255 }),
    sku: validateString('SKU', { max: 100 }).optional(), // Optional, auto-generated if not provided
    summary: validateString('Summary').nullable().optional(),
    description: validateString('Description').nullable().optional(),
    regularPrice: z.union([z.string(), z.number()]).transform((v) => String(v)),
    discountPrice: z.union([z.string(), z.number()]).nullable().optional().transform((v) => (v ? String(v) : null)),
    stock: validateNumber('Stock', { min: 0, int: true }).default(0),
    stockStatus: validateString('Stock Status', { max: 50 }).default('IN_STOCK'),
    images: z.array(z.any()).default([]), // Expected to be JSON
    specifications: z.record(z.string(), z.any()).default({}), // Expected to be JSON
    warranty: validateString('Warranty', { max: 255 }).nullable().optional(),
    isActive: validateBoolean('Is Active').default(true),
    isFeatured: validateBoolean('Is Featured').default(false),
    isTrending: validateBoolean('Is Trending').default(false),
    variants: z.array(CreateProductVariantSchema).default([]),
  })
  .strict();

export const UpdateProductVariantSchema = z
  .object({
    id: validateUUID('Variant ID').optional(), // If provided, update; if not, create new
    sku: validateString('SKU', { max: 100 }).optional(),
    color: validateString('Color', { max: 50 }).nullable().optional(),
    size: validateString('Size', { max: 50 }).nullable().optional(),
    priceAdjustment: z.union([z.string(), z.number()]).optional().transform((v) => (v ? String(v) : undefined)),
    stock: validateNumber('Stock', { min: 0, int: true }).optional(),
  })
  .strict();

export const UpdateProductSchema = z
  .object({
    categoryId: validateUUID('Category ID').optional(),
    brandId: validateUUID('Brand ID').nullable().optional(),
    name: validateString('Name', { max: 255 }).optional(),
    slug: validateString('Slug', { max: 255 }).optional(),
    sku: validateString('SKU', { max: 100 }).optional(),
    summary: validateString('Summary').nullable().optional(),
    description: validateString('Description').nullable().optional(),
    regularPrice: z.union([z.string(), z.number()]).optional().transform((v) => (v ? String(v) : undefined)),
    discountPrice: z.union([z.string(), z.number()]).nullable().optional().transform((v) => (v ? String(v) : undefined)),
    stock: validateNumber('Stock', { min: 0, int: true }).optional(),
    stockStatus: validateString('Stock Status', { max: 50 }).optional(),
    images: z.array(z.any()).optional(),
    specifications: z.record(z.string(), z.any()).optional(),
    warranty: validateString('Warranty', { max: 255 }).nullable().optional(),
    isActive: validateBoolean('Is Active').optional(),
    isFeatured: validateBoolean('Is Featured').optional(),
    isTrending: validateBoolean('Is Trending').optional(),
    variants: z.array(UpdateProductVariantSchema).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const ProductVariantResponseSchema = z.object({
  id: validateUUID('Variant ID'),
  productId: validateUUID('Product ID'),
  sku: validateString('SKU'),
  color: validateString('Color').nullable(),
  size: validateString('Size').nullable(),
  priceAdjustment: validateString('Price Adjustment').nullable(),
  stock: validateNumber('Stock'),
});

export const ProductResponseSchema = z.object({
  id: validateUUID('Product ID'),
  categoryId: validateUUID('Category ID'),
  brandId: validateUUID('Brand ID').nullable(),
  name: validateString('Name'),
  slug: validateString('Slug'),
  sku: validateString('SKU'),
  summary: validateString('Summary').nullable(),
  description: validateString('Description').nullable(),
  regularPrice: validateString('Regular Price'),
  discountPrice: validateString('Discount Price').nullable(),
  stock: validateNumber('Stock'),
  stockStatus: validateString('Stock Status').nullable(),
  images: z.any().nullable(),
  specifications: z.any().nullable(),
  warranty: validateString('Warranty').nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isTrending: z.boolean(),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
  variants: z.array(ProductVariantResponseSchema).optional(),
});

export const ProductListResponseSchema = z.object({
  rows: z.array(ProductResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const DeleteProductResponseSchema = z.object({
  deleted: z.boolean(),
});

export const ProductApiResponseSchema = createApiResponseSchema(
  ProductResponseSchema,
);
export const ProductListApiResponseSchema = createApiResponseSchema(
  ProductListResponseSchema,
);
export const DeleteProductApiResponseSchema = createApiResponseSchema(
  DeleteProductResponseSchema,
);

export type ProductsListQueryDto = z.infer<typeof ProductsListQuerySchema>;
export type CreateProductVariantDto = z.infer<typeof CreateProductVariantSchema>;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductVariantDto = z.infer<typeof UpdateProductVariantSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
export type DeleteProductResponse = z.infer<typeof DeleteProductResponseSchema>;
export type ProductApiResponse = z.infer<typeof ProductApiResponseSchema>;
export type ProductListApiResponse = z.infer<typeof ProductListApiResponseSchema>;
export type DeleteProductApiResponse = z.infer<
  typeof DeleteProductApiResponseSchema
>;
