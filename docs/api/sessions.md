# Sessions

Base path: `/sessions`  
**Auth:** Session on all routes  
Shared conventions: [README.md](./README.md)

## Session row

| Field | Type |
|-------|------|
| `id` | UUID |
| `deviceName` | string |
| `deviceType` | string |
| `ipAddress` | string \| null |
| `userAgent` | string \| null |
| `loginMethod` | string \| null |
| `status` | `active` \| `revoked` \| `expired` |
| `isCurrent` | boolean |
| `isRevoked` | boolean |
| `createdAt` | ISO date-time |
| `updatedAt` | ISO date-time |
| `expiresAt` | ISO date-time |

## List query

[Common list params](./README.md#common-list-query-params) plus:

| Param | Constraints |
|-------|-------------|
| `sort` | `ipAddress` \| `userAgent` \| `createdAt` \| `expiresAt` |
| `status` | comma-separated: `active`, `revoked`, `expired` |
| `deviceType` | comma-separated (lowercased): `desktop`, `mobile`, `tablet`, `unknown` |

---

## `GET /sessions`

**Auth:** Session · **Status:** 200

### Response `data`

```ts
{
  rows: Session[];
  total: number;
  page: number;
  pageSize: number;
  activeOtherSessionCount: number;
}
```

### Example

```http
GET /sessions?page=1&pageSize=10&status=active&sort=createdAt&dir=desc
```

```json
{
  "statusCode": 200,
  "message": "…",
  "data": {
    "rows": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "deviceName": "Chrome on Windows",
        "deviceType": "desktop",
        "ipAddress": "203.0.113.10",
        "userAgent": "Mozilla/5.0 …",
        "loginMethod": "email",
        "status": "active",
        "isCurrent": true,
        "isRevoked": false,
        "createdAt": "2026-08-07T06:00:00.000Z",
        "updatedAt": "2026-08-07T06:00:00.000Z",
        "expiresAt": "2026-08-14T06:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "activeOtherSessionCount": 0
  },
  "timestamp": "2026-08-07T06:00:00.000Z",
  "path": "/sessions"
}
```

---

## `POST /sessions/revoke-others`

**Auth:** Session · **Status:** 200

Revokes all sessions except the current one.

### Response `data`

```json
{ "revokedCount": 2 }
```

---

## `POST /sessions/:id/revoke`

**Auth:** Session · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```json
{ "revoked": true }
```

May append `Set-Cookie` if the revoked session is current.

---

## `DELETE /sessions/:id`

**Auth:** Session · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | UUID |

### Response `data`

```json
{ "deleted": true }
```
