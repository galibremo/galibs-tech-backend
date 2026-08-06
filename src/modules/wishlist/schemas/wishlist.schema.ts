import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

export const AddWishlistItemSchema = z.object({
  productId: validateUUID('Product ID'),
  variantId: validateUUID('Variant ID').nullable().optional(),
});

export const WishlistItemResponseSchema = z.object({
  id: validateUUID('Wishlist Item ID'),
  productId: validateUUID('Product ID'),
  variantId: validateUUID('Variant ID').nullable(),
  name: validateString('Name'),
  sku: validateString('SKU'),
  price: validateNumber('Price', { int: true }),
  thumbnailUrl: validateString('Thumbnail URL').nullable(),
});

export const WishlistResponseSchema = z.object({
  id: validateUUID('Wishlist ID'),
  items: z.array(WishlistItemResponseSchema),
  itemCount: validateNumber('Item Count', { min: 0, int: true }),
});

export const WishlistApiResponseSchema = createApiResponseSchema(
  WishlistResponseSchema,
);

export type AddWishlistItemDto = z.infer<typeof AddWishlistItemSchema>;
export type WishlistResponse = z.infer<typeof WishlistResponseSchema>;
export type WishlistApiResponse = z.infer<typeof WishlistApiResponseSchema>;
