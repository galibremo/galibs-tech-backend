import {
    attributes,
    attributeOptions,
    categoryAttributes,
} from '../schema/drizzle/attribute.drizzle.schema';
import type {
    AttributeRow,
    AttrOptionRow,
    BrandRow,
    CategoryRow,
    SeedDatabase,
} from './seed-helpers';
import { optionMap } from './seed-helpers';

export type AttributesSeedResult = {
    attributes: Map<string, AttributeRow>;
    options: Map<string, AttrOptionRow>;
};

export async function seedAttributes(
    database: SeedDatabase,
    brands: Map<string, BrandRow>,
    categories: Map<string, CategoryRow>,
): Promise<AttributesSeedResult> {
    const attrRows = await database
        .insert(attributes)
        .values([
            {
                code: 'brand',
                name: 'Brand',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                isBrandAttribute: true,
                sortOrder: 1,
            },
            {
                code: 'color',
                name: 'Color',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 2,
            },
            {
                code: 'ram',
                name: 'RAM',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                unit: 'GB',
                isFilterable: true,
                sortOrder: 3,
            },
            {
                code: 'storage',
                name: 'Storage',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 4,
            },
            {
                code: 'processor_type',
                name: 'Processor Type',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 5,
            },
            {
                code: 'series',
                name: 'Series',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 6,
            },
            {
                code: 'display_size',
                name: 'Display Size',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 7,
            },
            {
                code: 'refresh_rate',
                name: 'Refresh Rate',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 8,
            },
            {
                code: 'panel_type',
                name: 'Panel Type',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 9,
            },
            {
                code: 'socket',
                name: 'Socket',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 10,
            },
            {
                code: 'chipset_series',
                name: 'Chipset Series',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 11,
            },
            {
                code: 'wattage',
                name: 'Wattage',
                inputType: 'MULTI_SELECT',
                dataType: 'STRING',
                isFilterable: true,
                sortOrder: 12,
            },
        ])
        .returning();

    const attrByCode = new Map(
        attrRows.map((row) => [
            row.code,
            { id: row.id, code: row.code, name: row.name },
        ]),
    );

    const getAttr = (code: string) => {
        const attr = attrByCode.get(code);
        if (!attr) {
            throw new Error(`Missing attribute: ${code}`);
        }
        return attr;
    };

    const brandAttr = getAttr('brand');
    const brandOptionValues = [
        'asus',
        'hp',
        'dell',
        'lenovo',
        'msi',
        'acer',
        'intel',
        'amd',
        'gigabyte',
        'corsair',
        'samsung',
        'apple',
        'techcorp',
        'soundmax',
        'voltgear',
        'benq',
        'kingston',
        'xiaomi',
    ].map((slug, index) => {
        const brand = brands.get(slug);
        if (!brand) {
            throw new Error(`Brand missing for option: ${slug}`);
        }
        return {
            attributeId: brandAttr.id,
            brandId: brand.id,
            label: brand.name,
            slug: `brand-${slug}`,
            sortOrder: index + 1,
        };
    });

    const brandOpts = await database
        .insert(attributeOptions)
        .values(brandOptionValues)
        .returning();

    const colorOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('color').id, label: 'Black', slug: 'color-black', sortOrder: 1 },
            { attributeId: getAttr('color').id, label: 'Blue', slug: 'color-blue', sortOrder: 2 },
            { attributeId: getAttr('color').id, label: 'Silver', slug: 'color-silver', sortOrder: 3 },
            { attributeId: getAttr('color').id, label: 'White', slug: 'color-white', sortOrder: 4 },
            { attributeId: getAttr('color').id, label: 'Titanium', slug: 'color-titanium', sortOrder: 5 },
            { attributeId: getAttr('color').id, label: 'Red', slug: 'color-red', sortOrder: 6 },
            // Unused — zero facet count
            {
                attributeId: getAttr('color').id,
                label: 'Rose Gold',
                slug: 'color-rose-gold',
                sortOrder: 7,
            },
        ])
        .returning();

    const ramOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('ram').id, label: '4GB', slug: 'ram-4gb', sortOrder: 1, sortValue: 4 },
            { attributeId: getAttr('ram').id, label: '8GB', slug: 'ram-8gb', sortOrder: 2, sortValue: 8 },
            { attributeId: getAttr('ram').id, label: '16GB', slug: 'ram-16gb', sortOrder: 3, sortValue: 16 },
            { attributeId: getAttr('ram').id, label: '32GB', slug: 'ram-32gb', sortOrder: 4, sortValue: 32 },
            { attributeId: getAttr('ram').id, label: '64GB', slug: 'ram-64gb', sortOrder: 5, sortValue: 64 },
            // Unused
            { attributeId: getAttr('ram').id, label: '128GB', slug: 'ram-128gb', sortOrder: 6, sortValue: 128 },
        ])
        .returning();

    const storageOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('storage').id, label: '128GB', slug: 'storage-128gb', sortOrder: 1, sortValue: 128 },
            { attributeId: getAttr('storage').id, label: '256GB', slug: 'storage-256gb', sortOrder: 2, sortValue: 256 },
            { attributeId: getAttr('storage').id, label: '512GB', slug: 'storage-512gb', sortOrder: 3, sortValue: 512 },
            { attributeId: getAttr('storage').id, label: '1TB', slug: 'storage-1tb', sortOrder: 4, sortValue: 1024 },
            { attributeId: getAttr('storage').id, label: '2TB', slug: 'storage-2tb', sortOrder: 5, sortValue: 2048 },
            // Unused
            { attributeId: getAttr('storage').id, label: '4TB', slug: 'storage-4tb', sortOrder: 6, sortValue: 4096 },
        ])
        .returning();

    const processorOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('processor_type').id, label: 'Intel', slug: 'cpu-intel', sortOrder: 1 },
            { attributeId: getAttr('processor_type').id, label: 'AMD', slug: 'cpu-amd', sortOrder: 2 },
            { attributeId: getAttr('processor_type').id, label: 'Apple', slug: 'cpu-apple', sortOrder: 3 },
        ])
        .returning();

    const seriesOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('series').id, label: 'Gaming', slug: 'series-gaming', sortOrder: 1 },
            { attributeId: getAttr('series').id, label: 'Business', slug: 'series-business', sortOrder: 2 },
            { attributeId: getAttr('series').id, label: 'Consumer', slug: 'series-consumer', sortOrder: 3 },
            { attributeId: getAttr('series').id, label: 'Ultrabook', slug: 'series-ultrabook', sortOrder: 4 },
        ])
        .returning();

    const displayOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('display_size').id, label: '14-inch', slug: 'display-14', sortOrder: 1 },
            { attributeId: getAttr('display_size').id, label: '15.6-inch', slug: 'display-156', sortOrder: 2 },
            { attributeId: getAttr('display_size').id, label: '16-inch', slug: 'display-16', sortOrder: 3 },
            { attributeId: getAttr('display_size').id, label: '24-inch', slug: 'display-24', sortOrder: 4 },
            { attributeId: getAttr('display_size').id, label: '27-inch', slug: 'display-27', sortOrder: 5 },
            { attributeId: getAttr('display_size').id, label: '32-inch', slug: 'display-32', sortOrder: 6 },
        ])
        .returning();

    const refreshOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('refresh_rate').id, label: '60Hz', slug: 'refresh-60', sortOrder: 1, sortValue: 60 },
            { attributeId: getAttr('refresh_rate').id, label: '75Hz', slug: 'refresh-75', sortOrder: 2, sortValue: 75 },
            { attributeId: getAttr('refresh_rate').id, label: '144Hz', slug: 'refresh-144', sortOrder: 3, sortValue: 144 },
            { attributeId: getAttr('refresh_rate').id, label: '165Hz', slug: 'refresh-165', sortOrder: 4, sortValue: 165 },
            { attributeId: getAttr('refresh_rate').id, label: '240Hz', slug: 'refresh-240', sortOrder: 5, sortValue: 240 },
        ])
        .returning();

    const panelOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('panel_type').id, label: 'IPS', slug: 'panel-ips', sortOrder: 1 },
            { attributeId: getAttr('panel_type').id, label: 'VA', slug: 'panel-va', sortOrder: 2 },
            { attributeId: getAttr('panel_type').id, label: 'TN', slug: 'panel-tn', sortOrder: 3 },
            { attributeId: getAttr('panel_type').id, label: 'OLED', slug: 'panel-oled', sortOrder: 4 },
        ])
        .returning();

    const socketOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('socket').id, label: 'LGA1700', slug: 'socket-lga1700', sortOrder: 1 },
            { attributeId: getAttr('socket').id, label: 'LGA1851', slug: 'socket-lga1851', sortOrder: 2 },
            { attributeId: getAttr('socket').id, label: 'AM4', slug: 'socket-am4', sortOrder: 3 },
            { attributeId: getAttr('socket').id, label: 'AM5', slug: 'socket-am5', sortOrder: 4 },
        ])
        .returning();

    const chipsetOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('chipset_series').id, label: 'RTX 4060', slug: 'gpu-rtx4060', sortOrder: 1 },
            { attributeId: getAttr('chipset_series').id, label: 'RTX 4070', slug: 'gpu-rtx4070', sortOrder: 2 },
            { attributeId: getAttr('chipset_series').id, label: 'RX 7600', slug: 'gpu-rx7600', sortOrder: 3 },
            { attributeId: getAttr('chipset_series').id, label: 'Arc B580', slug: 'gpu-arc-b580', sortOrder: 4 },
        ])
        .returning();

    const wattageOpts = await database
        .insert(attributeOptions)
        .values([
            { attributeId: getAttr('wattage').id, label: '550W', slug: 'watt-550', sortOrder: 1, sortValue: 550 },
            { attributeId: getAttr('wattage').id, label: '650W', slug: 'watt-650', sortOrder: 2, sortValue: 650 },
            { attributeId: getAttr('wattage').id, label: '750W', slug: 'watt-750', sortOrder: 3, sortValue: 750 },
            { attributeId: getAttr('wattage').id, label: '850W', slug: 'watt-850', sortOrder: 4, sortValue: 850 },
            { attributeId: getAttr('wattage').id, label: '1000VA', slug: 'watt-1000va', sortOrder: 5, sortValue: 1000 },
            { attributeId: getAttr('wattage').id, label: '1500VA', slug: 'watt-1500va', sortOrder: 6, sortValue: 1500 },
        ])
        .returning();

    const allOptions = optionMap([
        ...brandOpts,
        ...colorOpts,
        ...ramOpts,
        ...storageOpts,
        ...processorOpts,
        ...seriesOpts,
        ...displayOpts,
        ...refreshOpts,
        ...panelOpts,
        ...socketOpts,
        ...chipsetOpts,
        ...wattageOpts,
    ]);

    const cat = (slug: string) => {
        const category = categories.get(slug);
        if (!category) {
            throw new Error(`Missing category for attributes: ${slug}`);
        }
        return category.id;
    };

    const link = (
        categorySlug: string,
        attrCodes: string[],
    ): Array<{ categoryId: string; attributeId: string; sortOrder: number }> =>
        attrCodes.map((code, index) => ({
            categoryId: cat(categorySlug),
            attributeId: getAttr(code).id,
            sortOrder: index + 1,
        }));

    await database.insert(categoryAttributes).values([
        // Desktops
        ...link('intel-gaming-pc', ['brand', 'processor_type', 'ram', 'storage']),
        ...link('amd-gaming-pc', ['brand', 'processor_type', 'ram', 'storage']),
        ...link('brand-pc', ['brand', 'processor_type', 'ram', 'storage']),
        ...link('all-in-one-pc', ['brand', 'processor_type', 'ram', 'display_size']),
        // Laptops
        ...link('gaming-laptop', [
            'brand',
            'series',
            'processor_type',
            'ram',
            'storage',
            'display_size',
            'color',
        ]),
        ...link('ultrabook', [
            'brand',
            'series',
            'processor_type',
            'ram',
            'storage',
            'display_size',
            'color',
        ]),
        ...link('laptop-notebook', [
            'brand',
            'series',
            'processor_type',
            'ram',
            'storage',
            'display_size',
        ]),
        // Components
        ...link('processor', ['brand', 'processor_type', 'socket']),
        ...link('motherboard', ['brand', 'socket']),
        ...link('graphics-card', ['brand', 'chipset_series']),
        ...link('ram-desktop', ['brand', 'ram', 'color']),
        ...link('power-supply', ['brand', 'wattage']),
        ...link('ssd', ['brand', 'storage']),
        // Monitor / UPS / Phone / Tablet
        ...link('monitor', ['brand', 'display_size', 'refresh_rate', 'panel_type']),
        ...link('ups', ['brand', 'wattage']),
        ...link('mobile-phone', ['brand', 'color', 'ram', 'storage']),
        ...link('tablet-pc', ['brand', 'color', 'ram', 'storage', 'display_size']),
        // Accessories / Gadget
        ...link('chargers', ['brand', 'color']),
        ...link('laptop-bag', ['brand', 'color']),
        ...link('headphones', ['brand', 'color']),
        ...link('earbuds', ['brand', 'color']),
    ]);

    return {
        attributes: attrByCode,
        options: allOptions,
    };
}
