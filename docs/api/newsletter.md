# Newsletter

Base path: `/newsletter`

## `POST /newsletter/subscribe`

Public. Subscribes an email address to the newsletter. Re-subscribing an
existing address is idempotent (it re-activates an `UNSUBSCRIBED` row and
returns `isNew: false`).

Rate limit: 2 requests/second and 10 requests/minute per IP, on top of the
global throttle.

### Body

| Field | Type | Notes |
|-------|------|-------|
| `email` | string | Required. Normalised to lower case. |
| `source` | string | Optional, max 64 chars. Where the signup came from, e.g. `home_footer`. |

### Response `200`

```json
{
  "statusCode": 200,
  "message": "Subscribed to the newsletter",
  "data": {
    "email": "shopper@example.com",
    "status": "SUBSCRIBED",
    "isNew": true
  }
}
```

`message` is `Already subscribed to the newsletter` and `isNew` is `false`
when the address was already active.

### Table

`newsletter_subscriptions`: `id`, `email` (unique), `status`
(`SUBSCRIBED` | `UNSUBSCRIBED`), `source`, `ip_address`, `user_agent`,
timestamps. There is no unsubscribe or admin list endpoint yet.
