# Variants & option groups

Shared conventions: [README.md](./README.md)

Availability enum: `IN_STOCK` \| `OUT_OF_STOCK` \| `LOW_STOCK` \| `PRE_ORDER` \| `UPCOMING`

## Variant shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `productId` | UUID |
| `sku` | string |
| `title` | string |
| `fingerprint` | string |
| `price` | int ≥ 0 |
| `regularPrice` | int \| null |
| `stockQty` | int |
| `availability` | enum |
| `isDefault` | boolean |
| `thumbnailUrl` | string \| null |
| `deletedAt` | ISO date-time \| null |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |
| `optionValueIds` | UUID[] (optional) |

## OptionGroup shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `productId` | UUID |
| `name` | string |
| `code` | string |
| `sortOrder` | number |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |
| `values` | OptionValue[] (optional) |

## OptionValue shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `groupId` | UUID |
| `label` | string |
| `slug` | string |
| `swatchValue` | string \| null |
| `attributeOptionId` | UUID \| null |
| `sortOrder` | number |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

---

## Variants

### `POST /products/:productId/variants`

**Auth:** Admin · **Status:** 201

### Path

| Param | Type |
|-------|------|
| `productId` | UUID |

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `sku` | yes | max 120 |
| `price` | yes | int ≥ 0 |
| `regularPrice` | no | int ≥ 0, nullable |
| `stockQty` | yes | int ≥ 0 |
| `availability` | no | default `IN_STOCK` |
| `isDefault` | no | default `false` |
| `optionValueIds` | yes | UUID[], min 1 |
| `thumbnailUrl` | no | nullable |
| `attributeOptionIds` | no | UUID[], default `[]` |

### Response `data`

`Variant`

### Example

```json
{
  "sku": "LAP-001-16-512",
  "price": 125000,
  "regularPrice": 139000,
  "stockQty": 5,
  "availability": "IN_STOCK",
  "isDefault": true,
  "optionValueIds": [
    "550e8400-e29b-41d4-a716-446655440030",
    "550e8400-e29b-41d4-a716-446655440031"
  ]
}
```

---

### `GET /products/:productId/variants`

**Auth:** Public · **Status:** 200

### Response `data`

`Variant[]`

---

### `POST /products/:productId/variants/sync-cache`

**Auth:** Admin · **Status:** 200

No body.

### Response `data`

```json
{ "synced": true }
```

---

### `GET /variants/:id`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

`Variant`

---

### `PATCH /variants/:id`

**Auth:** Admin · **Status:** 200

### Body

At least one of: `sku`, `price`, `regularPrice`, `stockQty`, `availability`, `isDefault`, `thumbnailUrl`

### Response `data`

`Variant`

---

### `DELETE /variants/:id`

**Auth:** Admin · **Status:** 200

### Response `data`

```json
{ "deleted": true }
```

---

## Option groups

### `POST /products/:productId/option-groups`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `name` | yes | max 120 |
| `code` | yes | max 80 |
| `sortOrder` | no | default `0` |

### Response `data`

`OptionGroup`

### Example

```json
{
  "name": "Storage",
  "code": "storage",
  "sortOrder": 1
}
```

---

### `GET /products/:productId/option-groups`

**Auth:** Public · **Status:** 200

### Response `data`

`OptionGroup[]` (may include nested `values`)

---

### `POST /option-groups/:groupId/values`

**Auth:** Admin · **Status:** 201

### Path

| Param | Type |
|-------|------|
| `groupId` | UUID |

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `label` | yes | max 160 |
| `slug` | yes | max 180 |
| `swatchValue` | no | max 64, nullable |
| `attributeOptionId` | no | UUID, nullable |
| `sortOrder` | no | default `0` |

### Response `data`

`OptionValue`

### Example

```json
{
  "label": "512 GB SSD",
  "slug": "512-gb-ssd",
  "sortOrder": 1
}
```

---

### `PATCH /option-values/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

All create-value fields optional; **at least one** required.

### Response `data`

`OptionValue`

---

### `DELETE /option-groups/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```json
{ "deleted": true }
```
