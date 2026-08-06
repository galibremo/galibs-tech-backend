import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

export const AddCartItemSchema = z.object({
  productId: validateUUID('Product ID'),
  variantId: validateUUID('Variant ID').nullable().optional(),
  quantity: validateNumber('Quantity', { min: 1, int: true }).default(1),
});

export const UpdateCartItemSchema = z.object({
  quantity: validateNumber('Quantity', { min: 1, int: true }),
});

export const CartItemResponseSchema = z.object({
  id: validateUUID('Cart Item ID'),
  productId: validateUUID('Product ID'),
  variantId: validateUUID('Variant ID').nullable(),
  name: validateString('Name'),
  sku: validateString('SKU'),
  quantity: validateNumber('Quantity', { min: 1, int: true }),
  unitPrice: validateNumber('Unit Price', { int: true }),
  lineTotal: validateNumber('Line Total', { int: true }),
  thumbnailUrl: validateString('Thumbnail URL').nullable(),
});

export const CartResponseSchema = z.object({
  id: validateUUID('Cart ID'),
  items: z.array(CartItemResponseSchema),
  itemCount: validateNumber('Item Count', { min: 0, int: true }),
  subtotal: validateNumber('Subtotal', { min: 0, int: true }),
});

export const CartApiResponseSchema =
  createApiResponseSchema(CartResponseSchema);

export type AddCartItemDto = z.infer<typeof AddCartItemSchema>;
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;
export type CartResponse = z.infer<typeof CartResponseSchema>;
export type CartApiResponse = z.infer<typeof CartApiResponseSchema>;
