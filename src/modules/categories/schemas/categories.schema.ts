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

const CATEGORY_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'name', queryName: 'name' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'updatedAt', queryName: 'updatedAt' },
] as const;

export const CategoriesListQuerySchema = baseQuerySchema(CATEGORY_SORTABLE_FIELDS);

export const CreateCategorySchema = z
  .object({
    name: validateString('Name', { max: 255 }),
    slug: validateString('Slug', { max: 255 }),
    parentId: validateUUID('Parent ID').nullable().optional(),
    path: validateString('Path', { max: 512 }),
    depth: validateNumber('Depth').optional().default(0),
    description: validateString('Description').nullable().optional(),
    shortDescription: validateString('Short Description').nullable().optional(),
    imageUrl: validateString('Image URL').nullable().optional(),
    isActive: validateBoolean('Is Active').optional().default(true),
    isFeatured: validateBoolean('Is Featured').optional().default(false),
    showInMenu: validateBoolean('Show in Menu').optional().default(true),
    sortOrder: validateNumber('Sort Order').optional().default(0),
    minPrice: validateNumber('Min Price').nullable().optional(),
    maxPrice: validateNumber('Max Price').nullable().optional(),
    productCount: validateNumber('Product Count').optional().default(0),
    metaTitle: validateString('Meta Title', { max: 255 }).nullable().optional(),
    metaDescription: validateString('Meta Description').nullable().optional(),
    seoContent: validateString('SEO Content').nullable().optional(),
  })
  .strict();

export const UpdateCategorySchema = z
  .object({
    name: validateString('Name', { max: 255 }).optional(),
    slug: validateString('Slug', { max: 255 }).optional(),
    parentId: validateUUID('Parent ID').nullable().optional(),
    path: validateString('Path', { max: 512 }).optional(),
    depth: validateNumber('Depth').optional(),
    description: validateString('Description').nullable().optional(),
    shortDescription: validateString('Short Description').nullable().optional(),
    imageUrl: validateString('Image URL').nullable().optional(),
    isActive: validateBoolean('Is Active').optional(),
    isFeatured: validateBoolean('Is Featured').optional(),
    showInMenu: validateBoolean('Show in Menu').optional(),
    sortOrder: validateNumber('Sort Order').optional(),
    minPrice: validateNumber('Min Price').nullable().optional(),
    maxPrice: validateNumber('Max Price').nullable().optional(),
    productCount: validateNumber('Product Count').optional(),
    metaTitle: validateString('Meta Title', { max: 255 }).nullable().optional(),
    metaDescription: validateString('Meta Description').nullable().optional(),
    seoContent: validateString('SEO Content').nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const CategoryResponseSchema = z.object({
  id: validateUUID('Category ID'),
  name: validateString('Name'),
  slug: validateString('Slug'),
  parentId: validateUUID('Parent ID').nullable(),
  path: validateString('Path'),
  depth: validateNumber('Depth'),
  description: validateString('Description').nullable(),
  shortDescription: validateString('Short Description').nullable(),
  imageUrl: validateString('Image URL').nullable(),
  isActive: validateBoolean('Is Active'),
  isFeatured: validateBoolean('Is Featured'),
  showInMenu: validateBoolean('Show in Menu'),
  sortOrder: validateNumber('Sort Order'),
  minPrice: validateNumber('Min Price').nullable(),
  maxPrice: validateNumber('Max Price').nullable(),
  productCount: validateNumber('Product Count'),
  metaTitle: validateString('Meta Title').nullable(),
  metaDescription: validateString('Meta Description').nullable(),
  seoContent: validateString('SEO Content').nullable(),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const CategoriesListResponseSchema = z.object({
  rows: z.array(CategoryResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const DeleteCategoryResponseSchema = z.object({
  deleted: z.boolean(),
});

export const CategoryApiResponseSchema = createApiResponseSchema(
  CategoryResponseSchema,
);
export const CategoriesListApiResponseSchema = createApiResponseSchema(
  CategoriesListResponseSchema,
);
export const DeleteCategoryApiResponseSchema = createApiResponseSchema(
  DeleteCategoryResponseSchema,
);

export type CategoriesListQueryDto = z.infer<typeof CategoriesListQuerySchema>;
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoriesListResponse = z.infer<typeof CategoriesListResponseSchema>;
export type DeleteCategoryResponse = z.infer<typeof DeleteCategoryResponseSchema>;
export type CategoryApiResponse = z.infer<typeof CategoryApiResponseSchema>;
export type CategoriesListApiResponse = z.infer<typeof CategoriesListApiResponseSchema>;
export type DeleteCategoryApiResponse = z.infer<
  typeof DeleteCategoryApiResponseSchema
>;
