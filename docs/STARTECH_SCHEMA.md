# StarTech.com.bd — Backend Schema Analysis & Drizzle Design

Production-grade PostgreSQL / Drizzle ORM schema reverse-engineered from the live storefront at [https://www.startech.com.bd/](https://www.startech.com.bd/).

**Project path:** `Typetech Projects/startech-schema`

---

## 1. What StarTech’s Catalog Backend Does

Star Tech is a large Bangladeshi tech retailer (laptops, desktops, components, monitors, phones, gadgets, appliances, etc.). Their e-commerce catalog is built around:

| Feature | Storefront behavior |
| --- | --- |
| Nested categories | Mega-menu: `Desktop → Gaming PC → Intel Gaming PC`, `Component → Processor`, etc. |
| Brands | First-class (Lenovo, MSI, Microsoft…) plus brand landing pages (`/lenovo-laptop`) |
| Products | Price, regular price, status, product code, key features, images, EMI, points |
| Dynamic filters | Per-category sidebar facets with checkbox IDs (`data-group-id`, `name="filter"`) |
| Specs (PDP) | Grouped specification tables (Processor, Display, Memory, …) |
| Availability | In Stock / Pre Order / Up Coming / Out Of Stock |
| Price range | Slider using category min/max price |
| Extra | Compare, PC Builder, stores, campaigns, reviews, Q&A |

---

## 2. Dynamic Filter System (Critical Insight)

StarTech does **not** hard-code filters per category in application code alone. Filters are data-driven:

### HTML evidence (Laptop category)

```html
<div class="filter-group ws-box show" data-group-id="333">
  <div class="label"><span>Series</span></div>
  <div class="items">
    <label class="filter">
      <input type="checkbox" name="filter" value="2368" />
      <span>Consumer Laptops</span>
    </label>
    ...
  </div>
</div>

<div class="filter-group ws-box show" data-group-id="211">
  <div class="label"><span>Brand</span></div>
  ...
</div>
```

### Mapping

| Storefront | Database |
| --- | --- |
| `data-group-id` | `attributes.id` (filter group) |
| checkbox `value="{id}"` | `attribute_options.id` |
| Which groups show on a category | `category_attributes` |
| Product tagged with options | `product_attribute_values` |

### Filter semantics (same as StarTech)

- **Within one attribute group → OR**  
  Example: Brand = Lenovo **OR** HP
- **Across attribute groups → AND**  
  Example: Brand = Lenovo **AND** RAM = 16 GB
- Plus **price range** and **availability**

---

## 3. Category Tree Observed on Live Site

### Root categories

| Name | Slug |
| --- | --- |
| Desktop | `desktops` |
| Laptop | `laptop-notebook` |
| Component | `component` |
| Monitor | `monitor` |
| UPS | `ups` |
| Phone | `mobile-phone` |
| Tablet | `tablet-pc` |
| Office Equipment | `office-equipment` |
| Camera | `camera` |
| Security | `security-camera` |
| Networking | `networking` |
| Software | `software` |
| Server & Storage | `server-networking` |
| Accessories | `accessories` |
| Gadget | `gadget` |
| Gaming | `gaming` |
| TV | `tv` |
| Appliance | `appliance` |

### Example nesting

```
desktops
├── star-pc
├── gaming-pc
│   ├── intel-gaming-pc
│   └── amd-gaming-pc
├── brand-pc
│   ├── acer-desktop
│   ├── asus-desktop
│   └── ...
├── all-in-one-pc
└── portable-mini-pc

laptop-notebook
└── laptop
    ├── lenovo-laptop
    ├── msi-laptop
    └── ...

component
├── processor
├── graphics-card
├── motherboard
└── ...
```

Schema support: `categories` with `parent_id` + materialized `path` (e.g. `/desktops/gaming-pc/intel-gaming-pc`).

---

## 4. Filters Observed by Category

### Laptop (`/laptop-notebook`)

| Filter group | Example options |
| --- | --- |
| Price Range | slider |
| Availability | In Stock, Pre Order, Up Coming |
| Series | Consumer, Business, Gaming, Premium Ultrabook |
| Brand | Apple, Microsoft, HP, Dell, Lenovo, ASUS, Acer, MSI, … |
| Processor Type | Intel, AMD, Apple, Snapdragon |
| Processor Model | Core i5, Ryzen 7, Apple M4, Snapdragon X Elite, … |
| Generation/Series | 12th Gen, Ryzen 7000, Ryzen AI 300, … |
| Display Size | 14-inch, 15-inch, 16-inch, … |
| Display Type | LED, OLED |
| RAM Size | 8 / 12 / 16 / 24 / 32 / 64 GB |
| RAM Type | DDR4, DDR5 |
| SSD | 256 GB, 512 GB, 1 TB, 2 TB, … |
| Graphics | Integrated, Dedicated 4GB / 6GB / 8GB / … |
| Operating System | Free DOS, Windows, macOS |
| Special Features | Backlit Keyboard, Finger Print, Touch Screen, … |

### Processor (`/component/processor`)

| Filter group | Example options |
| --- | --- |
| Brand | Intel, AMD |
| Socket | LGA1700, LGA1851, AM4, AM5, … |
| Number of Core | 2–24 |
| Number of Thread | 4–32 |
| Clock Speed | Up to 2.4GHz, 3.5–3.90GHz, Above 5.1GHz, … |
| Cache | 2–6MB, 8–12MB, 32MB & Above, … |

### Monitor (`/monitor`)

| Filter group | Example options |
| --- | --- |
| Brand | MSI, AOC, BenQ, Asus, LG, Samsung, … |
| Screen Size | 15–17", 23–25", 31–40", … |
| Resolution | HD, FHD, 2K QHD, 4K UHD, 5K |
| Panel Type | TN, VA, IPS, OLED, Mini LED |
| Refresh Rate | 75 Hz … 540 Hz |
| Response Time | ≤ 0.5 ms, 1–4 ms, … |
| Input Type | HDMI, DisplayPort, USB-C, Thunderbolt, … |
| Features | FreeSync, G-Sync, Curved, Height Adjustable, … |

### Graphics Card (`/component/graphics-card`)

| Filter group | Example options |
| --- | --- |
| Brand | ZOTAC, MSI, GIGABYTE, ASUS, Sapphire, … |
| Chipset | NVIDIA GeForce, AMD Radeon, Intel Arc |
| Chipset Series | RTX 3000, RTX 5000, RX 7000, Arc B500, … |
| Memory | 1GB … 96GB+ |
| Memory Type | GDDR3 … GDDR7 |
| No of Fans | Single / Dual / Triple |
| Types Of Ports | HDMI, DisplayPort, … |
| No. of Ports | 2–5 Ports |

---

## 5. Product Detail Page (PDP) Fields

Example product: Microsoft Surface Laptop (`product_code` / Product Code `49982`)

### Listing / header fields

| Field | Example |
| --- | --- |
| Name | Microsoft 13" Surface Laptop Snapdragon X Plus … |
| Slug | `microsoft-13-inch-surface-laptop` |
| Price | 145,000৳ |
| Regular Price | 154,000৳ |
| Status | In Stock |
| Product Code | 49982 |
| Brand | Microsoft |
| Key Features | bullet list (CPU, RAM, Display, Features) |
| EMI | ~12,833৳/month |
| Images | gallery under `/image/cache/catalog/...` |

### Specification groups (PDP)

1. Processor  
2. Display  
3. Memory  
4. Storage  
5. Graphics  
6. Keyboard & TouchPad  
7. Camera & Audio  
8. Ports & Slots  
9. Network & Connectivity  
10. Security  
11. Software  
12. Power  
13. Physical Specification  
14. Other Features  
15. Warranty  

Example spec rows: Processor Brand, Processor Model, Display Size, RAM, RAM Type, Storage Capacity, Touch Screen, etc.

---

## 6. Recommended Entity Relationship (ER)

```
┌────────────┐       ┌──────────────────┐       ┌────────────┐
│   brands   │◄──────│    products      │──────►│ categories │
└─────┬──────┘       └────────┬─────────┘       └─────┬──────┘
      │                       │                       │
      │              ┌────────┴─────────┐             │
      │              │ product_images   │             │
      │              │ product_categories│◄────────────┘
      │              │ product_specs    │
      │              └──────────────────┘
      │
      ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ attribute_opts  │◄────│   attributes     │◄────│ category_attributes │
└────────┬────────┘     └────────┬─────────┘     └─────────────────────┘
         │                       │
         └──────────┬────────────┘
                    ▼
         ┌──────────────────────────┐
         │ product_attribute_values │  ← faceted search hot path
         └──────────────────────────┘
```

---

## 7. Drizzle Schema Tables

### 7.1 Enums (`enums.ts`)

| Enum | Values |
| --- | --- |
| `product_availability` | `in_stock`, `pre_order`, `up_coming`, `out_of_stock` |
| `product_condition` | `new`, `refurbished`, `used` |
| `attribute_input_type` | `multi_select`, `single_select`, `boolean`, `range` |
| `attribute_data_type` | `string`, `number`, `boolean` |
| `category_type` | `catalog`, `brand_landing`, `campaign`, `pc_builder_slot` |
| `offer_type` | `flash_sale`, `campaign`, `emi`, `bundle`, `coupon` |
| `media_kind` | `image`, `video`, `document` |

### 7.2 Brands (`brands`)

| Column | Notes |
| --- | --- |
| `id`, `name`, `slug` | Unique slug |
| `logo_url`, `description` | Optional |
| `is_active`, `is_featured`, `sort_order` | Merchandising |
| `meta_title`, `meta_description` | SEO |
| timestamps | `created_at`, `updated_at` |

Brand filter checkboxes also link via `attribute_options.brand_id`.

### 7.3 Categories (`categories`)

| Column | Notes |
| --- | --- |
| `parent_id` | Adjacency list tree |
| `path` | Materialized path for subtree queries |
| `depth`, `type` | Nesting + category kind |
| `min_price`, `max_price` | Cached range slider bounds |
| `product_count` | Cached count |
| `show_in_menu`, `is_featured` | Navigation |
| `seo_content` | Long category SEO HTML/text |

### 7.4 Products (`products`)

| Column | StarTech equivalent |
| --- | --- |
| `type` | `simple` or `variable` |
| `product_code` | Product Code (e.g. 49982) |
| `sku` | Internal SKU for **simple** only |
| `name`, `slug` | Title + URL |
| `brand_id` | Brand |
| `primary_category_id` | Breadcrumb / default context |
| `key_features` | JSONB string array (bullets) |
| `price`, `regular_price` | Integer BDT (`price` = min for variable) |
| `max_price` | Max variant price (variable only) |
| `availability` | Stock status enum |
| `stock_qty` | Inventory (sum cache for variable) |
| `earn_points` | Loyalty points |
| `warranty_text` / `warranty_months` | Warranty |
| `emi_monthly_amount` | EMI cache |
| `thumbnail_url`, `badges` | Card UI |
| `search_document` | Full-text search helper |
| `deleted_at` | Soft delete |

Also: `product_images` (optional `variant_id`), `product_categories`.

### 7.4b Product variants (`variants.ts`)

| Table | Role |
| --- | --- |
| `product_option_groups` | Axes on a variable product (Color, Storage, RAM) |
| `product_option_values` | Values (Black, 256GB) + optional facet link |
| `product_variants` | Sellable SKU: price, stock, sku, fingerprint |
| `product_variant_option_values` | Variant ↔ chosen option values |
| `product_variant_attribute_values` | Variant-level facet tags for search |

**Cart rule:** variable products must be purchased via `product_variants.id`.

Helper: `src/db/queries/sync-variant-caches.ts` refreshes parent min/max price + stock.

### 7.5 Dynamic filters (`attributes.ts`)

| Table | Role |
| --- | --- |
| `attributes` | Filter groups (`code`: `ram_size`, `socket`, …) |
| `attribute_options` | Checkbox values (`label`, `slug`, optional `brand_id`) |
| `category_attributes` | Which attributes appear on which category + order |
| `product_attribute_values` | Product ↔ option junction (facet index) |
| `product_numeric_attributes` | Numeric range facets (MHz, inches) |
| `category_facet_counts` | Cached sidebar option counts |

### 7.6 Specifications (`specifications.ts`)

| Table | Role |
| --- | --- |
| `specification_groups` | PDP sections (Processor, Display, …) |
| `specification_fields` | Rows inside a section; optional link to `attributes` |
| `product_specifications` | Product display values (`"16GB (Onboard)"`) |

### 7.7 Commerce extras (`commerce.ts`)

| Table | Role |
| --- | --- |
| `stores` | Physical branches / service centers |
| `store_inventory` | Per-store stock |
| `offers` / `offer_products` | Flash sales, campaigns |
| `pc_builder_slots` | CPU / GPU / RAM slots |
| `pc_builder_compatibility_rules` | Socket / chipset compatibility via attribute options |
| `product_reviews` | Ratings & reviews |
| `product_questions` | PDP Q&A |

---

## 8. Attribute Codes to Seed

### Shared

- `brand`
- Availability → prefer `products.availability` column (not EAV)

### Laptop

`series`, `brand`, `processor_type`, `processor_model`, `generation_series`, `display_size`, `display_type`, `ram_size`, `ram_type`, `ssd`, `graphics`, `operating_system`, `special_features`

### Processor

`brand`, `socket`, `core_count`, `thread_count`, `clock_speed`, `cache`

### Monitor

`brand`, `screen_size`, `resolution`, `panel_type`, `refresh_rate`, `response_time`, `input_type`, `monitor_features`

### Graphics Card

`brand`, `chipset`, `chipset_series`, `memory`, `memory_type`, `fan_count`, `port_types`, `port_count`

Source file: `src/db/seed/startech-catalog.ts`

---

## 9. Faceted Search Query Pattern

```sql
-- AND across groups, OR within group
SELECT product_id
FROM product_attribute_values
WHERE attribute_option_id IN (...selected option ids...)
GROUP BY product_id
HAVING COUNT(DISTINCT attribute_id) = :number_of_selected_groups;
```

Then join `products` + `product_categories` and apply:

- `price BETWEEN :min AND :max`
- `availability IN (...)`
- `is_active = true` and `deleted_at IS NULL`
- sort by price / default
- limit / offset

TypeScript helper: `src/db/queries/faceted-search.ts`

---

## 10. Production Indexing Notes

| Index | Why |
| --- | --- |
| `pav (attribute_option_id, product_id)` | Facet intersection |
| `products (is_active, availability, primary_category_id, price)` | Category listing |
| `product_categories (category_id)` | Browse by category |
| `products.price` | Sort + range |
| `category_facet_counts` | Fast sidebar counts (refresh via job) |
| GIN `to_tsvector(search_document \|\| name)` | Site search |

---

## 11. Project Layout

```
startech-schema/
├── drizzle.config.ts
├── package.json
├── README.md
├── STARTECH_SCHEMA.md          ← this file
├── src/db/
│   ├── client.ts
│   ├── schema/
│   │   ├── index.ts
│   │   ├── enums.ts
│   │   ├── brands.ts
│   │   ├── categories.ts
│   │   ├── products.ts
│   │   ├── product-categories.ts
│   │   ├── attributes.ts
│   │   ├── variants.ts              ← product variants / options
│   │   ├── specifications.ts
│   │   └── commerce.ts
│   ├── queries/
│   │   ├── faceted-search.ts
│   │   └── sync-variant-caches.ts
│   └── seed/
│       └── startech-catalog.ts
```

---

## 12. Setup Commands

```bash
cd "Typetech Projects/startech-schema"
bun install
cp .env.example .env
# set DATABASE_URL=postgresql://...

bun run db:generate
bun run db:migrate
# or quick local sync:
bun run db:push

bun run db:studio   # Drizzle Studio
bun run typecheck
```

---

## Design Decisions

1. **Hybrid brand model** — `brands` is first-class for pages/SEO; brand filters still go through `attribute_options` so all facets share one query path.
2. **EAV for filters, columns for hot fields** — price, availability, stock stay on `products` for speed; category-specific facets use attributes.
3. **Simple vs variable products** — `simple` sells from the product row; `variable` sells from `product_variants` with option groups; parent caches min price / total stock.
4. **Specs vs filters** — PDP specs can display free text; filter options stay normalized. Link via `specification_fields.attribute_id` when they should stay in sync.
5. **Cached facet counts** — avoid recounting every request; refresh `category_facet_counts` on catalog writes.
6. **Integer BDT prices** — matches StarTech display (`145000`), not fractional currency.
7. **Soft deletes** — `products.deleted_at` / `product_variants.deleted_at` for safe unpublish.

---

## 14. Out of Scope (Not Modeled in Detail)

These exist on the live site but were intentionally kept light or omitted so the catalog/filter core stays focused:

- Full checkout / orders / payments / shipping rates  
- User accounts, wishlist, cart persistence  
- CMS pages / blog  
- Home service / servicing tickets  
- Real-time inventory sync from ERP  

Those can be added as separate schema modules later.
