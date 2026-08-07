# Auth

Base path: `/auth`  
Shared conventions: [README.md](./README.md)

Auth user payload (`LoginUser`) after transform — `id` is the public UUID:

| Field | Type |
|-------|------|
| `id` | UUID |
| `publicId` | UUID |
| `name` | string |
| `email` | string |
| `emailVerified` | boolean |
| `role` | `CUSTOMER` \| `AGENT` \| `SUPER_ADMIN` |
| `image` | string \| null |
| `hasPassword` | boolean (optional) |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

Several endpoints also set **`Set-Cookie`** (Better Auth session).

Password rules (where noted): string, trim, min **8**, max **128**.

---

## `POST /auth/register`

**Auth:** Public · **Status:** 201

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | yes | string, trim, 1–100 |
| `email` | yes | email, max 255, lowercased |
| `password` | yes | min 8, max 128 |

### Response `data`

`LoginUser`

### Example

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "securePass1"
}
```

```json
{
  "statusCode": 201,
  "message": "…",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "publicId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "emailVerified": false,
    "role": "CUSTOMER",
    "image": null,
    "hasPassword": true,
    "createdAt": "2026-08-07T06:00:00.000Z",
    "updatedAt": "2026-08-07T06:00:00.000Z"
  },
  "timestamp": "2026-08-07T06:00:00.000Z",
  "path": "/auth/register"
}
```

---

## `POST /auth/login`

**Auth:** Public · **Status:** 200

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `email` | yes | email, max 255, lowercased |
| `password` | yes | string, trim |

### Response `data`

`LoginUser` · cookies set

### Example

```json
{
  "email": "ada@example.com",
  "password": "securePass1"
}
```

---

## `POST /auth/google`

**Auth:** Public · **Status:** 200

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `idToken` | yes | string, min 1 |

### Response `data`

`LoginUser` · cookies set

### Example

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## `POST /auth/magic-link`

**Auth:** Public · **Status:** 200

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `email` | yes | email, max 255, lowercased |
| `name` | no | string, trim |
| `url` | no | URL, max 2048 |
| `callbackURL` | no | string, trim |
| `newUserCallbackURL` | no | string, trim |
| `errorCallbackURL` | no | string, trim |

### Response `data`

`boolean`

### Example

```json
{
  "email": "ada@example.com",
  "callbackURL": "https://app.example.com/auth/callback"
}
```

---

## `GET /auth/magic-link/verify`

**Auth:** Public · **Status:** 200

### Query

| Field | Required | Constraints |
|-------|----------|-------------|
| `token` | yes | string, trim |
| `callbackURL` | no | string, trim |
| `errorCallbackURL` | no | string, trim |
| `newUserCallbackURL` | no | string, trim |

### Response `data`

`LoginUser` · cookies set

### Example

```http
GET /auth/magic-link/verify?token=abc123
```

---

## `POST /auth/logout`

**Auth:** Public · **Status:** 200

No body. Clears/updates session cookies.

### Response `data`

`boolean`

---

## `GET /auth/session`

**Auth:** Session · **Status:** 200

### Response `data`

`LoginUser`

---

## `POST /auth/set-password`

**Auth:** Session · **Status:** 200

For accounts without a password (e.g. OAuth / magic link).

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `newPassword` | yes | min 8, max 128 |

### Response `data`

`boolean`

### Example

```json
{
  "newPassword": "newSecurePass1"
}
```

---

## `POST /auth/change-password`

**Auth:** Session · **Status:** 200

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `currentPassword` | yes | min 8, max 128 |
| `newPassword` | yes | min 8, max 128 |

### Response `data`

`boolean`

### Example

```json
{
  "currentPassword": "securePass1",
  "newPassword": "evenMoreSecure2"
}
```

---

## `PUT /auth/profile`

**Auth:** Session · **Status:** 200

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | yes | string, trim, 1–255 |

### Response `data`

`LoginUser` · cookies may update

### Example

```json
{
  "name": "Ada L."
}
```

---

## `PUT /auth/profile/image`

**Auth:** Session · **Status:** 200 · **Content-Type:** `multipart/form-data`

### Multipart

| Field | Required | Constraints |
|-------|----------|-------------|
| `avatar` | yes | file; MIME `image/png` \| `image/jpeg` \| `image/webp`; max **2 MB** |

### Response `data`

`LoginUser`

### Example

```http
PUT /auth/profile/image
Content-Type: multipart/form-data

avatar=@avatar.png
```
