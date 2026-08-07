# Media

Base path: `/media`  
Shared conventions: [README.md](./README.md)

---

## `POST /media/upload`

**Auth:** Session · **Status:** 201 · **Content-Type:** `multipart/form-data`

### Multipart

| Field | Required | Constraints |
|-------|----------|-------------|
| `file` | yes | max **10 MB**; MIME must match `jpg\|jpeg\|png\|gif\|mp4\|webm\|ogg\|mpeg\|wav\|x-m4a\|aac\|opus\|pdf\|doc\|docx\|csv` |
| `folder` | no | string (body field) |

### Response `data`

| Field | Type |
|-------|------|
| `url` | URL string, max 2048 |
| `key` | string |

### Example

```http
POST /media/upload
Content-Type: multipart/form-data

file=@product.jpg
folder=products
```

```json
{
  "statusCode": 201,
  "message": "…",
  "data": {
    "url": "https://cdn.example.com/products/abc.jpg",
    "key": "products/abc.jpg"
  },
  "timestamp": "2026-08-07T06:00:00.000Z",
  "path": "/media/upload"
}
```
