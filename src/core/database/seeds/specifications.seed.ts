import {
    specificationGroups,
    specificationFields,
    productSpecifications,
} from '../schema/drizzle/specification.drizzle.schema';
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
 * Seeds PDP specification groups/fields for key catalog products.
 */
export async function seedSpecifications(
    database: SeedDatabase,
    products: Map<string, { id: string; name: string; productCode: string }>,
): Promise<void> {
    const [groupProcessor, groupMemory, groupDisplay] = await database
        .insert(specificationGroups)
        .values([
            { name: 'Processor', sortOrder: 1 },
            { name: 'Memory', sortOrder: 2 },
            { name: 'Display', sortOrder: 3 },
        ])
        .returning();

    const [fieldCpuBrand, fieldCpuModel, fieldRam, fieldStorage, fieldScreen] =
        await database
            .insert(specificationFields)
            .values([
                { groupId: groupProcessor.id, name: 'Processor Brand', sortOrder: 1 },
                { groupId: groupProcessor.id, name: 'Processor Model', sortOrder: 2 },
                { groupId: groupMemory.id, name: 'RAM', sortOrder: 1 },
                { groupId: groupMemory.id, name: 'Storage', sortOrder: 2 },
                { groupId: groupDisplay.id, name: 'Screen Size', sortOrder: 1 },
            ])
            .returning();

    const targets: SpecTarget[] = [
        {
            code: 'DT-GM-001',
            cpuBrand: 'Intel',
            cpuModel: 'Core i5-14400F',
            ram: 'Up to 32GB DDR5',
            storage: 'Up to 1TB NVMe',
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

    const rows: Array<{ productId: string; fieldId: string; value: string }> =
        [];

    for (const target of targets) {
        const product = products.get(target.code);
        if (!product) {
            continue;
        }
        rows.push(
            {
                productId: product.id,
                fieldId: fieldCpuBrand.id,
                value: target.cpuBrand,
            },
            {
                productId: product.id,
                fieldId: fieldCpuModel.id,
                value: target.cpuModel,
            },
            { productId: product.id, fieldId: fieldRam.id, value: target.ram },
            {
                productId: product.id,
                fieldId: fieldStorage.id,
                value: target.storage,
            },
            {
                productId: product.id,
                fieldId: fieldScreen.id,
                value: target.display ?? 'N/A',
            },
        );
    }

    if (rows.length > 0) {
        await database.insert(productSpecifications).values(rows);
    }
}
