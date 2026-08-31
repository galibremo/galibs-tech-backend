import {
    specificationGroups,
    specificationFields,
    productSpecifications,
} from '../schema/drizzle/specification.drizzle.schema';
import { products as productsTable } from '../schema/drizzle/product.drizzle.schema';
import type { SeedDatabase } from './seed-helpers';

type SpecTarget = {
    code: string;
    cpuBrand: string;
    cpuModel: string;
    ram: string;
    storage: string;
    display?: string;
};

/**
 * Generates fallback/realistic specification values for any catalog product based on its code and name.
 */
function inferSpecsForProduct(productCode: string, name: string): SpecTarget {
    const lowerName = name.toLowerCase();
    const prefix = productCode.toUpperCase();

    // Desktops (DT-*)
    if (prefix.startsWith('DT-')) {
        const isIntel =
            lowerName.includes('intel') ||
            lowerName.includes('i5') ||
            lowerName.includes('i7') ||
            lowerName.includes('hp') ||
            lowerName.includes('dell');
        const isAio =
            prefix.startsWith('DT-AIO') ||
            lowerName.includes('all-in-one') ||
            lowerName.includes('aio');
        return {
            code: productCode,
            cpuBrand: isIntel ? 'Intel' : 'AMD',
            cpuModel: lowerName.includes('i7')
                ? 'Core i7-13700'
                : lowerName.includes('ryzen 7')
                  ? 'Ryzen 7 7700'
                  : isIntel
                    ? 'Core i5-13400'
                    : 'Ryzen 5 5600G',
            ram: lowerName.includes('32gb')
                ? '32GB DDR5'
                : lowerName.includes('8gb')
                  ? '8GB DDR4'
                  : '16GB DDR4',
            storage: lowerName.includes('1tb')
                ? '1TB NVMe SSD'
                : '512GB NVMe SSD',
            display: isAio
                ? lowerName.includes('27')
                    ? '27" FHD Display'
                    : '24" FHD Display'
                : 'N/A (Desktop Tower)',
        };
    }

    // Laptops (LP-*)
    if (prefix.startsWith('LP-')) {
        const isApple =
            lowerName.includes('macbook') || lowerName.includes('apple');
        const isIntel =
            lowerName.includes('intel') ||
            lowerName.includes('i5') ||
            lowerName.includes('i7') ||
            lowerName.includes('core');
        return {
            code: productCode,
            cpuBrand: isApple ? 'Apple' : isIntel ? 'Intel' : 'AMD',
            cpuModel: isApple
                ? 'Apple M3'
                : lowerName.includes('i7')
                  ? 'Core i7-13700H'
                  : lowerName.includes('ryzen 7')
                    ? 'Ryzen 7 7735HS'
                    : isIntel
                      ? 'Core i5-13420H'
                      : 'Ryzen 5 7535HS',
            ram: lowerName.includes('32gb')
                ? '32GB DDR5'
                : lowerName.includes('8gb')
                  ? '8GB DDR4'
                  : '16GB LPDDR5',
            storage: lowerName.includes('1tb')
                ? '1TB NVMe SSD'
                : lowerName.includes('256gb')
                  ? '256GB SSD'
                  : '512GB NVMe SSD',
            display: lowerName.includes('16')
                ? '16" WQXGA 165Hz'
                : lowerName.includes('14')
                  ? '14" FHD IPS'
                  : '15.6" FHD 144Hz',
        };
    }

    // Components (CP-*)
    if (prefix.startsWith('CP-CPU')) {
        const isIntel =
            lowerName.includes('intel') ||
            lowerName.includes('i5') ||
            lowerName.includes('i7') ||
            lowerName.includes('i3') ||
            lowerName.includes('i9');
        return {
            code: productCode,
            cpuBrand: isIntel ? 'Intel' : 'AMD',
            cpuModel: name,
            ram: 'N/A (Processor)',
            storage: 'N/A (Processor)',
            display: 'N/A',
        };
    }
    if (prefix.startsWith('CP-MB')) {
        const isIntel =
            lowerName.includes('b760') ||
            lowerName.includes('z790') ||
            lowerName.includes('h610') ||
            lowerName.includes('lga');
        return {
            code: productCode,
            cpuBrand: isIntel ? 'Intel (LGA1700)' : 'AMD (AM5)',
            cpuModel: lowerName.includes('b760')
                ? 'Intel B760 Chipset'
                : lowerName.includes('b650')
                  ? 'AMD B650 Chipset'
                  : 'Motherboard Chipset',
            ram: 'Up to 128GB DDR5',
            storage: 'M.2 NVMe & SATA3 supported',
            display: 'HDMI / DisplayPort output',
        };
    }
    if (prefix.startsWith('CP-GPU')) {
        const isNvidia =
            lowerName.includes('rtx') ||
            lowerName.includes('gtx') ||
            lowerName.includes('nvidia');
        return {
            code: productCode,
            cpuBrand: isNvidia ? 'NVIDIA' : 'AMD',
            cpuModel: name,
            ram: lowerName.includes('12gb')
                ? '12GB GDDR6'
                : lowerName.includes('16gb')
                  ? '16GB GDDR6'
                  : '8GB GDDR6',
            storage: 'PCIe 4.0 x16 Interface',
            display: '3x DisplayPort, 1x HDMI',
        };
    }
    if (prefix.startsWith('CP-RAM')) {
        return {
            code: productCode,
            cpuBrand: 'N/A',
            cpuModel: 'N/A',
            ram: lowerName.includes('32gb')
                ? '32GB (2x16GB) DDR5'
                : lowerName.includes('8gb')
                  ? '8GB DDR4'
                  : '16GB (2x8GB) DDR4',
            storage: 'N/A',
            display: 'N/A',
        };
    }
    if (prefix.startsWith('CP-SSD')) {
        return {
            code: productCode,
            cpuBrand: 'N/A',
            cpuModel: 'N/A',
            ram: 'N/A',
            storage: lowerName.includes('2tb')
                ? '2TB NVMe PCIe 4.0 SSD'
                : lowerName.includes('512gb')
                  ? '512GB NVMe SSD'
                  : '1TB NVMe PCIe 4.0 SSD',
            display: 'N/A',
        };
    }
    if (prefix.startsWith('CP-PSU') || prefix.startsWith('CP-CASE')) {
        return {
            code: productCode,
            cpuBrand: 'N/A',
            cpuModel: 'N/A',
            ram: 'N/A',
            storage: 'N/A',
            display: 'N/A',
        };
    }

    // Monitors (MN-*)
    if (prefix.startsWith('MN-')) {
        return {
            code: productCode,
            cpuBrand: 'N/A',
            cpuModel: 'N/A',
            ram: 'N/A',
            storage: 'N/A',
            display: lowerName.includes('27')
                ? '27" QHD IPS / OLED'
                : lowerName.includes('32')
                  ? '32" 4K UHD'
                  : '24" FHD 144Hz',
        };
    }

    // Phones (PH-*)
    if (prefix.startsWith('PH-')) {
        const isApple =
            lowerName.includes('iphone') || lowerName.includes('apple');
        const isSamsung =
            lowerName.includes('galaxy') || lowerName.includes('samsung');
        const isXiaomi =
            lowerName.includes('xiaomi') || lowerName.includes('redmi');
        return {
            code: productCode,
            cpuBrand: isApple
                ? 'Apple'
                : isSamsung
                  ? 'Exynos / Snapdragon'
                  : isXiaomi
                    ? 'MediaTek / Snapdragon'
                    : 'Qualcomm',
            cpuModel: isApple
                ? 'A17 Pro / Bionic'
                : isSamsung
                  ? 'Snapdragon 8 Gen 3'
                  : 'Dimensity 8200 / Snapdragon',
            ram: lowerName.includes('12gb')
                ? '12GB'
                : lowerName.includes('16gb')
                  ? '16GB'
                  : '8GB',
            storage: lowerName.includes('512gb')
                ? '512GB UFS'
                : lowerName.includes('128gb')
                  ? '128GB UFS'
                  : '256GB UFS',
            display:
                lowerName.includes('pro max') || lowerName.includes('ultra')
                    ? '6.8" AMOLED 120Hz'
                    : '6.67" AMOLED 120Hz',
        };
    }

    // Tablets (TB-*)
    if (prefix.startsWith('TB-')) {
        const isApple =
            lowerName.includes('ipad') || lowerName.includes('apple');
        return {
            code: productCode,
            cpuBrand: isApple
                ? 'Apple'
                : lowerName.includes('galaxy')
                  ? 'Samsung'
                  : 'MediaTek',
            cpuModel: isApple ? 'Apple M2 / A14' : 'Snapdragon / Exynos',
            ram: lowerName.includes('8gb') ? '8GB' : '6GB',
            storage: lowerName.includes('256gb') ? '256GB' : '128GB',
            display: lowerName.includes('12')
                ? '12.4" Super AMOLED'
                : '10.9" Liquid Retina',
        };
    }

    // UPS (UP-*)
    if (prefix.startsWith('UP-')) {
        return {
            code: productCode,
            cpuBrand: 'N/A',
            cpuModel: 'Power Backup Unit',
            ram: 'N/A',
            storage: 'N/A',
            display: lowerName.includes('lcd')
                ? 'Digital LCD Display'
                : 'LED Indicator',
        };
    }

    // Default Fallback for Accessories / Gadgets / Others
    return {
        code: productCode,
        cpuBrand: 'N/A',
        cpuModel: 'Standard Specs',
        ram: 'N/A',
        storage: 'N/A',
        display: 'N/A',
    };
}

/**
 * Seeds PDP specification groups/fields for all catalog products.
 */
export async function seedSpecifications(
    database: SeedDatabase,
    productsMap?: Map<string, { id: string; name: string; productCode: string }>,
): Promise<void> {
    const existingGroups = await database.select().from(specificationGroups);
    let groupProcessor = existingGroups.find((g) => g.name === 'Processor');
    let groupMemory = existingGroups.find((g) => g.name === 'Memory');
    let groupDisplay = existingGroups.find((g) => g.name === 'Display');

    if (!groupProcessor || !groupMemory || !groupDisplay) {
        const groupsToInsert: Array<typeof specificationGroups.$inferInsert> = [];
        if (!groupProcessor) groupsToInsert.push({ name: 'Processor', sortOrder: 1 });
        if (!groupMemory) groupsToInsert.push({ name: 'Memory', sortOrder: 2 });
        if (!groupDisplay) groupsToInsert.push({ name: 'Display', sortOrder: 3 });

        const insertedGroups = await database
            .insert(specificationGroups)
            .values(groupsToInsert)
            .returning();

        groupProcessor = groupProcessor ?? insertedGroups.find((g) => g.name === 'Processor');
        groupMemory = groupMemory ?? insertedGroups.find((g) => g.name === 'Memory');
        groupDisplay = groupDisplay ?? insertedGroups.find((g) => g.name === 'Display');
    }

    const existingFields = await database.select().from(specificationFields);
    let fieldCpuBrand = existingFields.find((f) => f.name === 'Processor Brand');
    let fieldCpuModel = existingFields.find((f) => f.name === 'Processor Model');
    let fieldRam = existingFields.find((f) => f.name === 'RAM');
    let fieldStorage = existingFields.find((f) => f.name === 'Storage');
    let fieldScreen = existingFields.find((f) => f.name === 'Screen Size');

    if (!fieldCpuBrand || !fieldCpuModel || !fieldRam || !fieldStorage || !fieldScreen) {
        const fieldsToInsert: Array<typeof specificationFields.$inferInsert> = [];
        if (!fieldCpuBrand) fieldsToInsert.push({ groupId: groupProcessor!.id, name: 'Processor Brand', sortOrder: 1 });
        if (!fieldCpuModel) fieldsToInsert.push({ groupId: groupProcessor!.id, name: 'Processor Model', sortOrder: 2 });
        if (!fieldRam) fieldsToInsert.push({ groupId: groupMemory!.id, name: 'RAM', sortOrder: 1 });
        if (!fieldStorage) fieldsToInsert.push({ groupId: groupMemory!.id, name: 'Storage', sortOrder: 2 });
        if (!fieldScreen) fieldsToInsert.push({ groupId: groupDisplay!.id, name: 'Screen Size', sortOrder: 1 });

        const insertedFields = await database
            .insert(specificationFields)
            .values(fieldsToInsert)
            .returning();

        fieldCpuBrand = fieldCpuBrand ?? insertedFields.find((f) => f.name === 'Processor Brand');
        fieldCpuModel = fieldCpuModel ?? insertedFields.find((f) => f.name === 'Processor Model');
        fieldRam = fieldRam ?? insertedFields.find((f) => f.name === 'RAM');
        fieldStorage = fieldStorage ?? insertedFields.find((f) => f.name === 'Storage');
        fieldScreen = fieldScreen ?? insertedFields.find((f) => f.name === 'Screen Size');
    }

    if (!productsMap || productsMap.size === 0) {
        const allProducts = await database.select().from(productsTable);
        productsMap = new Map(
            allProducts.map((p) => [
                p.productCode,
                { id: p.id, name: p.name, productCode: p.productCode },
            ]),
        );
    }

    const explicitTargets: SpecTarget[] = [
        {
            code: 'DT-GM-001',
            cpuBrand: 'Intel',
            cpuModel: 'Core i5-14400F',
            ram: 'Up to 32GB DDR5',
            storage: 'Up to 1TB NVMe',
            display: 'N/A (tower)',
        },
        {
            code: 'DT-BR-001',
            cpuBrand: 'Intel',
            cpuModel: 'Core i3-13100',
            ram: '8GB DDR4',
            storage: '512GB NVMe SSD',
            display: 'N/A (tower)',
        },
        {
            code: 'DT-BR-002',
            cpuBrand: 'Intel',
            cpuModel: 'Core i5-13400',
            ram: '16GB DDR4',
            storage: '512GB NVMe SSD',
            display: 'N/A (tower)',
        },
        {
            code: 'DT-BR-003',
            cpuBrand: 'AMD',
            cpuModel: 'Ryzen 5 5500',
            ram: '8GB DDR4',
            storage: '256GB NVMe SSD',
            display: 'N/A (tower)',
        },
        {
            code: 'DT-BR-004',
            cpuBrand: 'Intel',
            cpuModel: 'Core i3-12100',
            ram: '8GB DDR4',
            storage: '256GB NVMe SSD',
            display: 'N/A (tower)',
        },
        {
            code: 'DT-BR-005',
            cpuBrand: 'Intel',
            cpuModel: 'Core i5-13400',
            ram: '16GB DDR4',
            storage: '512GB NVMe SSD',
            display: 'N/A (tower)',
        },
        {
            code: 'DT-BR-006',
            cpuBrand: 'Intel',
            cpuModel: 'Core i5-13500',
            ram: '16GB DDR4',
            storage: '512GB NVMe SSD',
            display: 'N/A (tower)',
        },
        {
            code: 'DT-BR-007',
            cpuBrand: 'Intel',
            cpuModel: 'Core i7-13700',
            ram: '32GB DDR5',
            storage: '1TB NVMe SSD',
            display: 'N/A (tower)',
        },
        {
            code: 'LP-GM-001',
            cpuBrand: 'AMD',
            cpuModel: 'Ryzen 7 7735HS',
            ram: 'Up to 32GB DDR5',
            storage: '512GB NVMe',
            display: '15.6" 144Hz',
        },
        {
            code: 'LP-UB-001',
            cpuBrand: 'Intel',
            cpuModel: 'Core Ultra 7',
            ram: 'Up to 32GB LPDDR5x',
            storage: 'Up to 1TB SSD',
            display: '14" OLED',
        },
        {
            code: 'PH-001',
            cpuBrand: 'Qualcomm',
            cpuModel: 'Snapdragon 8 Gen 2',
            ram: 'Up to 16GB',
            storage: '256GB UFS',
            display: '6.7"',
        },
        {
            code: 'PH-002',
            cpuBrand: 'MediaTek',
            cpuModel: 'Dimensity 7020',
            ram: 'Up to 8GB',
            storage: '128GB',
            display: '6.5"',
        },
        {
            code: 'PH-003',
            cpuBrand: 'Samsung',
            cpuModel: 'Exynos / Snapdragon',
            ram: 'Up to 16GB',
            storage: 'Up to 512GB',
            display: '6.8"',
        },
        {
            code: 'TB-001',
            cpuBrand: 'Samsung',
            cpuModel: 'Exynos 1380',
            ram: '8GB',
            storage: 'Up to 256GB',
            display: '10.9"',
        },
        {
            code: 'CP-CPU-002',
            cpuBrand: 'AMD',
            cpuModel: 'Ryzen 7 7700',
            ram: 'N/A',
            storage: 'N/A',
            display: 'N/A',
        },
        {
            code: 'MN-008',
            cpuBrand: 'N/A',
            cpuModel: 'N/A',
            ram: 'N/A',
            storage: 'N/A',
            display: '27" OLED 240Hz',
        },
        {
            code: 'DT-GM-002',
            cpuBrand: 'AMD',
            cpuModel: 'Ryzen 7 7700',
            ram: 'Up to 32GB DDR5',
            storage: 'Up to 1TB NVMe',
            display: 'N/A (tower)',
        },
        {
            code: 'LP-GM-004',
            cpuBrand: 'Intel',
            cpuModel: 'Core i5-12500H',
            ram: '16GB DDR4',
            storage: '512GB NVMe',
            display: '15.6" 144Hz',
        },
        {
            code: 'LP-UB-004',
            cpuBrand: 'AMD',
            cpuModel: 'Ryzen AI 7',
            ram: '16GB LPDDR5x',
            storage: '512GB SSD',
            display: '14" OLED',
        },
        {
            code: 'PH-011',
            cpuBrand: 'MediaTek',
            cpuModel: 'Dimensity 6080',
            ram: '8GB',
            storage: '128GB',
            display: '6.67"',
        },
        {
            code: 'PH-012',
            cpuBrand: 'MediaTek',
            cpuModel: 'Dimensity 8200 Ultra',
            ram: '16GB',
            storage: '256GB',
            display: '6.67"',
        },
        {
            code: 'TB-006',
            cpuBrand: 'Snapdragon',
            cpuModel: '870',
            ram: '8GB',
            storage: '256GB',
            display: '11"',
        },
        {
            code: 'CP-CPU-003',
            cpuBrand: 'Intel',
            cpuModel: 'Core i7-14700K',
            ram: 'N/A',
            storage: 'N/A',
            display: 'N/A',
        },
        {
            code: 'MN-010',
            cpuBrand: 'N/A',
            cpuModel: 'N/A',
            ram: 'N/A',
            storage: 'N/A',
            display: '27" IPS 165Hz',
        },
    ];

    const targetMap = new Map(explicitTargets.map((t) => [t.code, t]));
    const rows: Array<{ productId: string; fieldId: string; value: string }> = [];

    for (const [code, product] of productsMap.entries()) {
        const target = targetMap.get(code) ?? inferSpecsForProduct(code, product.name);

        rows.push(
            {
                productId: product.id,
                fieldId: fieldCpuBrand!.id,
                value: target.cpuBrand,
            },
            {
                productId: product.id,
                fieldId: fieldCpuModel!.id,
                value: target.cpuModel,
            },
            { productId: product.id, fieldId: fieldRam!.id, value: target.ram },
            {
                productId: product.id,
                fieldId: fieldStorage!.id,
                value: target.storage,
            },
            {
                productId: product.id,
                fieldId: fieldScreen!.id,
                value: target.display ?? 'N/A',
            },
        );
    }

    if (rows.length > 0) {
        await database
            .insert(productSpecifications)
            .values(rows)
            .onConflictDoNothing();
    }
}

