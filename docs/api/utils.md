# Utils

Base path: `/utils`  
Shared conventions: [README.md](./README.md)

---

## `POST /utils/generate-slug`

**Auth:** Public · **Status:** 200

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `text` | yes | string, trim, max **500** |

### Response

Uses a manual envelope that includes `success: true` in addition to the usual fields:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Slug generated successfully",
  "data": {
    "slug": "gaming-laptop"
  },
  "timestamp": "2026-08-07T06:00:00.000Z",
  "path": "/utils/generate-slug"
}
```

### Example request

```json
{
  "text": "Gaming Laptop"
}
```
