# Specifications

Shared conventions: [README.md](./README.md)

Spec create endpoints do not use Zod response schemas; shapes below match service/DB rows.

---

## `POST /spec-groups`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `name` | yes | max 120 |
| `sortOrder` | no | default `0` |

### Response `data`

```ts
{ id: UUID; name: string; sortOrder: number; createdAt: string; updatedAt: string }
```

### Example

```json
{
  "name": "Display",
  "sortOrder": 1
}
```

---

## `POST /spec-groups/:id/fields`

**Auth:** Admin · **Status:** 201

### Path

| Param | Type |
|-------|------|
| `id` | UUID (spec group) |

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `name` | yes | max 120 |
| `sortOrder` | no | default `0` |

### Response `data`

```ts
{
  id: UUID;
  groupId: UUID;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### Example

```json
{
  "name": "Screen Size",
  "sortOrder": 0
}
```

---

## `PUT /products/:id/specifications`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID (product) |

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `specs` | yes | array of `{ fieldId: UUID; value: string }` |

### Response `data`

```ts
Array<{ group: string; items: Array<{ name: string; value: string }> }>
```

### Example

```json
{
  "specs": [
    {
      "fieldId": "550e8400-e29b-41d4-a716-446655440040",
      "value": "14 inch"
    },
    {
      "fieldId": "550e8400-e29b-41d4-a716-446655440041",
      "value": "2880x1800"
    }
  ]
}
```

```json
{
  "statusCode": 200,
  "message": "…",
  "data": [
    {
      "group": "Display",
      "items": [
        { "name": "Screen Size", "value": "14 inch" },
        { "name": "Resolution", "value": "2880x1800" }
      ]
    }
  ],
  "timestamp": "2026-08-07T06:00:00.000Z",
  "path": "/products/…/specifications"
}
```

---

## `GET /products/:id/specifications`

**Auth:** Public · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID (product) |

### Response `data`

Same grouped array as PUT.
