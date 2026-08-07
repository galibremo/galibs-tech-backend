# Categories & catalog

Base path: `/categories`  
Shared conventions: [README.md](./README.md)

Covers category CRUD, category tree, catalog listing/filters, and category–attribute links.

## Category shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `name` | string |
| `slug` | string |
| `parentId` | UUID \| null |
| `path` | string |
| `depth` | number |
| `description` | string \| null |
| `shortDescription` | string \| null |
| `imageUrl` | string \| null |
| `isActive` | boolean |
| `isFeatured` | boolean |
| `showInMenu` | boolean |
| `sortOrder` | number |
| `minPrice` | number \| null |
| `maxPrice` | number \| null |
| `productCount` | number |
| `metaTitle` | string \| null |
| `metaDescription` | string \| null |
| `seoContent` | string \| null |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

**Tree item:** `Category` + `children: CategoryTreeItem[]`

## List query (CRUD list)

[Common list params](./README.md#common-list-query-params); `sort`: `name` \| `createdAt` \| `updatedAt`

---

## `GET /categories`

**Auth:** Public · **Status:** 200

### Response `data`

```ts
{ rows: Category[]; total: number; page: number; pageSize: number }
```

---

## `GET /categories/tree`

**Auth:** Public · **Status:** 200

### Response `data`

`CategoryTreeItem[]`

---

## `GET /categories/:id`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

`Category`

---

## `GET /categories/slug/:slug`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `slug` | string |

### Response `data`

`Category`

---

## `POST /categories`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `name` | yes | max 255 |
| `slug` | yes | max 255 |
| `parentId` | no | UUID \| null |
| `path` | yes | max 512 |
| `depth` | no | default `0` |
| `description` | no | nullable |
| `shortDescription` | no | nullable |
| `imageUrl` | no | nullable |
| `isActive` | no | default `true` |
| `isFeatured` | no | default `false` |
| `showInMenu` | no | default `true` |
| `sortOrder` | no | default `0` |
| `minPrice` | no | nullable |
| `maxPrice` | no | nullable |
| `productCount` | no | default `0` |
| `metaTitle` | no | max 255, nullable |
| `metaDescription` | no | nullable |
| `seoContent` | no | nullable |

### Response `data`

`Category`

### Example

```json
{
  "name": "Laptops",
  "slug": "laptops",
  "parentId": null,
  "path": "/laptops",
  "depth": 0,
  "isActive": true,
  "showInMenu": true
}
```

---

## `PATCH /categories/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

All create fields optional; **at least one** required.

### Response `data`

`Category`

---

## `DELETE /categories/:id`

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

## Catalog (by slug)

### `GET /categories/:slug/filters`

**Auth:** Public · **Status:** 200

`:slug` is the category **slug** (not UUID).

### Response `data`

```ts
{
  categoryId: UUID;
  categorySlug: string;
  facets: Array<{
    attributeCode: string;
    attributeName: string;
    options: Array<{ id: UUID; label: string; count: number }>;
  }>;
}
```

---

### `GET /categories/:slug/products`

**Auth:** Public · **Status:** 200

### Query

| Param | Required | Constraints / default |
|-------|----------|------------------------|
| `priceMin` | no | int ≥ 0 |
| `priceMax` | no | int ≥ 0 |
| `availability` | no | comma-separated; `IN_STOCK`, `OUT_OF_STOCK`, `LOW_STOCK`, `PRE_ORDER`, `UPCOMING` (also accepts `in_stock`, etc.); default `[]` |
| `sort` | no | `default` \| `price_asc` \| `price_desc`; default `default` |
| `page` | no | int ≥ 1; default `1` |
| `limit` | no | 1–100; default `20` |
| `filter` | no | UUID[] attribute option IDs (comma-separated or repeated); default `[]` |

### Response `data`

```ts
{
  items: Array<{
    id: UUID;
    name: string;
    slug: string;
    type: 'SIMPLE' | 'VARIABLE';
    price: number;
    regularPrice: number | null;
    availability: string;
    thumbnailUrl: string | null;
    keyFeatures: string[];
  }>;
  total: number;
  page: number;
  limit: number;
  facets: /* same as filters */;
}
```

### Example

```http
GET /categories/laptops/products?page=1&limit=20&sort=price_asc&filter=uuid1,uuid2&priceMin=50000
```

---

## Category attributes

`:categoryId` must be a **UUID** so these routes coexist with `/:slug/filters`.

### `GET /categories/:categoryId/filters`

**Auth:** Public · **Status:** 200

### Response `data`

```ts
{
  categoryId: UUID;
  filters: Array<{
    attributeId: UUID;
    code: string;
    name: string;
    inputType: string;
    dataType: string;
    unit: string | null;
    sortOrder: number;
    isCollapsed: boolean;
    showProductCount: boolean;
    options: Array<{
      id: UUID;
      label: string;
      slug: string;
      brandId: UUID | null;
      sortValue: number | null;
      sortOrder: number;
    }>;
  }>;
}
```

---

### `POST /categories/:categoryId/attributes`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Default |
|-------|----------|---------|
| `attributeId` | yes | UUID |
| `sortOrder` | no | `0` |
| `isCollapsed` | no | `false` |
| `showProductCount` | no | `true` |

### Response `data`

```ts
{ categoryId: UUID; attributeId: UUID; sortOrder: number; isCollapsed: boolean; showProductCount: boolean }
```

### Example

```json
{
  "attributeId": "550e8400-e29b-41d4-a716-446655440010",
  "sortOrder": 1,
  "isCollapsed": false,
  "showProductCount": true
}
```

---

### `PATCH /categories/:categoryId/attributes/:attributeId`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `categoryId` | UUID |
| `attributeId` | UUID |

### Body

At least one of: `sortOrder`, `isCollapsed`, `showProductCount`

### Response `data`

Same category-attribute shape as POST.
