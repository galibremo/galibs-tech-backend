# Promotional

Base path: `/promotional`  
Shared conventions: [README.md](./README.md)

StarTech-style homepage promotional content: hero carousel banners and header promo navigation links.

> Featured products use `GET /products?featured=true`. Promotional deal products use [offers.md](./offers.md).

---

## Public content shape

```json
{
  "heroSlides": [],
  "promoNavLinks": []
}
```

---

## `GET /promotional`

**Auth:** Public · **Status:** 200

Returns active hero slides and promo nav links.

- Hero slides: `isActive = true` and within optional `startsAt` / `endsAt` window
- Promo nav links: `isActive = true`
- Sorted by `sortOrder` ascending

---

## Hero slide shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `title` | string \| null |
| `subtitle` | string \| null |
| `imageUrl` | string |
| `mobileImageUrl` | string \| null |
| `linkUrl` | string \| null |
| `linkTarget` | `_self` \| `_blank` |
| `altText` | string \| null |
| `sortOrder` | number |
| `isActive` | boolean |
| `startsAt` | ISO date-time \| null |
| `endsAt` | ISO date-time \| null |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

---

## Promo nav link shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `label` | string |
| `sublabel` | string \| null |
| `icon` | string \| null |
| `linkUrl` | string |
| `badge` | string \| null |
| `sortOrder` | number |
| `isActive` | boolean |
| `offerId` | UUID \| null |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

---

## `GET /promotional/hero-slides`

**Auth:** Admin · **Status:** 200

Returns all hero slides including inactive and scheduled items.

---

## `POST /promotional/hero-slides`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Notes |
|-------|----------|-------|
| `title` | no | |
| `subtitle` | no | |
| `imageUrl` | yes | Upload via `POST /media/upload` with `folder=hero` |
| `mobileImageUrl` | no | |
| `linkUrl` | no | e.g. `/offers/happy-hour` |
| `linkTarget` | no | `_self` (default) \| `_blank` |
| `altText` | no | |
| `sortOrder` | no | default `0` |
| `isActive` | no | default `true` |
| `startsAt` | no | |
| `endsAt` | no | |

---

## `PATCH /promotional/hero-slides/:id`

**Auth:** Admin · **Status:** 200

Partial update. At least one field required.

---

## `DELETE /promotional/hero-slides/:id`

**Auth:** Admin · **Status:** 200

### Response `data`

```json
{ "deleted": true }
```

---

## `GET /promotional/promo-nav-links`

**Auth:** Admin · **Status:** 200

---

## `POST /promotional/promo-nav-links`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Notes |
|-------|----------|-------|
| `label` | yes | e.g. `Offers` |
| `sublabel` | no | e.g. `Latest Offers` |
| `icon` | no | Material icon name |
| `linkUrl` | yes | |
| `badge` | no | |
| `sortOrder` | no | default `0` |
| `isActive` | no | default `true` |
| `offerId` | no | Link to an offer record |

---

## `PATCH /promotional/promo-nav-links/:id`

**Auth:** Admin · **Status:** 200

---

## `DELETE /promotional/promo-nav-links/:id`

**Auth:** Admin · **Status:** 200
