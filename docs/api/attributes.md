# Attributes

Base paths: `/attributes`, `/attribute-options`  
Shared conventions: [README.md](./README.md)

## Enums

- `inputType`: `MULTI_SELECT` \| `SINGLE_SELECT` \| `BOOLEAN` \| `RANGE`
- `dataType`: `STRING` \| `NUMBER` \| `BOOLEAN`

## Attribute shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `code` | string |
| `name` | string |
| `inputType` | enum |
| `dataType` | enum |
| `unit` | string \| null |
| `description` | string \| null |
| `isFilterable` | boolean |
| `isBrandAttribute` | boolean |
| `sortOrder` | number |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

## AttributeOption shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `attributeId` | UUID |
| `brandId` | UUID \| null |
| `label` | string |
| `slug` | string |
| `sortValue` | number \| null |
| `sortOrder` | number |
| `isActive` | boolean |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

## List query

[Common list params](./README.md#common-list-query-params); `sort`: `name` \| `code` \| `sortOrder` \| `createdAt` \| `updatedAt`

---

## `GET /attributes`

**Auth:** Public · **Status:** 200

### Response `data`

```ts
{ rows: Attribute[]; total: number; page: number; pageSize: number }
```

---

## `GET /attributes/code/:code`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `code` | string |

### Response `data`

`Attribute` + `options: AttributeOption[]`

---

## `GET /attributes/:id`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

`Attribute` + `options: AttributeOption[]`

---

## `POST /attributes`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `code` | yes | max 80 |
| `name` | yes | max 120 |
| `inputType` | no | default `MULTI_SELECT` |
| `dataType` | no | default `STRING` |
| `unit` | no | max 32, nullable |
| `description` | no | nullable |
| `isFilterable` | no | default `true` |
| `isBrandAttribute` | no | default `false` |
| `sortOrder` | no | int, default `0` |

### Response `data`

`Attribute`

### Example

```json
{
  "code": "ram",
  "name": "RAM",
  "inputType": "MULTI_SELECT",
  "dataType": "STRING",
  "unit": "GB",
  "isFilterable": true,
  "sortOrder": 1
}
```

---

## `PATCH /attributes/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

All create fields optional; **at least one** required.

### Response `data`

`Attribute`

---

## `GET /attributes/:attributeId/options`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `attributeId` | UUID |

### Response `data`

```ts
{ rows: AttributeOption[]; total: number }
```

---

## `POST /attributes/:attributeId/options`

**Auth:** Admin · **Status:** 201

### Path

| Param | Type |
|-------|------|
| `attributeId` | UUID |

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `label` | yes | max 160 |
| `slug` | no | max 180 |
| `brandId` | no | UUID \| null |
| `sortValue` | no | int \| null |
| `sortOrder` | no | int, default `0` |
| `isActive` | no | default `true` |

### Response `data`

`AttributeOption`

### Example

```json
{
  "label": "16 GB",
  "slug": "16-gb",
  "sortOrder": 2,
  "isActive": true
}
```

---

## `PATCH /attribute-options/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

At least one of: `label`, `slug`, `brandId`, `sortValue`, `sortOrder`, `isActive`

### Response `data`

`AttributeOption`

---

## `DELETE /attribute-options/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```json
{ "deleted": true }
```
