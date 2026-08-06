import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateEmail,
  validateEnum,
  validateNumber,
  validatePhoneNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

export const ShippingAddressSchema = z.object({
  fullName: validateString('Full Name', { max: 160 }),
  phone: validatePhoneNumber('Phone'),
  email: validateEmail,
  addressLine1: validateString('Address Line 1', { max: 255 }),
  addressLine2: validateString('Address Line 2', { max: 255 })
    .nullable()
    .optional(),
  city: validateString('City', { max: 120 }),
  district: validateString('District', { max: 120 }),
  postalCode: validateString('Postal Code', { max: 32 }).nullable().optional(),
});

export const CheckoutSchema = z.object({
  shippingAddress: ShippingAddressSchema,
  notes: validateString('Notes', { max: 1000 }).nullable().optional(),
});

export const UpdatePaymentStatusSchema = z.object({
  paymentStatus: validateEnum('Payment Status', ['PAID', 'CANCELLED']),
});

export const OrderItemResponseSchema = z.object({
  id: validateUUID('Order Item ID'),
  productId: validateUUID('Product ID'),
  variantId: validateUUID('Variant ID').nullable(),
  name: validateString('Name'),
  sku: validateString('SKU'),
  quantity: validateNumber('Quantity', { min: 1, int: true }),
  unitPrice: validateNumber('Unit Price', { int: true }),
  lineTotal: validateNumber('Line Total', { int: true }),
});

export const PaymentResponseSchema = z.object({
  id: validateUUID('Payment ID'),
  method: z.literal('COD'),
  status: validateEnum('Payment Status', ['PENDING', 'PAID', 'CANCELLED']),
  amount: validateNumber('Amount', { int: true }),
});

export const OrderResponseSchema = z.object({
  id: validateUUID('Order ID'),
  orderNumber: validateString('Order Number'),
  status: validateEnum('Order Status', [
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED',
  ]),
  paymentMethod: z.literal('COD'),
  paymentStatus: validateEnum('Payment Status', [
    'PENDING',
    'PAID',
    'CANCELLED',
  ]),
  subtotal: validateNumber('Subtotal', { int: true }),
  shippingFee: validateNumber('Shipping Fee', { int: true }),
  total: validateNumber('Total', { int: true }),
  shippingAddress: ShippingAddressSchema,
  notes: validateString('Notes').nullable(),
  items: z.array(OrderItemResponseSchema),
  payment: PaymentResponseSchema.nullable(),
  createdAt: z.string(),
});

export const OrderListResponseSchema = z.object({
  rows: z.array(OrderResponseSchema),
  total: validateNumber('Total', { min: 0, int: true }),
});

export const InvoiceResponseSchema = z.object({
  invoiceNumber: validateString('Invoice Number'),
  issuedAt: z.string(),
  order: OrderResponseSchema,
});

export const OrderApiResponseSchema =
  createApiResponseSchema(OrderResponseSchema);
export const OrderListApiResponseSchema = createApiResponseSchema(
  OrderListResponseSchema,
);
export const InvoiceApiResponseSchema = createApiResponseSchema(
  InvoiceResponseSchema,
);

export type CheckoutDto = z.infer<typeof CheckoutSchema>;
export type UpdatePaymentStatusDto = z.infer<typeof UpdatePaymentStatusSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;
export type OrderApiResponse = z.infer<typeof OrderApiResponseSchema>;
export type OrderListApiResponse = z.infer<typeof OrderListApiResponseSchema>;
export type InvoiceApiResponse = z.infer<typeof InvoiceApiResponseSchema>;
