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

const BRAND_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'name', queryName: 'name' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'updatedAt', queryName: 'updatedAt' },
] as const;

export const BrandsListQuerySchema = baseQuerySchema(BRAND_SORTABLE_FIELDS);

export const CreateBrandSchema = z
  .object({
    name: validateString('Name', { max: 255 }),
    slug: validateString('Slug', { max: 255 }),
    logoUrl: validateString('Logo URL').nullable().optional(),
    description: validateString('Description').nullable().optional(),
    isActive: validateBoolean('Is Active').optional().default(true),
    isFeatured: validateBoolean('Is Featured').optional().default(false),
    sortOrder: validateNumber('Sort Order').optional().default(0),
    metaTitle: validateString('Meta Title', { max: 255 }).nullable().optional(),
    metaDescription: validateString('Meta Description').nullable().optional(),
  })
  .strict();

export const UpdateBrandSchema = z
  .object({
    name: validateString('Name', { max: 255 }).optional(),
    slug: validateString('Slug', { max: 255 }).optional(),
    logoUrl: validateString('Logo URL').nullable().optional(),
    description: validateString('Description').nullable().optional(),
    isActive: validateBoolean('Is Active').optional(),
    isFeatured: validateBoolean('Is Featured').optional(),
    sortOrder: validateNumber('Sort Order').optional(),
    metaTitle: validateString('Meta Title', { max: 255 }).nullable().optional(),
    metaDescription: validateString('Meta Description').nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const BrandResponseSchema = z.object({
  id: validateUUID('Brand ID'),
  name: validateString('Name'),
  slug: validateString('Slug'),
  logoUrl: validateString('Logo URL').nullable(),
  description: validateString('Description').nullable(),
  isActive: validateBoolean('Is Active'),
  isFeatured: validateBoolean('Is Featured'),
  sortOrder: validateNumber('Sort Order'),
  metaTitle: validateString('Meta Title').nullable(),
  metaDescription: validateString('Meta Description').nullable(),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const BrandListResponseSchema = z.object({
  rows: z.array(BrandResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const DeleteBrandResponseSchema = z.object({
  deleted: z.boolean(),
});

export const BrandApiResponseSchema = createApiResponseSchema(
  BrandResponseSchema,
);
export const BrandListApiResponseSchema = createApiResponseSchema(
  BrandListResponseSchema,
);
export const DeleteBrandApiResponseSchema = createApiResponseSchema(
  DeleteBrandResponseSchema,
);

export type BrandsListQueryDto = z.infer<typeof BrandsListQuerySchema>;
export type CreateBrandDto = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandDto = z.infer<typeof UpdateBrandSchema>;
export type BrandResponse = z.infer<typeof BrandResponseSchema>;
export type BrandListResponse = z.infer<typeof BrandListResponseSchema>;
export type DeleteBrandResponse = z.infer<typeof DeleteBrandResponseSchema>;
export type BrandApiResponse = z.infer<typeof BrandApiResponseSchema>;
export type BrandListApiResponse = z.infer<typeof BrandListApiResponseSchema>;
export type DeleteBrandApiResponse = z.infer<
  typeof DeleteBrandApiResponseSchema
>;
