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
import { STOCK_STATUSES } from '../../products/schemas/products.schema';

export const OFFER_TYPES = [
  'FLASH_SALE',
  'HAPPY_HOUR',
  'CAMPAIGN',
  'SPECIAL_OFFER',
  'EMI',
  'BUNDLE',
] as const;

const OFFER_SORTABLE_FIELDS: readonly SortableField[] = [
  { name: 'name', queryName: 'name' },
  { name: 'sortOrder', queryName: 'sortOrder' },
  { name: 'createdAt', queryName: 'createdAt' },
  { name: 'updatedAt', queryName: 'updatedAt' },
] as const;

export const OffersListQuerySchema = baseQuerySchema(OFFER_SORTABLE_FIELDS);

export const CreateOfferSchema = z
  .object({
    name: validateString('Name', { max: 255 }),
    slug: validateString('Slug', { max: 255 }),
    type: validateEnum('Type', OFFER_TYPES),
    description: validateString('Description').nullable().optional(),
    bannerImageUrl: validateString('Banner Image URL').nullable().optional(),
    isActive: validateBoolean('Is Active').optional().default(true),
    startsAt: validateDate('Starts At').nullable().optional(),
    endsAt: validateDate('Ends At').nullable().optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
  })
  .strict();

export const UpdateOfferSchema = CreateOfferSchema.partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const AttachOfferProductSchema = z
  .object({
    productId: validateUUID('Product ID'),
    variantId: validateUUID('Variant ID').nullable().optional(),
    offerPrice: validateNumber('Offer Price', { min: 0, int: true })
      .nullable()
      .optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
  })
  .strict();

export const DetachOfferProductSchema = z
  .object({
    productId: validateUUID('Product ID'),
    variantId: validateUUID('Variant ID').nullable().optional(),
  })
  .strict();

export const OfferProductResponseSchema = z.object({
  id: validateUUID('Offer Product ID'),
  productId: validateUUID('Product ID'),
  variantId: validateUUID('Variant ID').nullable(),
  offerPrice: validateNumber('Offer Price').nullable(),
  sortOrder: validateNumber('Sort Order'),
  name: validateString('Name'),
  slug: validateString('Slug'),
  thumbnailUrl: validateString('Thumbnail URL').nullable(),
  price: validateNumber('Price'),
  regularPrice: validateNumber('Regular Price').nullable(),
  saveAmount: validateNumber('Save Amount').nullable(),
  savePercent: validateNumber('Save Percent').nullable(),
  earnPoints: validateNumber('Earn Points'),
  availability: validateEnum('Availability', STOCK_STATUSES),
});

export const OfferResponseSchema = z.object({
  id: validateUUID('Offer ID'),
  name: validateString('Name'),
  slug: validateString('Slug'),
  type: validateEnum('Type', OFFER_TYPES),
  description: validateString('Description').nullable(),
  bannerImageUrl: validateString('Banner Image URL').nullable(),
  isActive: validateBoolean('Is Active'),
  startsAt: validateDate('Starts At').nullable(),
  endsAt: validateDate('Ends At').nullable(),
  sortOrder: validateNumber('Sort Order'),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
  products: z.array(OfferProductResponseSchema).optional(),
});

export const OffersListResponseSchema = z.object({
  rows: z.array(OfferResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  pageSize: validateNumber('Page Size', { min: 1, int: true }),
});

export const DeleteOfferResponseSchema = z.object({
  deleted: z.boolean(),
});

export const OfferApiResponseSchema = createApiResponseSchema(OfferResponseSchema);
export const OffersListApiResponseSchema =
  createApiResponseSchema(OffersListResponseSchema);
export const OffersActiveListApiResponseSchema = createApiResponseSchema(
  z.array(OfferResponseSchema),
);
export const DeleteOfferApiResponseSchema = createApiResponseSchema(
  DeleteOfferResponseSchema,
);
export const OfferProductApiResponseSchema = createApiResponseSchema(
  OfferProductResponseSchema,
);
export const DeleteOfferProductApiResponseSchema = createApiResponseSchema(
  z.object({ deleted: z.boolean() }),
);

export type OffersListQueryDto = z.infer<typeof OffersListQuerySchema>;
export type CreateOfferDto = z.infer<typeof CreateOfferSchema>;
export type UpdateOfferDto = z.infer<typeof UpdateOfferSchema>;
export type AttachOfferProductDto = z.infer<typeof AttachOfferProductSchema>;
export type DetachOfferProductDto = z.infer<typeof DetachOfferProductSchema>;
export type OfferProductResponse = z.infer<typeof OfferProductResponseSchema>;
export type OfferResponse = z.infer<typeof OfferResponseSchema>;
export type OffersListResponse = z.infer<typeof OffersListResponseSchema>;
export type OfferApiResponse = z.infer<typeof OfferApiResponseSchema>;
export type OffersListApiResponse = z.infer<typeof OffersListApiResponseSchema>;
export type OffersActiveListApiResponse = z.infer<
  typeof OffersActiveListApiResponseSchema
>;
export type DeleteOfferApiResponse = z.infer<typeof DeleteOfferApiResponseSchema>;
export type OfferProductApiResponse = z.infer<
  typeof OfferProductApiResponseSchema
>;
export type DeleteOfferProductApiResponse = z.infer<
  typeof DeleteOfferProductApiResponseSchema
>;
