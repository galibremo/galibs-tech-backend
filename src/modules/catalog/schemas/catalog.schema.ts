import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

const STOCK_STATUS_VALUES = [
  'IN_STOCK',
  'OUT_OF_STOCK',
  'LOW_STOCK',
  'PRE_ORDER',
  'UPCOMING',
] as const;

const AVAILABILITY_QUERY_MAP: Record<string, (typeof STOCK_STATUS_VALUES)[number]> =
  {
    in_stock: 'IN_STOCK',
    out_of_stock: 'OUT_OF_STOCK',
    low_stock: 'LOW_STOCK',
    pre_order: 'PRE_ORDER',
    upcoming: 'UPCOMING',
    IN_STOCK: 'IN_STOCK',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    LOW_STOCK: 'LOW_STOCK',
    PRE_ORDER: 'PRE_ORDER',
    UPCOMING: 'UPCOMING',
  };

const SORT_VALUES = ['default', 'price_asc', 'price_desc'] as const;

function toQueryString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function parseFilterParam(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        const asString = toQueryString(item);
        return asString ? asString.split(',') : [];
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const asString = toQueryString(value);
  if (!asString) {
    return [];
  }

  return asString
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAvailabilityParam(
  value: unknown,
): (typeof STOCK_STATUS_VALUES)[number][] {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  const parts = Array.isArray(value)
    ? value.flatMap((item) => {
        const asString = toQueryString(item);
        return asString ? asString.split(',') : [];
      })
    : (() => {
        const asString = toQueryString(value);
        return asString ? asString.split(',') : [];
      })();

  const mapped = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => AVAILABILITY_QUERY_MAP[part])
    .filter((part): part is (typeof STOCK_STATUS_VALUES)[number] => Boolean(part));

  return [...new Set(mapped)];
}

export const CatalogProductsQuerySchema = z.object({
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  availability: z.preprocess(
    (value) => parseAvailabilityParam(value),
    z.array(z.enum(STOCK_STATUS_VALUES)).optional().default([]),
  ),
  sort: z.enum(SORT_VALUES).optional().default('default'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  filter: z.preprocess(
    (value) => parseFilterParam(value),
    z.array(validateUUID('Filter')).optional().default([]),
  ),
});

export const CatalogFacetOptionSchema = z.object({
  id: validateUUID('Option ID'),
  label: validateString('Label'),
  count: validateNumber('Count', { min: 0, int: true }),
});

export const CatalogFacetGroupSchema = z.object({
  attributeCode: validateString('Attribute Code'),
  attributeName: validateString('Attribute Name'),
  options: z.array(CatalogFacetOptionSchema),
});

export const CatalogProductCardSchema = z.object({
  id: validateUUID('Product ID'),
  name: validateString('Name'),
  slug: validateString('Slug'),
  type: z.enum(['SIMPLE', 'VARIABLE']),
  price: validateNumber('Price', { int: true }),
  regularPrice: validateNumber('Regular Price', { int: true }).nullable(),
  availability: z.enum(STOCK_STATUS_VALUES),
  thumbnailUrl: validateString('Thumbnail URL').nullable(),
  keyFeatures: z.array(validateString('Key Feature')),
});

export const CatalogFiltersResponseSchema = z.object({
  categoryId: validateUUID('Category ID'),
  categorySlug: validateString('Category Slug'),
  facets: z.array(CatalogFacetGroupSchema),
});

export const CatalogProductsResponseSchema = z.object({
  items: z.array(CatalogProductCardSchema),
  total: validateNumber('Total', { min: 0, int: true }),
  page: validateNumber('Page', { min: 1, int: true }),
  limit: validateNumber('Limit', { min: 1, int: true }),
  facets: z.array(CatalogFacetGroupSchema),
});

export const CatalogFiltersApiResponseSchema = createApiResponseSchema(
  CatalogFiltersResponseSchema,
);
export const CatalogProductsApiResponseSchema = createApiResponseSchema(
  CatalogProductsResponseSchema,
);

export type CatalogProductsQueryDto = z.infer<typeof CatalogProductsQuerySchema>;
export type CatalogFiltersResponse = z.infer<typeof CatalogFiltersResponseSchema>;
export type CatalogProductsResponse = z.infer<
  typeof CatalogProductsResponseSchema
>;
export type CatalogFiltersApiResponse = z.infer<
  typeof CatalogFiltersApiResponseSchema
>;
export type CatalogProductsApiResponse = z.infer<
  typeof CatalogProductsApiResponseSchema
>;
export type CatalogFacetGroup = z.infer<typeof CatalogFacetGroupSchema>;
export type StockStatus = (typeof STOCK_STATUS_VALUES)[number];
export type CatalogSort = (typeof SORT_VALUES)[number];
