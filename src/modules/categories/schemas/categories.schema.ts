import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  baseQuerySchema,
  type SortableField,
} from '../../../core/validators/base-query.schema';
import {
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
    parentId: validateString('Logo').nullable().optional(),
  })
  .strict();

export const UpdateCategorySchema = z
  .object({
    name: validateString('Name', { max: 255 }).optional(),
    slug: validateString('Slug', { max: 255 }).optional(),
    parentId: validateUUID('Logo').nullable().optional(),
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
