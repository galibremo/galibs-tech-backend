# Galibs Tech API Documentation

HTTP API reference for **galibs-tech-backend** (NestJS). Source of truth: controllers + Zod schemas under `src/modules/*/`.

There is **no global `/api` prefix**. Routes are served from the root (default port `8080`).

## Domains

| Domain | File |
|--------|------|
| Auth | [auth.md](./auth.md) |
| Users (admin) | [users.md](./users.md) |
| Sessions | [sessions.md](./sessions.md) |
| Media | [media.md](./media.md) |
| Utils | [utils.md](./utils.md) |
| Brands | [brands.md](./brands.md) |
| Categories & catalog | [categories.md](./categories.md) |
| Attributes | [attributes.md](./attributes.md) |
| Products | [products.md](./products.md) |
| Promotional | [promotional.md](./promotional.md) |
| Offers | [offers.md](./offers.md) |
| Variants & option groups | [variants.md](./variants.md) |
| Specifications | [specifications.md](./specifications.md) |
| Cart | [cart.md](./cart.md) |
| Wishlist | [wishlist.md](./wishlist.md) |
| Checkout & orders | [orders.md](./orders.md) |
| Email (providers, logs, templates) | [email.md](./email.md) |

## Base URL

```
http://localhost:8080
```

Port comes from `PORT` (default `8080`). CORS allows origins listed in `ORIGIN_URL` (comma-separated) with `credentials: true`.

### Allowed CORS headers

`Content-Type`, `Authorization`, `x-csrf-token`, `ngrok-skip-browser-warning`

> **Note:** Commerce guest flows use `X-Guest-Token`. That header is **not** currently listed in CORS `allowedHeaders` in `main.ts`, so browser cross-origin calls may need a server CORS update.

## Authentication

| Label | Meaning |
|-------|---------|
| **Public** | No auth guard |
| **Session** | Better Auth session cookie (`AuthGuard`) |
| **Admin** | Session + role `SUPER_ADMIN` |
| **Guest/Session** | Logged-in session **or** header `X-Guest-Token` (UUID). Prefer session when both exist. |
| **User required** | Logged-in session only (no guest fallback) |

### Roles

`CUSTOMER` | `AGENT` | `SUPER_ADMIN`

Admin HTTP routes enforce `SUPER_ADMIN` only.

### Guest token (`X-Guest-Token`)

Used by cart, wishlist, checkout, and order get/invoice:

1. Prefer authenticated Better Auth session.
2. Otherwise require `X-Guest-Token` as a valid UUID.
3. Both present → user context + guest token (e.g. cart merge).
4. Missing when not logged in → `400` (`X-Guest-Token header is required when not logged in`).
5. Invalid UUID → `400`.

Session cookies are set by Better Auth on login/register/google/magic-link verify. Send cookies with `credentials: 'include'` from the browser.

## Success response envelope

Most endpoints return:

```json
{
  "statusCode": 200,
  "message": "…",
  "data": {},
  "timestamp": "2026-08-07T06:00:00.000Z",
  "path": "/example",
  "pagination": null
}
```

| Field | Type | Notes |
|-------|------|--------|
| `statusCode` | number | HTTP status |
| `message` | string | Human-readable |
| `data` | any | Optional payload |
| `timestamp` | string | ISO date-time |
| `path` | string | Request path |
| `pagination` | object | Optional (offset or cursor); rarely used by current controllers |

## Error response envelope

From the global exception filter:

```json
{
  "statusCode": 400,
  "code": "validation_failed",
  "error": "Bad Request",
  "message": "…",
  "meta": {},
  "timestamp": "2026-08-07T06:00:00.000Z",
  "path": "/example",
  "requestId": "…"
}
```

`requestId` is also echoed as header `x-request-id`.

## Common list query params

Many list endpoints extend this base (all optional unless noted):

| Param | Type | Constraints |
|-------|------|-------------|
| `page` | integer | ≥ 1 |
| `pageSize` | integer | ≥ 1, max **500** |
| `sort` | string | Domain-specific enum |
| `dir` | string | `asc` \| `desc` |
| `search` | string | Trimmed |
| `fromDate` | date | |
| `toDate` | date | Must be ≥ `fromDate` if both set |

Defaults for page/pageSize vary by module (often `1` / `10` when applied in services).

## Rate limiting

Global throttler:

| Window | Limit |
|--------|-------|
| 1 second | 10 requests |
| 1 minute | 100 requests |

## Money & IDs

- Monetary amounts in request/response bodies are **integers** (smallest currency unit as used by the app, e.g. cents / taka paisa depending on product convention).
- Public resource IDs exposed in the API are **UUID v4** unless noted (email provider ids may be public string ids).

## Endpoint template

Each domain file documents every route with:

1. Method + path + auth
2. Path / query / headers
3. Request body or multipart fields
4. Response `data` shape
5. Example request / response
