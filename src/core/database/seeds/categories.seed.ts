import { categories } from '../schema/drizzle/category.drizzle.schema';
import type { CategoryRow, SeedDatabase } from './seed-helpers';

export async function seedCategories(
    database: SeedDatabase,
): Promise<Map<string, CategoryRow>> {
    const roots = await database
        .insert(categories)
        .values([
            {
                name: 'Desktop',
                slug: 'desktops',
                path: 'desktops',
                depth: 0,
                sortOrder: 1,
                isFeatured: true,
            },
            {
                name: 'Laptop',
                slug: 'laptop-notebook',
                path: 'laptop-notebook',
                depth: 0,
                sortOrder: 2,
                isFeatured: true,
            },
            {
                name: 'Component',
                slug: 'component',
                path: 'component',
                depth: 0,
                sortOrder: 3,
                isFeatured: true,
            },
            {
                name: 'Monitor',
                slug: 'monitor',
                path: 'monitor',
                depth: 0,
                sortOrder: 4,
                isFeatured: true,
            },
            {
                name: 'UPS',
                slug: 'ups',
                path: 'ups',
                depth: 0,
                sortOrder: 5,
            },
            {
                name: 'Phone',
                slug: 'mobile-phone',
                path: 'mobile-phone',
                depth: 0,
                sortOrder: 6,
                isFeatured: true,
            },
            {
                name: 'Tablet',
                slug: 'tablet-pc',
                path: 'tablet-pc',
                depth: 0,
                sortOrder: 7,
            },
            {
                name: 'Accessories',
                slug: 'accessories',
                path: 'accessories',
                depth: 0,
                sortOrder: 8,
            },
            {
                name: 'Gadget',
                slug: 'gadget',
                path: 'gadget',
                depth: 0,
                sortOrder: 9,
            },
        ])
        .returning();

    const bySlug = new Map(roots.map((row) => [row.slug, row]));
    const desktops = bySlug.get('desktops')!;
    const laptops = bySlug.get('laptop-notebook')!;
    const component = bySlug.get('component')!;
    const accessories = bySlug.get('accessories')!;
    const gadget = bySlug.get('gadget')!;

    const mid = await database
        .insert(categories)
        .values([
            {
                name: 'Gaming PC',
                slug: 'gaming-pc',
                path: 'desktops/gaming-pc',
                depth: 1,
                parentId: desktops.id,
                sortOrder: 1,
                isFeatured: true,
            },
            {
                name: 'Brand PC',
                slug: 'brand-pc',
                path: 'desktops/brand-pc',
                depth: 1,
                parentId: desktops.id,
                sortOrder: 2,
            },
            {
                name: 'All-in-One PC',
                slug: 'all-in-one-pc',
                path: 'desktops/all-in-one-pc',
                depth: 1,
                parentId: desktops.id,
                sortOrder: 3,
            },
            {
                name: 'Gaming Laptop',
                slug: 'gaming-laptop',
                path: 'laptop-notebook/gaming-laptop',
                depth: 1,
                parentId: laptops.id,
                sortOrder: 1,
                isFeatured: true,
            },
            {
                name: 'Premium Ultrabook',
                slug: 'ultrabook',
                path: 'laptop-notebook/ultrabook',
                depth: 1,
                parentId: laptops.id,
                sortOrder: 2,
            },
            {
                name: 'Processor',
                slug: 'processor',
                path: 'component/processor',
                depth: 1,
                parentId: component.id,
                sortOrder: 1,
            },
            {
                name: 'Motherboard',
                slug: 'motherboard',
                path: 'component/motherboard',
                depth: 1,
                parentId: component.id,
                sortOrder: 2,
            },
            {
                name: 'Graphics Card',
                slug: 'graphics-card',
                path: 'component/graphics-card',
                depth: 1,
                parentId: component.id,
                sortOrder: 3,
            },
            {
                name: 'RAM (Desktop)',
                slug: 'ram-desktop',
                path: 'component/ram-desktop',
                depth: 1,
                parentId: component.id,
                sortOrder: 4,
            },
            {
                name: 'Power Supply',
                slug: 'power-supply',
                path: 'component/power-supply',
                depth: 1,
                parentId: component.id,
                sortOrder: 5,
            },
            {
                name: 'SSD',
                slug: 'ssd',
                path: 'component/ssd',
                depth: 1,
                parentId: component.id,
                sortOrder: 6,
            },
            {
                name: 'Chargers',
                slug: 'chargers',
                path: 'accessories/chargers',
                depth: 1,
                parentId: accessories.id,
                sortOrder: 1,
            },
            {
                name: 'Laptop Bag',
                slug: 'laptop-bag',
                path: 'accessories/laptop-bag',
                depth: 1,
                parentId: accessories.id,
                sortOrder: 2,
            },
            {
                name: 'Headphones',
                slug: 'headphones',
                path: 'gadget/headphones',
                depth: 1,
                parentId: gadget.id,
                sortOrder: 1,
            },
            {
                name: 'Earbuds',
                slug: 'earbuds',
                path: 'gadget/earbuds',
                depth: 1,
                parentId: gadget.id,
                sortOrder: 2,
            },
        ])
        .returning();

    for (const row of mid) {
        bySlug.set(row.slug, row);
    }

    const gamingPc = bySlug.get('gaming-pc')!;
    const leaves = await database
        .insert(categories)
        .values([
            {
                name: 'Intel Gaming PC',
                slug: 'intel-gaming-pc',
                path: 'desktops/gaming-pc/intel-gaming-pc',
                depth: 2,
                parentId: gamingPc.id,
                sortOrder: 1,
            },
            {
                name: 'AMD Gaming PC',
                slug: 'amd-gaming-pc',
                path: 'desktops/gaming-pc/amd-gaming-pc',
                depth: 2,
                parentId: gamingPc.id,
                sortOrder: 2,
            },
        ])
        .returning();

    for (const row of leaves) {
        bySlug.set(row.slug, row);
    }

    const result = new Map<string, CategoryRow>();
    for (const [slug, row] of bySlug) {
        result.set(slug, {
            id: row.id,
            name: row.name,
            slug: row.slug,
            path: row.path,
        });
    }
    return result;
}
