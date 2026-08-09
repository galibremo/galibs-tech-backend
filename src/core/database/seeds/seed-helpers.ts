import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import schema from '../drizzle/drizzle.schema';
import {
    productVariants,
    productOptionGroups,
    productOptionValues,
    productVariantOptionValues,
    productVariantAttributeValues,
} from '../schema/drizzle/variant.drizzle.schema';

export type SeedDatabase = NodePgDatabase<typeof schema>;

export type StockStatus =
    | 'IN_STOCK'
    | 'OUT_OF_STOCK'
    | 'LOW_STOCK'
    | 'PRE_ORDER'
    | 'UPCOMING';

export type AttrOptionRow = {
    id: string;
    attributeId: string;
    label: string;
    slug: string;
};

export type OptionAxisValue = {
    label: string;
    slug: string;
    attributeOption: AttrOptionRow;
};

export type OptionAxis = {
    code: string;
    name: string;
    sortOrder: number;
    values: OptionAxisValue[];
};

export type VariantCombo = {
    /** One value slug per axis, in axis order */
    valueSlugs: string[];
    price: number;
    stockQty: number;
    availability?: StockStatus;
    isDefault?: boolean;
    regularPrice?: number;
};

export type BrandRow = {
    id: string;
    name: string;
    slug: string;
};

export type CategoryRow = {
    id: string;
    name: string;
    slug: string;
    path: string;
};

export type AttributeRow = {
    id: string;
    code: string;
    name: string;
};

export type CatalogContext = {
    brands: Map<string, BrandRow>;
    categories: Map<string, CategoryRow>;
    attributes: Map<string, AttributeRow>;
    options: Map<string, AttrOptionRow>;
    products: Map<string, { id: string; name: string; productCode: string }>;
};

export function optionMap(rows: AttrOptionRow[]): Map<string, AttrOptionRow> {
    return new Map(rows.map((row) => [row.slug, row]));
}

export function requireOption(
    map: Map<string, AttrOptionRow>,
    slug: string,
): AttrOptionRow {
    const option = map.get(slug);
    if (!option) {
        throw new Error(`Missing attribute option: ${slug}`);
    }
    return option;
}

export function requireBrand(
    brands: Map<string, BrandRow>,
    slug: string,
): BrandRow {
    const brand = brands.get(slug);
    if (!brand) {
        throw new Error(`Missing brand: ${slug}`);
    }
    return brand;
}

export function requireCategory(
    categories: Map<string, CategoryRow>,
    slug: string,
): CategoryRow {
    const category = categories.get(slug);
    if (!category) {
        throw new Error(`Missing category: ${slug}`);
    }
    return category;
}

/**
 * Inserts option groups/values and a (possibly sparse) variant matrix for a VARIABLE product.
 * Links each variant to option values and filterable attribute options.
 */
export async function seedVariantMatrix(
    database: SeedDatabase,
    product: { id: string; name: string; productCode: string },
    axes: OptionAxis[],
    combos: VariantCombo[],
): Promise<void> {
    const groups = await database
        .insert(productOptionGroups)
        .values(
            axes.map((axis) => ({
                productId: product.id,
                name: axis.name,
                code: axis.code,
                sortOrder: axis.sortOrder,
            })),
        )
        .returning();

    const groupByCode = new Map(groups.map((group) => [group.code, group]));

    const optionValueRows = await database
        .insert(productOptionValues)
        .values(
            axes.flatMap((axis) => {
                const group = groupByCode.get(axis.code);
                if (!group) {
                    throw new Error(`Missing option group: ${axis.code}`);
                }
                return axis.values.map((value, index) => ({
                    groupId: group.id,
                    label: value.label,
                    slug: value.slug,
                    attributeOptionId: value.attributeOption.id,
                    sortOrder: index + 1,
                }));
            }),
        )
        .returning();

    const optionValueBySlug = new Map(
        optionValueRows.map((row) => [row.slug, row]),
    );
    const axisValueBySlug = new Map(
        axes.flatMap((axis) =>
            axis.values.map((value) => [value.slug, value] as const),
        ),
    );

    const variantRows = await database
        .insert(productVariants)
        .values(
            combos.map((combo, index) => {
                const labels = combo.valueSlugs.map((slug) => {
                    const axisValue = axisValueBySlug.get(slug);
                    if (!axisValue) {
                        throw new Error(`Unknown option slug: ${slug}`);
                    }
                    return axisValue.label;
                });
                const skuSuffix = combo.valueSlugs
                    .map((slug) => slug.replace(/^[a-z]+-/, '').toUpperCase())
                    .join('-');
                return {
                    productId: product.id,
                    sku: `${product.productCode}-${skuSuffix}`,
                    title: `${product.name} - ${labels.join(', ')}`,
                    fingerprint: combo.valueSlugs.join('|'),
                    price: combo.price,
                    regularPrice: combo.regularPrice ?? null,
                    stockQty: combo.stockQty,
                    availability: combo.availability ?? 'IN_STOCK',
                    isDefault: combo.isDefault ?? index === 0,
                };
            }),
        )
        .returning();

    const variantOptionLinks: Array<{
        variantId: string;
        optionValueId: string;
    }> = [];
    const variantAttrLinks: Array<{
        variantId: string;
        attributeId: string;
        attributeOptionId: string;
    }> = [];

    for (let index = 0; index < combos.length; index += 1) {
        const combo = combos[index];
        const variant = variantRows[index];
        for (const slug of combo.valueSlugs) {
            const optionValue = optionValueBySlug.get(slug);
            const axisValue = axisValueBySlug.get(slug);
            if (!optionValue || !axisValue) {
                throw new Error(`Missing option mapping for slug: ${slug}`);
            }
            variantOptionLinks.push({
                variantId: variant.id,
                optionValueId: optionValue.id,
            });
            variantAttrLinks.push({
                variantId: variant.id,
                attributeId: axisValue.attributeOption.attributeId,
                attributeOptionId: axisValue.attributeOption.id,
            });
        }
    }

    await database.insert(productVariantOptionValues).values(variantOptionLinks);
    await database
        .insert(productVariantAttributeValues)
        .values(variantAttrLinks);
}
