import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import schema from '../drizzle/drizzle.schema';
import { brands } from '../schema/drizzle/brand.drizzle.schema';
import { categories } from '../schema/drizzle/category.drizzle.schema';
import {
    attributes,
    attributeOptions,
    productAttributeValues,
} from '../schema/drizzle/attribute.drizzle.schema';
import {
    products,
    productCategories,
} from '../schema/drizzle/product.drizzle.schema';
import {
    productVariants,
    productOptionGroups,
    productOptionValues,
    productVariantOptionValues,
    productVariantAttributeValues,
} from '../schema/drizzle/variant.drizzle.schema';

export async function seedDummyData(
    database: NodePgDatabase<typeof schema>,
): Promise<void> {
    const existingProducts = await database.query.products.findFirst();
    if (existingProducts) {
        console.log('Dummy data seed skipped: Products already exist.');
        return;
    }

    console.log('Seeding dummy data...');

    // 1. Brands
    const [brand1, brand2] = await database
        .insert(brands)
        .values([
            {
                name: 'TechCorp',
                slug: 'techcorp',
                description: 'TechCorp Electronics',
            },
            {
                name: 'SoundMax',
                slug: 'soundmax',
                description: 'Premium Audio',
            },
        ])
        .returning();

    // 2. Categories
    const [catElectronics, catAudio] = await database
        .insert(categories)
        .values([
            { name: 'Electronics', slug: 'electronics', path: 'electronics', depth: 0 },
            { name: 'Audio', slug: 'audio', path: 'audio', depth: 0 },
        ])
        .returning();

    const [catSmartphones, catHeadphones] = await database
        .insert(categories)
        .values([
            {
                name: 'Smartphones',
                slug: 'smartphones',
                path: 'electronics/smartphones',
                depth: 1,
                parentId: catElectronics.id,
            },
            {
                name: 'Headphones',
                slug: 'headphones',
                path: 'audio/headphones',
                depth: 1,
                parentId: catAudio.id,
            },
        ])
        .returning();

    // 3. Attributes
    const [attrColor, attrStorage] = await database
        .insert(attributes)
        .values([
            { code: 'color', name: 'Color', inputType: 'MULTI_SELECT', dataType: 'STRING' },
            { code: 'storage', name: 'Storage', inputType: 'MULTI_SELECT', dataType: 'STRING' },
        ])
        .returning();

    // 4. Attribute Options
    const [optRed, optBlue, optBlack, opt128, opt256] = await database
        .insert(attributeOptions)
        .values([
            { attributeId: attrColor.id, label: 'Red', slug: 'color-red' },
            { attributeId: attrColor.id, label: 'Blue', slug: 'color-blue' },
            { attributeId: attrColor.id, label: 'Black', slug: 'color-black' },
            { attributeId: attrStorage.id, label: '128GB', slug: 'storage-128gb' },
            { attributeId: attrStorage.id, label: '256GB', slug: 'storage-256gb' },
        ])
        .returning();

    // 5. Products
    const [prodPhone, prodHeadphone1, prodHeadphone2, prodPhone2] = await database
        .insert(products)
        .values([
            {
                type: 'VARIABLE',
                productCode: 'TC-PH-001',
                name: 'TechCorp ProPhone',
                slug: 'techcorp-prophone',
                brandId: brand1.id,
                primaryCategoryId: catSmartphones.id,
                price: 99900,
                stockQty: 50,
                earnPoints: 100,
            },
            {
                type: 'SIMPLE',
                productCode: 'SM-HP-001',
                name: 'SoundMax OverEar',
                slug: 'soundmax-overear',
                brandId: brand2.id,
                primaryCategoryId: catHeadphones.id,
                price: 19900,
                stockQty: 30,
                earnPoints: 20,
            },
            {
                type: 'SIMPLE',
                productCode: 'SM-EB-002',
                name: 'SoundMax EarBuds',
                slug: 'soundmax-earbuds',
                brandId: brand2.id,
                primaryCategoryId: catHeadphones.id,
                price: 9900,
                stockQty: 100,
                earnPoints: 10,
            },
            {
                type: 'VARIABLE',
                productCode: 'TC-PH-002',
                name: 'TechCorp LitePhone',
                slug: 'techcorp-litephone',
                brandId: brand1.id,
                primaryCategoryId: catSmartphones.id,
                price: 49900,
                stockQty: 40,
                earnPoints: 50,
            },
        ])
        .returning();

    // Categories linking
    await database.insert(productCategories).values([
        { productId: prodPhone.id, categoryId: catSmartphones.id, isPrimary: true },
        { productId: prodHeadphone1.id, categoryId: catHeadphones.id, isPrimary: true },
        { productId: prodHeadphone2.id, categoryId: catHeadphones.id, isPrimary: true },
        { productId: prodPhone2.id, categoryId: catSmartphones.id, isPrimary: true },
    ]);

    // Option Groups for Variable Product (ProPhone)
    const [groupColor, groupStorage] = await database
        .insert(productOptionGroups)
        .values([
            { productId: prodPhone.id, name: 'Color', code: 'color', sortOrder: 1 },
            { productId: prodPhone.id, name: 'Storage', code: 'storage', sortOrder: 2 },
        ])
        .returning();

    // Option Values for Variable Product
    const [valRed, valBlack, val128, val256] = await database
        .insert(productOptionValues)
        .values([
            { groupId: groupColor.id, label: 'Red', slug: 'opt-color-red', attributeOptionId: optRed.id },
            { groupId: groupColor.id, label: 'Black', slug: 'opt-color-black', attributeOptionId: optBlack.id },
            { groupId: groupStorage.id, label: '128GB', slug: 'opt-storage-128', attributeOptionId: opt128.id },
            { groupId: groupStorage.id, label: '256GB', slug: 'opt-storage-256', attributeOptionId: opt256.id },
        ])
        .returning();

    // Variants for ProPhone
    const [var1, var2, var3, var4] = await database
        .insert(productVariants)
        .values([
            { productId: prodPhone.id, sku: 'TC-PH-001-R-128', title: 'TechCorp ProPhone - Red, 128GB', fingerprint: 'color:red|storage:128gb', price: 99900, stockQty: 10, isDefault: true },
            { productId: prodPhone.id, sku: 'TC-PH-001-R-256', title: 'TechCorp ProPhone - Red, 256GB', fingerprint: 'color:red|storage:256gb', price: 109900, stockQty: 5, isDefault: false },
            { productId: prodPhone.id, sku: 'TC-PH-001-B-128', title: 'TechCorp ProPhone - Black, 128GB', fingerprint: 'color:black|storage:128gb', price: 99900, stockQty: 15, isDefault: false },
            { productId: prodPhone.id, sku: 'TC-PH-001-B-256', title: 'TechCorp ProPhone - Black, 256GB', fingerprint: 'color:black|storage:256gb', price: 109900, stockQty: 8, isDefault: false },
        ])
        .returning();

    // Link Variants to Option Values
    await database.insert(productVariantOptionValues).values([
        { variantId: var1.id, optionValueId: valRed.id },
        { variantId: var1.id, optionValueId: val128.id },
        { variantId: var2.id, optionValueId: valRed.id },
        { variantId: var2.id, optionValueId: val256.id },
        { variantId: var3.id, optionValueId: valBlack.id },
        { variantId: var3.id, optionValueId: val128.id },
        { variantId: var4.id, optionValueId: valBlack.id },
        { variantId: var4.id, optionValueId: val256.id },
    ]);

    // Product Attribute Values for filtering
    await database.insert(productAttributeValues).values([
        { productId: prodPhone.id, attributeId: attrColor.id, attributeOptionId: optRed.id },
        { productId: prodPhone.id, attributeId: attrColor.id, attributeOptionId: optBlack.id },
        { productId: prodPhone.id, attributeId: attrStorage.id, attributeOptionId: opt128.id },
        { productId: prodPhone.id, attributeId: attrStorage.id, attributeOptionId: opt256.id },

        // Assign single color to simple products
        { productId: prodHeadphone1.id, attributeId: attrColor.id, attributeOptionId: optBlack.id },
        { productId: prodHeadphone2.id, attributeId: attrColor.id, attributeOptionId: optBlue.id },
    ]);

    // Link Variants to Attribute Values for filtering on variant level
    await database.insert(productVariantAttributeValues).values([
        { variantId: var1.id, attributeId: attrColor.id, attributeOptionId: optRed.id },
        { variantId: var1.id, attributeId: attrStorage.id, attributeOptionId: opt128.id },
        { variantId: var2.id, attributeId: attrColor.id, attributeOptionId: optRed.id },
        { variantId: var2.id, attributeId: attrStorage.id, attributeOptionId: opt256.id },
        { variantId: var3.id, attributeId: attrColor.id, attributeOptionId: optBlack.id },
        { variantId: var3.id, attributeId: attrStorage.id, attributeOptionId: opt128.id },
        { variantId: var4.id, attributeId: attrColor.id, attributeOptionId: optBlack.id },
        { variantId: var4.id, attributeId: attrStorage.id, attributeOptionId: opt256.id },
    ]);

    console.log('Dummy data seeded successfully.');
}
