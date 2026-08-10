# Offers

Base path: `/offers`  
Shared conventions: [README.md](./README.md)

Promotional deal campaigns with explicitly attached products. Only products added via `POST /offers/:id/products` appear on an offer page.

---

## Offer types

`FLASH_SALE` | `HAPPY_HOUR` | `CAMPAIGN` | `SPECIAL_OFFER` | `EMI` | `BUNDLE`

---

## Offer shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `name` | string |
| `slug` | string |
| `type` | offer type enum |
| `description` | string \| null |
| `bannerImageUrl` | string \| null |
| `isActive` | boolean |
| `startsAt` | ISO date-time \| null |
| `endsAt` | ISO date-time \| null |
| `sortOrder` | number |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |
| `products` | Offer product[] (detail endpoints only) |

---

## Offer product shape

| Field | Type |
|-------|------|
| `id` | UUID (offer_products row id) |
| `productId` | UUID |
| `variantId` | UUID \| null |
| `offerPrice` | number \| null |
| `sortOrder` | number |
| `name` | string |
| `slug` | string |
| `thumbnailUrl` | string \| null |
| `price` | number (effective deal price) |
| `regularPrice` | number \| null |
| `saveAmount` | number \| null |
| `savePercent` | number \| null |
| `earnPoints` | number |
| `availability` | stock status |

---

## `GET /offers/active`

**Auth:** Public · **Status:** 200

Live offers (`isActive`, within schedule window).

---

## `GET /offers/:slug`

**Auth:** Public · **Status:** 200

Offer detail with attached products and computed savings.

---

## `GET /offers`

**Auth:** Admin · **Status:** 200

Paginated offer list. [Common list params](./README.md#common-list-query-params)

---

## `POST /offers`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required |
|-------|----------|
| `name` | yes |
| `slug` | yes |
| `type` | yes |
| `description` | no |
| `bannerImageUrl` | no |
| `isActive` | no (default `true`) |
| `startsAt` | no |
| `endsAt` | no |
| `sortOrder` | no (default `0`) |

---

## `PATCH /offers/:id`

**Auth:** Admin · **Status:** 200

---

## `DELETE /offers/:id`

**Auth:** Admin · **Status:** 200

---

## `POST /offers/:id/products`

**Auth:** Admin · **Status:** 201

Attach a product to an offer.

### Body

| Field | Required | Notes |
|-------|----------|-------|
| `productId` | yes | |
| `variantId` | no | SKU-specific deal |
| `offerPrice` | no | Override price in BDT |
| `sortOrder` | no | default `0` |

---

## `DELETE /offers/:id/products`

**Auth:** Admin · **Status:** 200

### Body

| Field | Required |
|-------|----------|
| `productId` | yes |
| `variantId` | no |

### Response `data`

```json
{ "deleted": true }
```
