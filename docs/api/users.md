# Users (admin)

Base path: `/users`  
**Auth:** Admin (`AuthGuard` + `SUPER_ADMIN`) on all routes  
Shared conventions: [README.md](./README.md)

## UserManagement row

| Field | Type |
|-------|------|
| `id` | UUID |
| `name` | string \| null |
| `email` | email |
| `image` | string \| null |
| `emailVerified` | boolean |
| `role` | `CUSTOMER` \| `AGENT` \| `SUPER_ADMIN` |
| `activeSessionCount` | integer ≥ 0 |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |

## List query

[Common list params](./README.md#common-list-query-params) plus:

| Param | Constraints |
|-------|-------------|
| `sort` | `name` \| `email` \| `emailVerified` \| `role` \| `activeSessionCount` \| `createdAt` \| `updatedAt` |
| `role` | optional comma-separated roles |
| `emailVerified` | `"true"` \| `"false"` |

---

## `GET /users`

**Auth:** Admin · **Status:** 200

### Response `data`

```ts
{ rows: UserManagement[]; total: number; page: number; pageSize: number }
```

### Example

```http
GET /users?page=1&pageSize=20&sort=createdAt&dir=desc&role=CUSTOMER
```

---

## `GET /users/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

`UserManagement`

---

## `POST /users`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `email` | yes | email, max 255, lowercased |
| `role` | yes | `CUSTOMER` \| `AGENT` \| `SUPER_ADMIN` |
| `name` | no | string max 255 or `null`; empty → `null` |
| `password` | no | password rules or `null`; empty → `null` |
| `emailVerified` | no | boolean |

### Response `data`

`UserManagement`

### Example

```json
{
  "email": "agent@example.com",
  "role": "AGENT",
  "name": "Support Agent",
  "password": "securePass1",
  "emailVerified": true
}
```

---

## `PATCH /users/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

At least one field required:

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | no | string max 255 or `null` |
| `email` | no | email, lowercased |
| `emailVerified` | no | boolean |

### Response `data`

`UserManagement`

### Example

```json
{
  "name": "Updated Name",
  "emailVerified": true
}
```

---

## `PATCH /users/:id/role`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `role` | yes | `CUSTOMER` \| `AGENT` \| `SUPER_ADMIN` |

### Response `data`

`UserManagement`

### Example

```json
{
  "role": "SUPER_ADMIN"
}
```

---

## `DELETE /users/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```json
{ "deleted": true }
```

---

## `POST /users/:id/sessions/revoke`

**Auth:** Admin · **Status:** 200

Revokes all sessions for the user.

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```json
{ "revokedCount": 3 }
```
