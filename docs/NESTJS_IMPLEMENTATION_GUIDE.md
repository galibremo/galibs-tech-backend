# NestJS Backend Implementation Guide  
## StarTech-style Catalog (Module by Module)

This guide tells you **exactly what to build, in what order**, for a NestJS backend that uses the Drizzle schema in this project.

You do **not** need to be an advanced backend developer. Follow the modules in order. Do not skip ahead.

---

## How to use this guide

1. Finish **Module 0** fully before Module 1.
2. Each module has:
   - **Goal** — what you will have when done  
   - **Why this order** — why it comes now  
   - **Files to create** — exact folders/files  
   - **Steps** — numbered actions  
   - **Done checklist** — how you know it works  
3. After each module, test with Thunder Client / Postman / curl before moving on.

**Stack we use**

| Tool | Purpose |
| --- | --- |
| Bun | Package manager + runtime |
| NestJS | API framework |
| Drizzle ORM | Database access (schema already designed) |
| PostgreSQL | Database |
| Zod or class-validator | Request validation |

---

## Big picture: which module first?

```
0. Project setup + database
1. Brands
2. Categories
3. Attributes (filter definitions)     ← needed before products can be filtered
4. Products (+ images + category links)
5. Product variants (Color / Storage / RAM SKUs)  ← NEW
6. Product attributes (attach filters to products)
7. Specifications (PDP specs)
8. Faceted search / filter API        ← the “StarTech sidebar”
9. Commerce extras (stores, offers, reviews)  ← later
```

**Rule:** Catalog data first → variants → attach filters → then search API → then extras.

**Simple vs variable products**

| Type | Meaning | Where price/stock live |
| --- | --- | --- |
| `simple` | One SKU | `products` row |
| `variable` | Parent PDP with options | `product_variants` rows (parent caches min price) |

---

# Module 0 — Project Setup + Database

## Goal

A running NestJS app that can connect to PostgreSQL and use your Drizzle schema.

## Why first

Nothing else works without app + DB connection.

## What you create

```
startech-api/
├── package.json
├── nest-cli.json
├── tsconfig.json
├── .env
├── drizzle.config.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── env.ts
│   └── database/
│       ├── database.module.ts
│       ├── database.providers.ts
│       └── schema/          ← copy from startech-schema/src/db/schema
```

## Steps

### Step 0.1 — Create NestJS project

```bash
bunx @nestjs/cli new startech-api
cd startech-api
```

Choose bun if asked for package manager (or run `bun install` after).

### Step 0.2 — Install dependencies

```bash
bun add drizzle-orm postgres dotenv
bun add -d drizzle-kit typescript @types/node
bun add class-validator class-transformer
bun add @nestjs/config
```

### Step 0.3 — Environment file

Create `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/startech
```

Create `.env.example` with the same keys (no secrets).

### Step 0.4 — Copy Drizzle schema

Copy all files from:

`startech-schema/src/db/schema/*`

into:

`startech-api/src/database/schema/`

Also copy `drizzle.config.ts` and point `schema` to `./src/database/schema/index.ts`.

### Step 0.5 — Create database + push schema

```bash
# create DB in Postgres (example)
createdb startech

bunx drizzle-kit push
```

If push fails, fix `DATABASE_URL` first.

### Step 0.6 — Database module (NestJS)

**`src/database/database.providers.ts`**

- Create postgres client from `DATABASE_URL`
- Create drizzle instance with schema
- Export a provider token: `DRIZZLE`

**`src/database/database.module.ts`**

- `@Global()` module
- Provide + export `DRIZZLE`

**`src/app.module.ts`**

- Import `ConfigModule.forRoot({ isGlobal: true })`
- Import `DatabaseModule`

### Step 0.7 — Health check

Create a simple route:

`GET /health` → `{ "ok": true }`

Run:

```bash
bun run start:dev
curl http://localhost:3000/health
```

## Done checklist

- [ ] Nest app starts without errors  
- [ ] `/health` returns OK  
- [ ] Tables exist in Postgres (`brands`, `products`, `attributes`, …)  
- [ ] You can open Drizzle Studio: `bunx drizzle-kit studio`

---

# Module 1 — Brands Module

## Goal

Create / list / get / update / soft-deactivate brands (`Lenovo`, `MSI`, …).

## Why this order

Products and brand filters depend on brands. Brands have no dependency on products.

## Folder

```
src/brands/
├── brands.module.ts
├── brands.controller.ts
├── brands.service.ts
├── dto/
│   ├── create-brand.dto.ts
│   └── update-brand.dto.ts
```

## API endpoints to build

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/brands` | Create brand |
| `GET` | `/brands` | List brands (`?featured=true`) |
| `GET` | `/brands/:slug` | Get one by slug |
| `PATCH` | `/brands/:id` | Update |
| `DELETE` | `/brands/:id` | Set `isActive = false` (prefer soft disable) |

## Steps

1. Generate module:

```bash
bunx nest g module brands
bunx nest g controller brands
bunx nest g service brands
```

2. Inject `DRIZZLE` into `BrandsService`.
3. Write DTOs:
   - `name` required string  
   - `slug` required string (or auto from name)  
   - `logoUrl`, `description`, `isFeatured` optional  
4. Implement service methods with Drizzle:
   - `insert(brands)`
   - `select().from(brands).where(eq(brands.isActive, true))`
   - `update` / deactivate  
5. Register controller routes.
6. Import `BrandsModule` in `AppModule` (Nest CLI usually does this).

## Test data

```bash
curl -X POST http://localhost:3000/brands \
  -H "Content-Type: application/json" \
  -d '{"name":"Lenovo","slug":"lenovo","isFeatured":true}'
```

## Done checklist

- [ ] Create brand works  
- [ ] List returns Lenovo  
- [ ] Get by slug works  
- [ ] Duplicate slug returns clear error (unique index)

---

# Module 2 — Categories Module

## Goal

Nested category tree like StarTech mega-menu (`desktops` → `gaming-pc` → …).

## Why this order

Products need a primary category. Filters are attached per category later.

## Folder

```
src/categories/
├── categories.module.ts
├── categories.controller.ts
├── categories.service.ts
├── dto/
│   ├── create-category.dto.ts
│   └── update-category.dto.ts
```

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/categories` | Create category |
| `GET` | `/categories` | Root categories or full tree |
| `GET` | `/categories/tree` | Nested tree for menu |
| `GET` | `/categories/:slug` | One category |
| `GET` | `/categories/:slug/children` | Direct children |
| `PATCH` | `/categories/:id` | Update |
| `DELETE` | `/categories/:id` | Deactivate |

## Important fields when creating

| Field | Rule |
| --- | --- |
| `name` | required |
| `slug` | unique |
| `parentId` | optional (null = root) |
| `path` | auto-build in service |
| `depth` | auto-build in service |

### How to build `path` (do this in service)

```
if no parent:
  path = "/" + slug
  depth = 0

if parent exists:
  path = parent.path + "/" + slug
  depth = parent.depth + 1
```

Example:

- `desktops` → path `/desktops`, depth `0`
- `gaming-pc` under desktops → path `/desktops/gaming-pc`, depth `1`

## Seed first categories (manual or script)

Create at least:

1. `laptop-notebook`  
2. `component`  
3. `monitor`  
4. child: `processor` under `component`

## Done checklist

- [ ] Create root category  
- [ ] Create child with correct `path` and `depth`  
- [ ] `GET /categories/tree` returns nested JSON  
- [ ] Invalid `parentId` returns 400/404

---

# Module 3 — Attributes Module (Filter Definitions)

## Goal

Define filter groups and options (StarTech sidebar), and attach which filters appear on which category.

## Why this order

You must define “RAM Size / Brand / Socket” **before** you can attach them to products or run faceted search.

## Folder

```
src/attributes/
├── attributes.module.ts
├── attributes.controller.ts
├── attributes.service.ts
├── dto/
│   ├── create-attribute.dto.ts
│   ├── create-attribute-option.dto.ts
│   └── assign-category-attribute.dto.ts
```

## API endpoints

### Attributes (groups)

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/attributes` | Create group (`code`: `ram_size`) |
| `GET` | `/attributes` | List all groups |
| `GET` | `/attributes/:code` | Get group + options |
| `PATCH` | `/attributes/:id` | Update group |

### Options (checkbox values)

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/attributes/:attributeId/options` | Add option (`16 GB`) |
| `GET` | `/attributes/:attributeId/options` | List options |
| `PATCH` | `/attribute-options/:id` | Update option |
| `DELETE` | `/attribute-options/:id` | Deactivate option |

### Category ↔ attribute mapping

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/categories/:categoryId/attributes` | Assign filter group to category |
| `GET` | `/categories/:categoryId/filters` | Sidebar definition for that category |
| `PATCH` | `/categories/:categoryId/attributes/:attributeId` | Change sort order |

## Seed example (Laptop)

Create attributes with codes:

- `brand`
- `series`
- `processor_type`
- `ram_size`
- `ssd`
- …

Then add options:

- `ram_size` → `8 GB`, `16 GB`, `32 GB`
- `processor_type` → `Intel`, `AMD`, `Apple`

Then assign those attributes to category `laptop-notebook` with `sortOrder`.

For `brand` options:

- Create option label `Lenovo`
- Set `brandId` to the Lenovo row from Module 1

## Done checklist

- [ ] Create attribute `ram_size`  
- [ ] Add options 8/16/32 GB  
- [ ] Assign attributes to laptop category  
- [ ] `GET /categories/:id/filters` returns groups + options like StarTech sidebar

---

# Module 4 — Products Module

## Goal

Create products with price, brand, category, key features, images.

## Why this order

Products need brands + categories first. Variants come in Module 5. Filters attachment comes in Module 6.

## Folder

```
src/products/
├── products.module.ts
├── products.controller.ts
├── products.service.ts
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   └── add-product-image.dto.ts
```

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/products` | Create product |
| `GET` | `/products` | List (basic pagination) |
| `GET` | `/products/:slug` | Product detail |
| `PATCH` | `/products/:id` | Update |
| `DELETE` | `/products/:id` | Soft delete (`deletedAt`) |
| `POST` | `/products/:id/images` | Add image |
| `POST` | `/products/:id/categories` | Link extra categories |

## Create product DTO fields (minimum)

```ts
{
  type?: "simple" | "variable"; // default simple
  productCode: string;      // "49982"
  name: string;
  slug: string;
  brandId: number;
  primaryCategoryId: number;
  price: number;            // simple = sell price; variable = starting "from" price
  regularPrice?: number;
  availability?: "in_stock" | "pre_order" | "up_coming" | "out_of_stock";
  keyFeatures?: string[];
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  warrantyText?: string;
}
```

> If `type = "variable"`, you will add option groups + variants in **Module 5**. Parent `price`/`stockQty` get refreshed from variants later.

## Service rules (important)

1. On create:
   - Insert into `products`
   - Also insert into `product_categories` with `isPrimary = true`
2. Validate `brandId` and `primaryCategoryId` exist.
3. Soft delete: set `deletedAt = now()`, `isActive = false`.
4. List endpoint should ignore soft-deleted products.

## Test product

Create one laptop:

- Brand: Lenovo  
- Category: laptop-notebook  
- Price: 81000  
- Regular: 86000  
- Key features: 3–4 bullets  

## Done checklist

- [ ] Create product works  
- [ ] `GET /products/:slug` returns brand + primary category info  
- [ ] Product appears in `product_categories`  
- [ ] Soft delete hides it from list  
- [ ] You can create both `simple` and `variable` products  

---

# Module 5 — Product Variants (Color / Storage / RAM)

## Goal

Support one product page with multiple sellable SKUs (variants), e.g.:

- Color: Black / Silver  
- Storage: 128GB / 256GB  
→ up to 4 variants, each with own price, stock, SKU

## Why this order

Needs a parent product (Module 4). Filter attributes (Module 3) already exist so option values can link to facet options.

## Folder

```
src/variants/
├── variants.module.ts
├── variants.controller.ts
├── variants.service.ts
├── dto/
│   ├── create-option-group.dto.ts
│   ├── create-option-value.dto.ts
│   ├── create-variant.dto.ts
│   └── update-variant.dto.ts
```

Copy helpers from schema project:

- `src/db/queries/sync-variant-caches.ts` → use `syncVariableProductCaches`, `buildOptionFingerprint`, `buildVariantTitle`

## Mental model

```
Product (type=variable) "iPhone 16"
├── Option group: Color
│     ├── Black
│     └── Silver
├── Option group: Storage
│     ├── 128GB
│     └── 256GB
└── Variants (SKUs)
      ├── Black / 128GB  → sku, price, stock
      ├── Black / 256GB
      ├── Silver / 128GB
      └── Silver / 256GB
```

**Cart rule:** always add `variantId` to cart for variable products (never only parent id).

## API endpoints

### Option groups & values

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/products/:productId/option-groups` | Create axis (`Color`, `Storage`) |
| `GET` | `/products/:productId/option-groups` | List groups + values |
| `POST` | `/option-groups/:groupId/values` | Add value (`Black`, `256GB`) |
| `PATCH` | `/option-values/:id` | Update label/swatch |
| `DELETE` | `/option-groups/:id` | Delete group (only if no variants use it) |

### Variants

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/products/:productId/variants` | Create one SKU |
| `POST` | `/products/:productId/variants/bulk` | Generate all combinations (optional) |
| `GET` | `/products/:productId/variants` | List variants |
| `GET` | `/variants/:id` | One variant |
| `PATCH` | `/variants/:id` | Update price/stock/sku |
| `DELETE` | `/variants/:id` | Soft delete |
| `POST` | `/products/:productId/variants/sync-cache` | Refresh parent price/stock |

## Create variant DTO

```ts
{
  sku: string;                 // "IP16-BLK-256"
  price: number;               // 145000
  regularPrice?: number;
  stockQty: number;
  availability?: "in_stock" | "pre_order" | "up_coming" | "out_of_stock";
  isDefault?: boolean;
  optionValueIds: number[];    // [blackValueId, storage256ValueId]
  thumbnailUrl?: string;
  attributeOptionIds?: number[]; // optional facet tags for this SKU
}
```

## Service steps when creating a variant

1. Ensure parent `products.type === "variable"` (else 400).
2. Validate every `optionValueId` belongs to this product’s option groups.
3. Ensure **exactly one value per option group**.
4. `fingerprint = buildOptionFingerprint(optionValueIds)` — reject if duplicate.
5. `title = buildVariantTitle(labels)` → `"Black / 256GB"`.
6. Insert `product_variants`.
7. Insert `product_variant_option_values` rows.
8. Optional: insert `product_variant_attribute_values` from `attributeOptionIds` or from linked `product_option_values.attributeOptionId`.
9. If `isDefault`, unset other defaults for this product.
10. Call `syncVariableProductCaches(db, productId)`.

## Parent product detail response (include variants)

```json
{
  "id": 10,
  "type": "variable",
  "name": "iPhone 16",
  "price": 120000,
  "maxPrice": 145000,
  "optionGroups": [
    {
      "id": 1,
      "name": "Color",
      "code": "color",
      "values": [
        { "id": 11, "label": "Black", "swatchValue": "#000000" },
        { "id": 12, "label": "Silver", "swatchValue": "#C0C0C0" }
      ]
    }
  ],
  "variants": [
    {
      "id": 100,
      "sku": "IP16-BLK-256",
      "title": "Black / 256GB",
      "price": 145000,
      "stockQty": 5,
      "availability": "in_stock",
      "isDefault": true,
      "optionValueIds": [11, 22]
    }
  ]
}
```

## Frontend selection flow (for your understanding)

1. User opens PDP → loads option groups + variants.  
2. User picks Color=Black, Storage=256GB.  
3. Frontend finds variant where `optionValueIds` match both.  
4. Show that variant’s price/stock.  
5. Add to cart with `{ productId, variantId }`.

## Done checklist

- [ ] Create option groups Color + Storage on a variable product  
- [ ] Create option values  
- [ ] Create 2+ variants with different prices  
- [ ] Duplicate combination is rejected  
- [ ] Parent `price` becomes minimum variant price after sync  
- [ ] Parent `stockQty` equals sum of variant stocks  
- [ ] `GET /products/:slug` returns groups + variants  
- [ ] Simple products still work without variants  

---

# Module 6 — Product Attributes (Attach Filters to Products)

## Goal

Tag each product with filter option IDs (e.g. RAM = 16 GB, Brand = Lenovo).

## Why this order

Faceted search only works after products (or their variants) have attribute values in `product_attribute_values` / `product_variant_attribute_values`.

## Where to put code

Either:

- methods inside `ProductsService`, or  
- new `src/products/product-attributes.service.ts`

Recommended endpoints on products module:

| Method | Path | Purpose |
| --- | --- | --- |
| `PUT` | `/products/:id/attributes` | Replace all filter tags |
| `POST` | `/products/:id/attributes` | Add one/many tags |
| `GET` | `/products/:id/attributes` | Get current tags |
| `DELETE` | `/products/:id/attributes/:optionId` | Remove one tag |

## Request body example

```json
{
  "optionIds": [1065, 24, 95]
}
```

Meaning (examples):

- `1065` → Brand Lenovo  
- `24` → RAM 16 GB  
- `95` → SSD 512 GB  

## Service logic

For each `optionId`:

1. Load `attribute_options` row → get `attributeId`
2. Insert into `product_attribute_values`:
   - `productId`
   - `attributeId`
   - `attributeOptionId`
3. If unique conflict, ignore or update

Also sync brand:

- If option has `brandId`, you may also set `products.brandId` (optional consistency rule)

## Done checklist

- [ ] Attach 3+ options to a product  
- [ ] `GET /products/:id/attributes` returns groups + labels  
- [ ] Duplicate attach does not crash

---

# Module 7 — Specifications Module (PDP)

## Goal

Store full specification table like StarTech product page.

## Why this order

Not required for filtering, but required for product detail page completeness.

## Folder

```
src/specifications/
├── specifications.module.ts
├── specifications.controller.ts
├── specifications.service.ts
├── dto/
│   ├── create-spec-group.dto.ts
│   ├── create-spec-field.dto.ts
│   └── upsert-product-specs.dto.ts
```

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/spec-groups` | Create group (`Processor`) |
| `POST` | `/spec-groups/:id/fields` | Create field (`Processor Model`) |
| `PUT` | `/products/:id/specifications` | Save all PDP values |
| `GET` | `/products/:id/specifications` | Grouped specs for UI |

## Response shape for frontend

```json
[
  {
    "group": "Processor",
    "items": [
      { "name": "Processor Brand", "value": "Qualcomm" },
      { "name": "Processor Model", "value": "Snapdragon X Plus" }
    ]
  },
  {
    "group": "Memory",
    "items": [
      { "name": "RAM", "value": "16GB (Onboard)" }
    ]
  }
]
```

## Done checklist

- [ ] Spec groups + fields exist  
- [ ] Product specs save  
- [ ] Detail endpoint returns grouped data

---

# Module 8 — Faceted Search Module (Most Important)

## Goal

Category listing API that supports StarTech-style filters.

Example:

`GET /categories/laptop-notebook/products?brand=1065&ram_size=24&priceMin=50000&priceMax=150000&availability=in_stock&sort=price_asc&page=1&limit=20`

## Why this order

Needs Modules 2–6 complete (variants optional but supported).

## Folder

```
src/catalog/
├── catalog.module.ts
├── catalog.controller.ts
├── catalog.service.ts
├── dto/
│   └── product-filter-query.dto.ts
```

(You already have query sketch in `startech-schema/src/db/queries/faceted-search.ts` — adapt it into Nest service.)

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/categories/:slug/filters` | Sidebar filters + option counts |
| `GET` | `/categories/:slug/products` | Filtered product list |

## Query params to support

| Param | Example | Meaning |
| --- | --- | --- |
| `priceMin` | `50000` | Min price |
| `priceMax` | `150000` | Max price |
| `availability` | `in_stock,pre_order` | Status filter |
| `sort` | `price_asc` / `price_desc` / `default` | Sorting |
| `page` | `1` | Pagination |
| `limit` | `20` | Page size |
| filter option ids | `filter=1065&filter=24` | Selected facet options |

Recommended: accept repeated `filter` query params as option IDs (same idea as StarTech checkboxes).

## Service algorithm (follow exactly)

1. Resolve category by `slug` → `categoryId`
2. Find all products in that category (`product_categories`)
3. Apply `priceMin` / `priceMax` (for variable products, parent `price` is min variant price)
4. Apply `availability`
5. If filters selected:
   - Match products that have option on parent **OR** on any child variant:
     - `product_attribute_values` OR `product_variant_attribute_values` → join to parent `product_id`
   - AND across groups / OR within group (same as before)
6. Sort + paginate
7. Return items + total + facets

> Listing cards still return the **parent product**. Show `price` as “from”, and `type: "variable"` so UI can hint “options available”.

## Response example

```json
{
  "items": [
    {
      "id": 1,
      "name": "Lenovo IdeaPad ...",
      "slug": "lenovo-ideapad-...",
      "price": 81000,
      "regularPrice": 86000,
      "availability": "in_stock",
      "thumbnailUrl": "...",
      "keyFeatures": ["...", "..."]
    }
  ],
  "total": 459,
  "page": 1,
  "limit": 20,
  "facets": [
    {
      "attributeCode": "brand",
      "attributeName": "Brand",
      "options": [
        { "id": 1065, "label": "Lenovo", "count": 120 },
        { "id": 1060, "label": "ASUS", "count": 80 }
      ]
    }
  ]
}
```

## Done checklist

- [ ] No filters → returns category products  
- [ ] One brand filter works  
- [ ] Brand + RAM together works (AND)  
- [ ] Two RAM values work as OR  
- [ ] Price range works  
- [ ] Pagination works  
- [ ] Facet counts look reasonable

---

# Module 9 — Commerce Extras (Do Later)

Only start this after Module 8 works.

## 9A — Stores + inventory

| Endpoint | Purpose |
| --- | --- |
| `CRUD /stores` | Branches |
| `PUT /stores/:id/inventory` | Body: `{ productId, variantId?, quantity }` |
| `GET /products/:id/store-availability` | “Available at which stores?” (include variantId query) |

> For variable products, always pass `variantId` when setting store stock.

## 9B — Offers / campaigns

| Endpoint | Purpose |
| --- | --- |
| `CRUD /offers` | Flash sale / campaign |
| `POST /offers/:id/products` | Attach product (optional `variantId` for SKU-specific deal) |

## 9C — Reviews + questions

| Endpoint | Purpose |
| --- | --- |
| `POST /products/:id/reviews` | Create review |
| `GET /products/:id/reviews` | List approved |
| `POST /products/:id/questions` | Ask question |
| `PATCH /questions/:id/answer` | Admin answer |

## 9D — PC Builder (advanced)

| Endpoint | Purpose |
| --- | --- |
| `GET /pc-builder/slots` | CPU, Motherboard, RAM, … |
| `GET /pc-builder/slots/:code/products` | Products for slot |
| `POST /pc-builder/validate` | Check compatibility rules |

Skip PC Builder until catalog + filters + variants are stable.

---

# Cross-cutting concerns (add gradually)

Do these as you go, not all at once.

## 1) Validation

Use DTO + `ValidationPipe` in `main.ts`:

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

## 2) Error format

Return consistent errors:

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

Use Nest `NotFoundException`, `BadRequestException`, `ConflictException`.

## 3) Pagination helper

Every list endpoint should support:

- `page` (default 1)  
- `limit` (default 20, max 100)

## 4) Auth (later)

For now, leave create/update open (local only).

Later add:

- `AuthModule` (JWT)
- Admin-only for `POST/PATCH/DELETE`
- Public for `GET` catalog endpoints

## 5) Seeding script

Create `src/database/seed.ts` that inserts:

1. Brands  
2. Categories  
3. Attributes + options  
4. Category attribute mapping  
5. Sample products + attribute values  

Run after migrations so frontend/testing is easy.

---

# Suggested weekly plan (if you are learning)

| Day | Focus |
| --- | --- |
| Day 1 | Module 0 (setup + DB) |
| Day 2 | Module 1 Brands + Module 2 Categories |
| Day 3 | Module 3 Attributes + category filter mapping |
| Day 4 | Module 4 Products + images |
| Day 5 | Module 5 Product variants |
| Day 6 | Module 6 Attach attributes to products |
| Day 7 | Module 7 Specs |
| Day 8 | Module 8 Faceted search (most important) |
| Later | Module 9 extras + auth |

---

# Exact implementation order (checklist)

Copy this and tick as you go:

- [ ] **M0** Nest app + Postgres + Drizzle schema pushed  
- [ ] **M0** `/health` works  
- [ ] **M1** Brands CRUD  
- [ ] **M2** Categories + tree + path/depth  
- [ ] **M3** Attributes + options  
- [ ] **M3** Assign attributes to categories  
- [ ] **M4** Products CRUD + images + primary category link (`simple` + `variable`)  
- [ ] **M5** Option groups + values + variants + parent cache sync  
- [ ] **M6** Attach filter options to products  
- [ ] **M7** Spec groups/fields + product specs  
- [ ] **M8** Filtered product listing API  
- [ ] **M8** Facet sidebar API with counts  
- [ ] Seed script with sample laptop + one variable phone  
- [ ] **M9** Stores / offers / reviews (optional)  
- [ ] Auth for admin routes (optional)

---

# Common beginner mistakes (avoid these)

1. **Building search before attributes** — filters will not work.  
2. **Putting RAM/CPU as fixed columns on products** — breaks dynamic categories. Use attributes.  
3. **Forgetting `product_categories`** — category pages will be empty.  
4. **AND/OR logic wrong** — remember: OR inside one filter group, AND across groups.  
5. **Hard-deleting products** — use soft delete.  
7. **No DTO validation** — bad data will corrupt filters.  
8. **Skipping seed data** — you cannot test filters with empty DB.  
9. **Adding parent product to cart for variable items** — always use `variantId`.  
10. **Forgetting `syncVariableProductCaches`** — listing prices/stock will be wrong.

---

# Minimum “StarTech-like” demo path

When you finish Module 8, you should be able to:

1. Open `GET /categories/laptop-notebook/filters`  
   → see Brand, RAM, Processor Type, etc.  
2. Create a Lenovo laptop product tagged with Brand=Lenovo, RAM=16GB  
3. Call:

```http
GET /categories/laptop-notebook/products?filter=LENOVO_OPTION_ID&filter=RAM16_OPTION_ID
```

4. See that product in results  
5. Open product detail + specifications  
6. Open a **variable** product, select Color+Storage, see matching variant price  

If that works, your backend core is production-shaped.

---

# What to build next after this guide

1. Admin panel (or use Drizzle Studio + API)  
3. Frontend category page wired to Module 8  
3. Auth + roles  
4. Caching facet counts (`category_facet_counts` refresh job)  
5. Full-text search on `products.search_document`

---

# Quick reference — module dependencies

```
Brands ----------\
                  \
Categories -------+--> Products --> Variants --> ProductAttributes --> FacetedSearch
                  /         \
Attributes ------/           +--> Specifications

Stores / Offers / Reviews / PC Builder  (after FacetedSearch)
```

**Start at Module 0. Do variants (M5) before faceted search polish. Cart must use `variantId` for variable products.**
