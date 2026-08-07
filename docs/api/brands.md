# Brands

Base path: `/brands`  
Shared conventions: [README.md](./README.md)

## Brand shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `name` | string |
| `slug` | string |
| `logoUrl` | string \| null |
| `description` | string \| null |
| `isActive` | boolean |
| `isFeatured` | boolean |
| `sortOrder` | number |
| `metaTitle` | string \| null |
| `metaDescription` | string \| null |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

## List query

[Common list params](./README.md#common-list-query-params); `sort`: `name` \| `createdAt` \| `updatedAt`

---

## `GET /brands`

**Auth:** Public · **Status:** 200

### Response `data`

```ts
{ rows: Brand[]; total: number; page: number; pageSize: number }
```

---

## `GET /brands/:id`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

`Brand`

---

## `GET /brands/slug/:slug`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `slug` | string |

### Response `data`

`Brand`

---

## `POST /brands`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `name` | yes | max 255 |
| `slug` | yes | max 255 |
| `logoUrl` | no | string \| null |
| `description` | no | string \| null |
| `isActive` | no | default `true` |
| `isFeatured` | no | default `false` |
| `sortOrder` | no | default `0` |
| `metaTitle` | no | max 255, nullable |
| `metaDescription` | no | nullable |

### Response `data`

`Brand`

### Example

```json
{
  "name": "Apple",
  "slug": "apple",
  "logoUrl": "https://cdn.example.com/brands/apple.png",
  "description": "Consumer electronics",
  "isActive": true,
  "isFeatured": true,
  "sortOrder": 1
}
```

---

## `PATCH /brands/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

Same fields as create, all optional; **at least one** required.

### Response `data`

`Brand`

---

## `DELETE /brands/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```json
{ "deleted": true }
```
