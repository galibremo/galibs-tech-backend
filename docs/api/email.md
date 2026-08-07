# Email

Base paths: `/email-providers`, `/email-logs`, `/email-templates`  
**Auth:** Admin (`AuthGuard` + `SUPER_ADMIN`) on all routes  
Shared conventions: [README.md](./README.md)

---

## Email providers

### Provider types

`resend`, `postmark`, `sendgrid`, `cloudflare`, `unosend`, `iterable`, `ses`, `mailgun`, `mailersend`, `brevo`, `mailchimp`, `sparkpost`, `loops`, `sequenzy`, `jetemail`, `lettermint`, `primitive`, `plunk`, `mailtrap`, `scaleway`, `zeptomail`, `mailpace`, `email`

### EmailProvider shape

| Field | Type |
|-------|------|
| `id` | string (public id) |
| `name` | string |
| `providerType` | enum above |
| `config` | object |
| `isDefault` | boolean |
| `isActive` | boolean |
| `lastTestedAt` | string \| null |
| `lastTestStatus` | string \| null |
| `createdAt` | string |
| `updatedAt` | string |

### List query

[Common list params](./README.md#common-list-query-params) plus:

| Param | Constraints |
|-------|-------------|
| `sort` | `name` \| `providerType` \| `isDefault` \| `isActive` \| `lastTestStatus` \| `createdAt` \| `updatedAt` |
| `providerType` | enum above |
| `isActive` | `"true"` \| `"false"` |

Typical defaults: `page=1`, `pageSize=10`.

### Config (create)

Always includes:

| Field | Required | Constraints |
|-------|----------|-------------|
| `senderEmail` | yes | email |
| `senderName` | yes | max 100 |

Plus type-specific fields (strict objects):

| Type | Required extras | Optional extras |
|------|-----------------|-----------------|
| `resend`, `jetemail`, `primitive` | `apiKey` | `baseUrl`, `headers` |
| `postmark` | `serverToken` | `baseUrl`, `messageStream`, `headers` |
| `sendgrid`, `unosend`, `mailersend`, `brevo`, `mailchimp`, `sequenzy`, `plunk`, `mailtrap`, `mailpace` | `apiKey` | `baseUrl` |
| `cloudflare` | `apiToken`, `accountId` | `baseUrl` |
| `iterable` | `apiKey`, `campaignId` (int ≥ 1) | `allowRepeatMarketingSends`, `dataFields`, `sendAt`, `baseUrl` |
| `ses` | `accessKeyId`, `secretAccessKey`, `region` | `sessionToken`, `baseUrl`, `charset`, `configurationSetName` |
| `mailgun` | `apiKey`, `domain` | `baseUrl` |
| `sparkpost` | `apiKey` | `baseUrl`, `sandbox` |
| `loops` | `apiKey`, `transactionalId` | `baseUrl` |
| `lettermint` | `apiToken` | `baseUrl`, `route`, `headers` |
| `scaleway` | `secretKey`, `projectId` | `region`, `baseUrl` |
| `zeptomail` | `token` | `baseUrl` |
| `email` (SMTP) | `host` | `port` ≥ 1, `secure`, `auth{user,pass,method?}`, `defaults.replyTo`, `tls`, `requireTLS`, `allowInsecureAuth`, `name`, `heloName`, `timeoutMs` |

---

### `GET /email-providers`

**Auth:** Admin · **Status:** 200

### Response `data`

```ts
{ rows: EmailProvider[]; total: number; page: number; pageSize: number }
```

---

### `GET /email-providers/:id`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `id` | public string id |

### Response `data`

`EmailProvider`

---

### `POST /email-providers`

**Auth:** Admin · **Status:** 201

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | yes | max 100 |
| `providerType` | yes | enum |
| `config` | yes | type-specific object |

### Response `data`

`EmailProvider`

### Example

```json
{
  "name": "Production Resend",
  "providerType": "resend",
  "config": {
    "senderEmail": "noreply@example.com",
    "senderName": "Galibs Tech",
    "apiKey": "re_xxx"
  }
}
```

---

### `PATCH /email-providers/:id`

**Auth:** Admin · **Status:** 200

### Body

At least one of:

| Field | Constraints |
|-------|-------------|
| `name` | max 100 |
| `config` | object |

### Response `data`

`EmailProvider`

---

### `DELETE /email-providers/:id`

**Auth:** Admin · **Status:** 200

### Response `data`

```json
{ "deleted": true }
```

---

### `POST /email-providers/:id/test`

**Auth:** Admin · **Status:** 200

### Body

| Field | Required | Constraints |
|-------|----------|-------------|
| `to` | yes | `{ email` required; `name?` max 100 `}` |
| `subject` | no | max 255 |
| `text` | no | string |
| `html` | no | string |

### Response `data`

```ts
{ success: boolean; message: string }
```

### Example

```json
{
  "to": { "email": "ops@example.com", "name": "Ops" },
  "subject": "Provider test",
  "text": "Hello from Galibs Tech"
}
```

---

### `POST /email-providers/:id/set-default`

**Auth:** Admin · **Status:** 200

No body.

### Response `data`

`EmailProvider`

---

### `PATCH /email-providers/:id/toggle`

**Auth:** Admin · **Status:** 200

Toggles `isActive`.

### Response `data`

`EmailProvider`

---

## Email logs

### EmailLog shape

| Field | Type |
|-------|------|
| `id` | UUID |
| `emailProviderId` | string \| null |
| `toEmail` | email |
| `toName` | string \| null |
| `subject` | string |
| `templateKey` | string \| null |
| `status` | `sent` \| `failed` |
| `errorMessage` | string \| null |
| `metadata` | object |
| `createdAt` | string |
| `updatedAt` | string |

### List query

[Common list params](./README.md#common-list-query-params) plus:

| Param | Constraints |
|-------|-------------|
| `sort` | `toEmail` \| `status` \| `templateKey` \| `createdAt` |
| `providerId` | string max 100 |
| `toEmail` | max 255 |
| `status` | max 20 |
| `templateKey` | max 100 |

---

### `GET /email-logs`

**Auth:** Admin · **Status:** 200

### Response `data`

```ts
{ rows: EmailLog[]; total: number; page: number; pageSize: number }
```

---

### `GET /email-logs/:logId`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `logId` | UUID |

### Response `data`

`EmailLog`

---

### `POST /email-logs/:logId/resend`

**Auth:** Admin · **Status:** 200

No body. Resends and returns the latest log (or original).

### Response `data`

`EmailLog`

---

### `DELETE /email-logs/:logId`

**Auth:** Admin · **Status:** 200

### Response `data`

```json
{ "deleted": true }
```

---

## Email templates

### EmailTemplate shape

| Field | Type |
|-------|------|
| `publicId` | UUID |
| `key` | string |
| `subject` | string |
| `html` | string |
| `text` | string \| null |
| `variables` | `{ name, type: 'string'\|'number'\|'boolean', required, description }[]` |
| `version` | int ≥ 1 |
| `isActive` | boolean |
| `createdAt` | ISO string |
| `updatedAt` | ISO string |

### List query

[Common list params](./README.md#common-list-query-params) plus:

| Param | Constraints |
|-------|-------------|
| `sort` | `key` \| `subject` \| `version` \| `isActive` \| `createdAt` \| `updatedAt` |
| `isActive` | `"true"` \| `"false"` |

---

### `GET /email-templates`

**Auth:** Admin · **Status:** 200

### Response `data`

```ts
{ rows: EmailTemplate[]; total: number; page: number; pageSize: number }
```

---

### `GET /email-templates/:publicId`

**Auth:** Admin · **Status:** 200

### Path

| Param | Type |
|-------|------|
| `publicId` | UUID |

### Response `data`

`EmailTemplate`

---

### `PATCH /email-templates/:publicId`

**Auth:** Admin · **Status:** 200

### Body

At least one of:

| Field | Constraints |
|-------|-------------|
| `subject` | string |
| `html` | string |
| `text` | string |
| `isActive` | boolean |

### Response `data`

`EmailTemplate`

### Example

```json
{
  "subject": "Welcome to Galibs Tech",
  "isActive": true
}
```
