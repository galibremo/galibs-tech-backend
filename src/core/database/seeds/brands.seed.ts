import { brands } from '../schema/drizzle/brand.drizzle.schema';
import type { BrandRow, SeedDatabase } from './seed-helpers';

export async function seedBrands(
    database: SeedDatabase,
): Promise<Map<string, BrandRow>> {
    const rows = await database
        .insert(brands)
        .values([
            {
                name: 'ASUS',
                slug: 'asus',
                description: 'Laptops, motherboards, and components',
                isFeatured: true,
                sortOrder: 1,
            },
            {
                name: 'HP',
                slug: 'hp',
                description: 'Business and consumer PCs',
                isFeatured: true,
                sortOrder: 2,
            },
            {
                name: 'Dell',
                slug: 'dell',
                description: 'Desktops, laptops, and monitors',
                isFeatured: true,
                sortOrder: 3,
            },
            {
                name: 'Lenovo',
                slug: 'lenovo',
                description: 'ThinkPad and IdeaPad lines',
                isFeatured: true,
                sortOrder: 4,
            },
            {
                name: 'MSI',
                slug: 'msi',
                description: 'Gaming laptops, desktops, and components',
                isFeatured: true,
                sortOrder: 5,
            },
            {
                name: 'Acer',
                slug: 'acer',
                description: 'Value PCs and monitors',
                isFeatured: false,
                sortOrder: 6,
            },
            {
                name: 'Intel',
                slug: 'intel',
                description: 'Processors and NUCs',
                isFeatured: false,
                sortOrder: 7,
            },
            {
                name: 'AMD',
                slug: 'amd',
                description: 'Ryzen and Radeon products',
                isFeatured: false,
                sortOrder: 8,
            },
            {
                name: 'Gigabyte',
                slug: 'gigabyte',
                description: 'Motherboards, GPUs, and AORUS gear',
                isFeatured: false,
                sortOrder: 9,
            },
            {
                name: 'Corsair',
                slug: 'corsair',
                description: 'Memory, PSU, and peripherals',
                isFeatured: false,
                sortOrder: 10,
            },
            {
                name: 'Samsung',
                slug: 'samsung',
                description: 'Monitors, SSDs, and phones',
                isFeatured: true,
                sortOrder: 11,
            },
            {
                name: 'Apple',
                slug: 'apple',
                description: 'Mac and iPhone ecosystem',
                isFeatured: true,
                sortOrder: 12,
            },
            {
                name: 'TechCorp',
                slug: 'techcorp',
                description: 'House-brand smartphones and tablets',
                isFeatured: false,
                sortOrder: 13,
            },
            {
                name: 'SoundMax',
                slug: 'soundmax',
                description: 'Audio gadgets',
                isFeatured: false,
                sortOrder: 14,
            },
            {
                name: 'VoltGear',
                slug: 'voltgear',
                description: 'UPS and chargers',
                isFeatured: false,
                sortOrder: 15,
            },
        ])
        .returning();

    return new Map(
        rows.map((row) => [
            row.slug,
            { id: row.id, name: row.name, slug: row.slug },
        ]),
    );
}
