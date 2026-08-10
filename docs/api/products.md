# Products

Base path: `/products`  
Shared conventions: [README.md](./README.md)

## Enums

- `type`: `SIMPLE` \| `VARIABLE`
- `availability`: `IN_STOCK` \| `OUT_OF_STOCK` \| `LOW_STOCK` \| `PRE_ORDER` \| `UPCOMING`

## Product shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `type` | enum |
| `productCode` | string |
| `sku` | string \| null |
| `name` | string |
| `slug` | string |
| `brandId` | UUID |
| `primaryCategoryId` | UUID |
| `keyFeatures` | string[] |
| `price` | int ≥ 0 |
| `regularPrice` | int \| null |
| `maxPrice` | int \| null |
| `availability` | enum |
| `stockQty` | int |
| `earnPoints` | int |
| `warrantyText` | string \| null |
| `warrantyMonths` | int \| null |
| `emiMonthlyAmount` | int \| null |
| `thumbnailUrl` | string \| null |
| `badges` | string[] |
| `shortDescription` | string \| null |
| `description` | string \| null |
| `searchDocument` | string \| null |
| `isActive` | boolean |
| `isFeatured` | boolean |
| `featuredSortOrder` | number |
| `deletedAt` | ISO date-time \| null |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

Optional nested (detail responses):

- `brand`: `{ id, name, slug }`
- `primaryCategory`: `{ id, name, slug }`
- `images[]`, `categories[]`, `optionGroups[]`, `variants[]`

## List query

[Common list params](./README.md#common-list-query-params); `sort`: `name` \| `price` \| `createdAt` \| `updatedAt`

| Param | Type | Notes |
|-------|------|-------|
| `featured` | `true` \| `false` | When `true`, returns featured homepage grid cards with `saveAmount` / `savePercent` |

---

## Featured product card shape (`featured=true`)

| Field | Type |
|-------|------|
| `id` | UUID |
| `name` | string |
| `slug` | string |
| `thumbnailUrl` | string \| null |
| `price` | int |
| `regularPrice` | int \| null |
| `saveAmount` | int \| null |
| `savePercent` | int \| null |
| `earnPoints` | int |
| `availability` | enum |
| `featuredSortOrder` | number |

---

## `GET /products`

**Auth:** Public · **Status:** 200

### Response `data`

```ts
{ rows: Product[]; total: number; page: number; pageSize: number }
```

---

## `GET /products/:slug`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `slug` | string (not UUID-validated) |

### Response `data`

`Product` (often with nested relations)

---

## `POST /products`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `type` | no | default `SIMPLE` |
| `productCode` | yes | max 64 |
| `sku` | no | max 120, nullable |
| `name` | yes | max 255 |
| `slug` | yes | max 255 |
| `brandId` | yes | UUID |
| `primaryCategoryId` | yes | UUID |
| `price` | yes | int ≥ 0 |
| `regularPrice` | no | int ≥ 0, nullable |
| `availability` | no | default `IN_STOCK` |
| `stockQty` | no | int ≥ 0, default `0` |
| `keyFeatures` | no | string[] each max 500; default `[]` |
| `shortDescription` | no | nullable |
| `description` | no | nullable |
| `thumbnailUrl` | no | nullable |
| `warrantyText` | no | max 255, nullable |
| `warrantyMonths` | no | int ≥ 0, nullable |
| `earnPoints` | no | int ≥ 0, default `0` |
| `emiMonthlyAmount` | no | int ≥ 0, nullable |
| `badges` | no | string[] each max 80; default `[]` |

### Response `data`

`Product`

### Example

```json
{
  "type": "SIMPLE",
  "productCode": "LAP-001",
  "sku": "LAP-001-16",
  "name": "Ultrabook 14",
  "slug": "ultrabook-14",
  "brandId": "550e8400-e29b-41d4-a716-446655440001",
  "primaryCategoryId": "550e8400-e29b-41d4-a716-446655440002",
  "price": 125000,
  "regularPrice": 139000,
  "availability": "IN_STOCK",
  "stockQty": 10,
  "keyFeatures": ["14-inch display", "16GB RAM"],
  "badges": ["Hot"]
}
```

---

## `PATCH /products/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

Create fields optional, plus:

| Field | Required | Constraints |
|-------|----------|-------------|
| `maxPrice` | no | int ≥ 0, nullable |
| `isActive` | no | boolean |

At least one field required.

### Response `data`

`Product`

---

## `DELETE /products/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```json
{ "deleted": true }
```

---

## Product attributes

### ProductAttributes response

```ts
{
  productId: UUID;
  groups: Array<{
    attributeId: UUID;
    code: string;
    name: string;
    options: Array<{ id: UUID; label: string; slug: string }>;
  }>;
}
```

### `GET /products/:id/attributes`

**Auth:** Public · **Status:** 200

### `PUT /products/:id/attributes`

**Auth:** Admin · **Status:** 200 — replaces all options

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `optionIds` | yes | UUID[], min 1 |

### `POST /products/:id/attributes`

**Auth:** Admin · **Status:** 201 — adds options

Same body as PUT.

### `DELETE /products/:id/attributes/:optionId`

**Auth:** Admin · **Status:** 200

### Response `data`

```json
{ "deleted": true }
```

### Example (PUT/POST)

```json
{
  "optionIds": [
    "550e8400-e29b-41d4-a716-446655440020",
    "550e8400-e29b-41d4-a716-446655440021"
  ]
}
```

---

## Product categories

### `POST /products/:id/categories`

**Auth:** Admin · **Status:** 200

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `categoryIds` | yes | UUID[], min 1 |

### Response `data`

`Product`

### Example

```json
{
  "categoryIds": [
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ]
}
```

---

## Product images

### `POST /products/:id/images`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `url` | yes | string |
| `altText` | no | max 255, nullable |
| `sortOrder` | no | int, default `0` |
| `isPrimary` | no | default `false` |
| `variantId` | no | UUID \| null |

### Response `data`

```ts
{
  id: UUID;
  productId: UUID;
  variantId: UUID | null;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Example

```json
{
  "url": "https://cdn.example.com/products/ultrabook-1.jpg",
  "altText": "Front view",
  "sortOrder": 0,
  "isPrimary": true
}
```
