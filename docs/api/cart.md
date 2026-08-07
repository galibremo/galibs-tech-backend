# Cart

Base path: `/cart`  
**Auth:** Guest/Session on all routes (`X-Guest-Token` or session cookie)  
Shared conventions: [README.md](./README.md)

## CartResponse

```ts
{
  id: UUID;
  items: Array<{
    id: UUID;
    productId: UUID;
    variantId: UUID | null;
    name: string;
    sku: string;
    quantity: number; // ≥ 1
    unitPrice: number;
    lineTotal: number;
    thumbnailUrl: string | null;
  }>;
  itemCount: number;
  subtotal: number;
}
```

---

## `GET /cart`

**Auth:** Guest/Session · **Status:** 200

### Headers

`X-Guest-Token` required when not logged in.

### Response `data`

`CartResponse`

---

## `POST /cart/items`

**Auth:** Guest/Session · **Status:** 201

### Body

| Field | Required | Constraints / default |
|-------|----------|------------------------|
| `productId` | yes | UUID |
| `variantId` | no | UUID \| null |
| `quantity` | no | int ≥ 1, default `1` |

### Response `data`

`CartResponse`

### Example

```json
{
  "productId": "550e8400-e29b-41d4-a716-446655440050",
  "variantId": "550e8400-e29b-41d4-a716-446655440051",
  "quantity": 2
}
```

---

## `PATCH /cart/items/:id`

**Auth:** Guest/Session · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID (cart item) |

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `quantity` | yes | int ≥ 1 |

### Response `data`

`CartResponse`

### Example

```json
{
  "quantity": 3
}
```

---

## `DELETE /cart/items/:id`

**Auth:** Guest/Session · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID (cart item) |

### Response `data`

`CartResponse`

---

## `DELETE /cart`

**Auth:** Guest/Session · **Status:** 200

Clears the cart.

### Response `data`

`CartResponse` (empty items)
