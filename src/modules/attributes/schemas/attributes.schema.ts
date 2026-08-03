import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  baseQuerySchema,
  type SortableField,
} from '../../../core/validators/base-query.schema';
import {
  validateBoolean,
  validateDate,
  validateEnum,
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

const ATTRIBUTE_INPUT_TYPES = [
  'MULTI_SELECT',
  'SINGLE_SELECT',
  'BOOLEAN',
  'RANGE',
] as const;

const ATTRIBUTE_DATA_TYPES = ['STRING', 'NUMBER', 'BOOLEAN'] as const;

const ATTRIBUTE_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'name', queryName: 'name' },
  { name: 'code', queryName: 'code' },
  { name: 'sortOrder', queryName: 'sortOrder' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'updatedAt', queryName: 'updatedAt' },
] as const;

export const AttributesListQuerySchema = baseQuerySchema(
  ATTRIBUTE_SORTABLE_FIELDS,
);

export const CreateAttributeSchema = z
  .object({
    code: validateString('Code', { max: 80 }),
    name: validateString('Name', { max: 120 }),
    inputType: validateEnum('Input Type', ATTRIBUTE_INPUT_TYPES)
      .optional()
      .default('MULTI_SELECT'),
    dataType: validateEnum('Data Type', ATTRIBUTE_DATA_TYPES)
      .optional()
      .default('STRING'),
    unit: validateString('Unit', { max: 32 }).nullable().optional(),
    description: validateString('Description').nullable().optional(),
    isFilterable: validateBoolean('Is Filterable').optional().default(true),
    isBrandAttribute: validateBoolean('Is Brand Attribute')
      .optional()
      .default(false),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
  })
  .strict();

export const UpdateAttributeSchema = z
  .object({
    code: validateString('Code', { max: 80 }).optional(),
    name: validateString('Name', { max: 120 }).optional(),
    inputType: validateEnum('Input Type', ATTRIBUTE_INPUT_TYPES).optional(),
    dataType: validateEnum('Data Type', ATTRIBUTE_DATA_TYPES).optional(),
    unit: validateString('Unit', { max: 32 }).nullable().optional(),
    description: validateString('Description').nullable().optional(),
    isFilterable: validateBoolean('Is Filterable').optional(),
    isBrandAttribute: validateBoolean('Is Brand Attribute').optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const CreateAttributeOptionSchema = z
  .object({
    label: validateString('Label', { max: 160 }),
    slug: validateString('Slug', { max: 180 }).optional(),
    brandId: validateUUID('Brand ID').nullable().optional(),
    sortValue: validateNumber('Sort Value', { int: true }).nullable().optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
    isActive: validateBoolean('Is Active').optional().default(true),
  })
  .strict();

export const UpdateAttributeOptionSchema = z
  .object({
    label: validateString('Label', { max: 160 }).optional(),
    slug: validateString('Slug', { max: 180 }).optional(),
    brandId: validateUUID('Brand ID').nullable().optional(),
    sortValue: validateNumber('Sort Value', { int: true }).nullable().optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional(),
    isActive: validateBoolean('Is Active').optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const AssignCategoryAttributeSchema = z
  .object({
    attributeId: validateUUID('Attribute ID'),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
    isCollapsed: validateBoolean('Is Collapsed').optional().default(false),
    showProductCount: validateBoolean('Show Product Count')
      .optional()
      .default(true),
  })
  .strict();

export const UpdateCategoryAttributeSchema = z
  .object({
    sortOrder: validateNumber('Sort Order', { int: true }).optional(),
    isCollapsed: validateBoolean('Is Collapsed').optional(),
    showProductCount: validateBoolean('Show Product Count').optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const AttributeOptionResponseSchema = z.object({
  id: validateUUID('Option ID'),
  attributeId: validateUUID('Attribute ID'),
  brandId: validateUUID('Brand ID').nullable(),
  label: validateString('Label'),
  slug: validateString('Slug'),
  sortValue: validateNumber('Sort Value').nullable(),
  sortOrder: validateNumber('Sort Order'),
  isActive: validateBoolean('Is Active'),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const AttributeResponseSchema = z.object({
  id: validateUUID('Attribute ID'),
  code: validateString('Code'),
  name: validateString('Name'),
  inputType: validateEnum('Input Type', ATTRIBUTE_INPUT_TYPES),
  dataType: validateEnum('Data Type', ATTRIBUTE_DATA_TYPES),
  unit: validateString('Unit').nullable(),
  description: validateString('Description').nullable(),
  isFilterable: validateBoolean('Is Filterable'),
  isBrandAttribute: validateBoolean('Is Brand Attribute'),
  sortOrder: validateNumber('Sort Order'),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const AttributeWithOptionsResponseSchema =
  AttributeResponseSchema.extend({
    options: z.array(AttributeOptionResponseSchema),
  });

export const AttributeListResponseSchema = z.object({
  rows: z.array(AttributeResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const AttributeOptionListResponseSchema = z.object({
  rows: z.array(AttributeOptionResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
});

export const DeleteAttributeOptionResponseSchema = z.object({
  deleted: z.boolean(),
});

export const CategoryAttributeResponseSchema = z.object({
  categoryId: validateUUID('Category ID'),
  attributeId: validateUUID('Attribute ID'),
  sortOrder: validateNumber('Sort Order'),
  isCollapsed: validateBoolean('Is Collapsed'),
  showProductCount: validateBoolean('Show Product Count'),
});

export const CategoryFilterOptionSchema = z.object({
  id: validateUUID('Option ID'),
  label: validateString('Label'),
  slug: validateString('Slug'),
  brandId: validateUUID('Brand ID').nullable(),
  sortValue: validateNumber('Sort Value').nullable(),
  sortOrder: validateNumber('Sort Order'),
});

export const CategoryFilterGroupSchema = z.object({
  attributeId: validateUUID('Attribute ID'),
  code: validateString('Code'),
  name: validateString('Name'),
  inputType: validateEnum('Input Type', ATTRIBUTE_INPUT_TYPES),
  dataType: validateEnum('Data Type', ATTRIBUTE_DATA_TYPES),
  unit: validateString('Unit').nullable(),
  sortOrder: validateNumber('Sort Order'),
  isCollapsed: validateBoolean('Is Collapsed'),
  showProductCount: validateBoolean('Show Product Count'),
  options: z.array(CategoryFilterOptionSchema),
});

export const CategoryFiltersResponseSchema = z.object({
  categoryId: validateUUID('Category ID'),
  filters: z.array(CategoryFilterGroupSchema),
});

export const AttributeApiResponseSchema = createApiResponseSchema(
  AttributeResponseSchema,
);
export const AttributeWithOptionsApiResponseSchema = createApiResponseSchema(
  AttributeWithOptionsResponseSchema,
);
export const AttributeListApiResponseSchema = createApiResponseSchema(
  AttributeListResponseSchema,
);
export const AttributeOptionApiResponseSchema = createApiResponseSchema(
  AttributeOptionResponseSchema,
);
export const AttributeOptionListApiResponseSchema = createApiResponseSchema(
  AttributeOptionListResponseSchema,
);
export const DeleteAttributeOptionApiResponseSchema = createApiResponseSchema(
  DeleteAttributeOptionResponseSchema,
);
export const CategoryAttributeApiResponseSchema = createApiResponseSchema(
  CategoryAttributeResponseSchema,
);
export const CategoryFiltersApiResponseSchema = createApiResponseSchema(
  CategoryFiltersResponseSchema,
);

export type AttributesListQueryDto = z.infer<typeof AttributesListQuerySchema>;
export type CreateAttributeDto = z.infer<typeof CreateAttributeSchema>;
export type UpdateAttributeDto = z.infer<typeof UpdateAttributeSchema>;
export type CreateAttributeOptionDto = z.infer<
  typeof CreateAttributeOptionSchema
>;
export type UpdateAttributeOptionDto = z.infer<
  typeof UpdateAttributeOptionSchema
>;
export type AssignCategoryAttributeDto = z.infer<
  typeof AssignCategoryAttributeSchema
>;
export type UpdateCategoryAttributeDto = z.infer<
  typeof UpdateCategoryAttributeSchema
>;
export type AttributeResponse = z.infer<typeof AttributeResponseSchema>;
export type AttributeWithOptionsResponse = z.infer<
  typeof AttributeWithOptionsResponseSchema
>;
export type AttributeListResponse = z.infer<typeof AttributeListResponseSchema>;
export type AttributeOptionResponse = z.infer<
  typeof AttributeOptionResponseSchema
>;
export type AttributeOptionListResponse = z.infer<
  typeof AttributeOptionListResponseSchema
>;
export type DeleteAttributeOptionResponse = z.infer<
  typeof DeleteAttributeOptionResponseSchema
>;
export type CategoryAttributeResponse = z.infer<
  typeof CategoryAttributeResponseSchema
>;
export type CategoryFiltersResponse = z.infer<
  typeof CategoryFiltersResponseSchema
>;
export type AttributeApiResponse = z.infer<typeof AttributeApiResponseSchema>;
export type AttributeWithOptionsApiResponse = z.infer<
  typeof AttributeWithOptionsApiResponseSchema
>;
export type AttributeListApiResponse = z.infer<
  typeof AttributeListApiResponseSchema
>;
export type AttributeOptionApiResponse = z.infer<
  typeof AttributeOptionApiResponseSchema
>;
export type AttributeOptionListApiResponse = z.infer<
  typeof AttributeOptionListApiResponseSchema
>;
export type DeleteAttributeOptionApiResponse = z.infer<
  typeof DeleteAttributeOptionApiResponseSchema
>;
export type CategoryAttributeApiResponse = z.infer<
  typeof CategoryAttributeApiResponseSchema
>;
export type CategoryFiltersApiResponse = z.infer<
  typeof CategoryFiltersApiResponseSchema
>;
