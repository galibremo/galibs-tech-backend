# Checkout & orders

Shared conventions: [README.md](./README.md)

## Shipping address

| Field | Required | Constraints |
|-------|----------|-------------|
| `fullName` | yes | max 160 |
| `phone` | yes | valid phone (`libphonenumber-js`) |
| `email` | yes | email, max 255 |
| `addressLine1` | yes | max 255 |
| `addressLine2` | no | max 255, nullable |
| `city` | yes | max 120 |
| `district` | yes | max 120 |
| `postalCode` | no | max 32, nullable |

## OrderResponse

```ts
{
  id: UUID;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentMethod: 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: ShippingAddress;
  notes: string | null;
  items: Array<{
    id: UUID;
    productId: UUID;
    variantId: UUID | null;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  payment: {
    id: UUID;
    method: 'COD';
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    amount: number;
  } | null;
  createdAt: string;
}
```

---

## `POST /checkout`

**Auth:** Guest/Session · **Status:** 201

Creates an order from the current cart.

### Headers

`X-Guest-Token` required when not logged in.

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `shippingAddress` | yes | see above |
| `notes` | no | max 1000, nullable |

### Response `data`

`OrderResponse`

### Example

```json
{
  "shippingAddress": {
    "fullName": "Ada Lovelace",
    "phone": "+8801712345678",
    "email": "ada@example.com",
    "addressLine1": "12 Analytical Engine Rd",
    "addressLine2": null,
    "city": "Dhaka",
    "district": "Dhaka",
    "postalCode": "1205"
  },
  "notes": "Please call before delivery"
}
```

---

## `GET /orders`

**Auth:** User required (session only — guests rejected) · **Status:** 200

### Response `data`

```ts
{ rows: OrderResponse[]; total: number }
```

---

## `GET /orders/:id`

**Auth:** Guest/Session + ownership · **Status:** 200

Owner must match logged-in user, or guest token must match the order.

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

`OrderResponse`

---

## `GET /orders/:id/invoice`

**Auth:** Guest/Session + ownership · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```ts
{
  invoiceNumber: string;
  issuedAt: string;
  order: OrderResponse;
}
```

### Example

```json
{
  "statusCode": 200,
  "message": "…",
  "data": {
    "invoiceNumber": "INV-2026-0001",
    "issuedAt": "2026-08-07T06:00:00.000Z",
    "order": { "id": "…", "orderNumber": "ORD-…", "status": "PENDING" }
  },
  "timestamp": "2026-08-07T06:00:00.000Z",
  "path": "/orders/…/invoice"
}
```

---

## `PATCH /orders/:id/payment-status`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `paymentStatus` | yes | `PAID` \| `CANCELLED` |

### Response `data`

`OrderResponse`

### Example

```json
{
  "paymentStatus": "PAID"
}
```
