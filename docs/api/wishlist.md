# Wishlist

Base path: `/wishlist`  
**Auth:** Guest/Session on all routes (`X-Guest-Token` or session cookie)  
Shared conventions: [README.md](./README.md)

## WishlistResponse

```ts
{
  id: UUID;
  items: Array<{
    id: UUID;
    productId: UUID;
    variantId: UUID | null;
    name: string;
    sku: string;
    price: number;
    thumbnailUrl: string | null;
  }>;
  itemCount: number;
}
```

---

## `GET /wishlist`

**Auth:** Guest/Session · **Status:** 200

### Headers

`X-Guest-Token` required when not logged in.

### Response `data`

`WishlistResponse`

---

## `POST /wishlist/items`

**Auth:** Guest/Session · **Status:** 201

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `productId` | yes | UUID |
| `variantId` | no | UUID \| null |

### Response `data`

`WishlistResponse`

### Example

```json
{
  "productId": "550e8400-e29b-41d4-a716-446655440050",
  "variantId": null
}
```

---

## `DELETE /wishlist/items/:id`

**Auth:** Guest/Session · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID (wishlist item) |

### Response `data`

`WishlistResponse`

---

## `POST /wishlist/items/:id/move-to-cart`

**Auth:** Guest/Session · **Status:** 200

Moves the wishlist item into the cart, then returns the updated wishlist.

### Path

| Param | Type |
|-------|------|
| `id` | UUID (wishlist item) |

### Response `data`

`WishlistResponse`
