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

[Common list params](./README.md#common-list-query-params); `sort`: `sortOrder` \| `name` \| `createdAt` \| `updatedAt`

| Param | Required | Constraints / default |
|-------|----------|------------------------|
| `isActive` | no | `true` \| `false`. Omitted or `true`: active categories only. `false`: only soft-deleted ones (admin "trash" view). |

Without `sort`, rows come back in `sortOrder` then `name`, matching the storefront menu.

---

## `GET /categories`

**Auth:** Public · **Status:** 200

### Response `data`

```ts
{ rows: Category[]; total: number; page: number; limit: number }
```

---

## `GET /categories/tree`

**Auth:** Public · **Status:** 200

The storefront menu tree: only categories with `isActive: true` **and** `showInMenu: true`, ordered by `sortOrder` then `name` at every level. A category whose parent is hidden is dropped along with its subtree, never promoted to the root. Use `GET /categories` (with `isActive=false` for the trash) to see everything.

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
| `slug` | yes | max 255; no whitespace or `/` (it becomes a `path` segment) |
| `parentId` | no | UUID \| null; must reference an existing category (404 `parent_category_not_found` otherwise) |
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

`path` and `depth` are **not accepted** in the body (the schema is strict, so sending them is a validation error). The server derives them from `parentId` + `slug`:

- root: `path = slug`, `depth = 0`
- child: `path = parent.path + "/" + slug`, `depth = parent.depth + 1`

### Response `data`

`Category`

### Errors

| Status | `code` | When |
|--------|--------|------|
| 404 | `parent_category_not_found` | `parentId` does not exist |
| 409 | `slug_already_exists` | `slug` is taken |
| 409 | `path_already_exists` | the computed `path` collides with an existing category |

### Example

```json
{
  "name": "Gaming PC",
  "slug": "gaming-pc",
  "parentId": "550e8400-e29b-41d4-a716-446655440001",
  "isActive": true,
  "showInMenu": true
}
```

Creates the category with `path: "desktops/gaming-pc"` and `depth: 1` when the parent is `desktops`.

---

## `PATCH /categories/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

All create fields optional; **at least one** required. `path` and `depth` are not accepted.

Changing `slug` or `parentId` recomputes the category's own `path`/`depth` and, in the same transaction, rewrites the `path`/`depth` of **every descendant** (`old-path/x/y` becomes `new-path/x/y`). Set `parentId: null` to move a category to the root.

### Response `data`

`Category`

### Errors

| Status | `code` | When |
|--------|--------|------|
| 400 | `invalid_parent` | `parentId` is the category itself or one of its descendants |
| 404 | `category_not_found` | `:id` does not exist |
| 404 | `parent_category_not_found` | `parentId` does not exist |
| 409 | `slug_already_exists` | new `slug` is taken |
| 409 | `path_already_exists` | the recomputed `path` collides with an existing category |

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

Both endpoints operate on the **category subtree**: the category itself plus every active descendant, matched on the materialised `path` (`desktops/gaming-pc/intel-gaming-pc`). So `/categories/desktops/products` lists products linked to Gaming PC, Brand PC, All-in-One PC, Intel Gaming PC, etc., even though products are normally linked only to their leaf category. Filter groups are the union of the attributes assigned to the category and to its descendants (de-duplicated; the category's own assignments keep their sort order and come first). Facet counts, price and availability filters all run over the same subtree.

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

Use the static `id/` segment so this UUID route coexists with `/:slug/filters`.

### `GET /categories/id/:categoryId/filters`

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
