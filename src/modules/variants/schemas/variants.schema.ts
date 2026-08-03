import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateArray,
  validateBoolean,
  validateDate,
  validateEnum,
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';
import { STOCK_STATUSES } from '../../products/schemas/products.schema';

export const CreateOptionGroupSchema = z
  .object({
    name: validateString('Name', { max: 120 }),
    code: validateString('Code', { max: 80 }),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
  })
  .strict();

export const CreateOptionValueSchema = z
  .object({
    label: validateString('Label', { max: 160 }),
    slug: validateString('Slug', { max: 180 }),
    swatchValue: validateString('Swatch Value', { max: 64 })
      .nullable()
      .optional(),
    attributeOptionId: validateUUID('Attribute Option ID').nullable().optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
  })
  .strict();

export const UpdateOptionValueSchema = z
  .object({
    label: validateString('Label', { max: 160 }).optional(),
    slug: validateString('Slug', { max: 180 }).optional(),
    swatchValue: validateString('Swatch Value', { max: 64 })
      .nullable()
      .optional(),
    attributeOptionId: validateUUID('Attribute Option ID').nullable().optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const CreateVariantSchema = z
  .object({
    sku: validateString('SKU', { max: 120 }),
    price: validateNumber('Price', { min: 0, int: true }),
    regularPrice: validateNumber('Regular Price', { min: 0, int: true })
      .nullable()
      .optional(),
    stockQty: validateNumber('Stock Qty', { min: 0, int: true }),
    availability: validateEnum('Availability', STOCK_STATUSES)
      .optional()
      .default('IN_STOCK'),
    isDefault: validateBoolean('Is Default').optional().default(false),
    optionValueIds: validateArray(
      'Option Value IDs',
      validateUUID('Option Value ID'),
      { min: 1 },
    ),
    thumbnailUrl: validateString('Thumbnail URL').nullable().optional(),
    attributeOptionIds: validateArray(
      'Attribute Option IDs',
      validateUUID('Attribute Option ID'),
    )
      .optional()
      .default([]),
  })
  .strict();

export const UpdateVariantSchema = z
  .object({
    sku: validateString('SKU', { max: 120 }).optional(),
    price: validateNumber('Price', { min: 0, int: true }).optional(),
    regularPrice: validateNumber('Regular Price', { min: 0, int: true })
      .nullable()
      .optional(),
    stockQty: validateNumber('Stock Qty', { min: 0, int: true }).optional(),
    availability: validateEnum('Availability', STOCK_STATUSES).optional(),
    isDefault: validateBoolean('Is Default').optional(),
    thumbnailUrl: validateString('Thumbnail URL').nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const OptionValueResponseSchema = z.object({
  id: validateUUID('Option Value ID'),
  groupId: validateUUID('Group ID'),
  label: validateString('Label'),
  slug: validateString('Slug'),
  swatchValue: validateString('Swatch Value').nullable(),
  attributeOptionId: validateUUID('Attribute Option ID').nullable(),
  sortOrder: validateNumber('Sort Order'),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const OptionGroupResponseSchema = z.object({
  id: validateUUID('Option Group ID'),
  productId: validateUUID('Product ID'),
  name: validateString('Name'),
  code: validateString('Code'),
  sortOrder: validateNumber('Sort Order'),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
  values: z.array(OptionValueResponseSchema).optional(),
});

export const VariantResponseSchema = z.object({
  id: validateUUID('Variant ID'),
  productId: validateUUID('Product ID'),
  sku: validateString('SKU'),
  title: validateString('Title'),
  fingerprint: validateString('Fingerprint'),
  price: validateNumber('Price'),
  regularPrice: validateNumber('Regular Price').nullable(),
  stockQty: validateNumber('Stock Qty'),
  availability: validateEnum('Availability', STOCK_STATUSES),
  isDefault: validateBoolean('Is Default'),
  thumbnailUrl: validateString('Thumbnail URL').nullable(),
  deletedAt: validateDate('Deleted At').nullable(),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
  optionValueIds: z.array(validateUUID('Option Value ID')).optional(),
});

export const SyncCacheResponseSchema = z.object({
  synced: z.boolean(),
});

export const DeleteVariantResponseSchema = z.object({
  deleted: z.boolean(),
});

export const OptionGroupApiResponseSchema = createApiResponseSchema(
  OptionGroupResponseSchema,
);
export const OptionGroupListApiResponseSchema = createApiResponseSchema(
  z.array(OptionGroupResponseSchema),
);
export const OptionValueApiResponseSchema = createApiResponseSchema(
  OptionValueResponseSchema,
);
export const VariantApiResponseSchema =
  createApiResponseSchema(VariantResponseSchema);
export const VariantListApiResponseSchema = createApiResponseSchema(
  z.array(VariantResponseSchema),
);
export const SyncCacheApiResponseSchema = createApiResponseSchema(
  SyncCacheResponseSchema,
);
export const DeleteVariantApiResponseSchema = createApiResponseSchema(
  DeleteVariantResponseSchema,
);
export const DeleteOptionGroupApiResponseSchema = createApiResponseSchema(
  DeleteVariantResponseSchema,
);

export type CreateOptionGroupDto = z.infer<typeof CreateOptionGroupSchema>;
export type CreateOptionValueDto = z.infer<typeof CreateOptionValueSchema>;
export type UpdateOptionValueDto = z.infer<typeof UpdateOptionValueSchema>;
export type CreateVariantDto = z.infer<typeof CreateVariantSchema>;
export type UpdateVariantDto = z.infer<typeof UpdateVariantSchema>;
export type OptionGroupResponse = z.infer<typeof OptionGroupResponseSchema>;
export type OptionValueResponse = z.infer<typeof OptionValueResponseSchema>;
export type VariantResponse = z.infer<typeof VariantResponseSchema>;
export type SyncCacheResponse = z.infer<typeof SyncCacheResponseSchema>;
export type DeleteVariantResponse = z.infer<typeof DeleteVariantResponseSchema>;
export type OptionGroupApiResponse = z.infer<
  typeof OptionGroupApiResponseSchema
>;
export type OptionGroupListApiResponse = z.infer<
  typeof OptionGroupListApiResponseSchema
>;
export type OptionValueApiResponse = z.infer<
  typeof OptionValueApiResponseSchema
>;
export type VariantApiResponse = z.infer<typeof VariantApiResponseSchema>;
export type VariantListApiResponse = z.infer<
  typeof VariantListApiResponseSchema
>;
export type SyncCacheApiResponse = z.infer<typeof SyncCacheApiResponseSchema>;
export type DeleteVariantApiResponse = z.infer<
  typeof DeleteVariantApiResponseSchema
>;
export type DeleteOptionGroupApiResponse = z.infer<
  typeof DeleteOptionGroupApiResponseSchema
>;
