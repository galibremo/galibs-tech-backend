import { eq } from 'drizzle-orm';

import {
    products,
    productImages,
} from '../schema/drizzle/product.drizzle.schema';
import type { SeedDatabase } from './seed-helpers';

type ProductRef = { id: string; name: string; productCode: string };

type ImageDomain =
    | 'desktop'
    | 'laptop'
    | 'component'
    | 'monitor'
    | 'ups'
    | 'phone'
    | 'tablet'
    | 'accessory';

/** Curated Pexels CDN URLs (w=800) for dummy catalog placeholders. */
const PEXELS_POOLS: Record<ImageDomain, string[]> = {
    desktop: [
        'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2399840/pexels-photo-2399840.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    laptop: [
        'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/7974/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/303383/pexels-photo-303383.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    component: [
        'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3520694/pexels-photo-3520694.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/4709285/pexels-photo-4709285.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    monitor: [
        'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/572056/pexels-photo-572056.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    ups: [
        'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    phone: [
        'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    tablet: [
        'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1334598/pexels-photo-1334598.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/5082579/pexels-photo-5082579.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/265667/pexels-photo-265667.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    accessory: [
        'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1037999/pexels-photo-1037999.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
};

function domainForProductCode(productCode: string): ImageDomain {
    const prefix = productCode.split('-')[0] ?? '';
    switch (prefix) {
        case 'DT':
            return 'desktop';
        case 'LP':
            return 'laptop';
        case 'CP':
            return 'component';
        case 'MN':
            return 'monitor';
        case 'UP':
            return 'ups';
        case 'PH':
            return 'phone';
        case 'TB':
            return 'tablet';
        case 'AC':
        case 'GD':
            return 'accessory';
        default:
            return 'accessory';
    }
}

/**
 * Picks 2–3 image URLs from the domain pool, rotated by product index.
 */
function pickGalleryUrls(
    domain: ImageDomain,
    productIndex: number,
): string[] {
    const pool = PEXELS_POOLS[domain];
    const gallerySize = 2 + (productIndex % 2); // 2 or 3
    const urls: string[] = [];
    for (let offset = 0; offset < gallerySize; offset += 1) {
        urls.push(pool[(productIndex + offset) % pool.length]);
    }
    return urls;
}

/**
 * Sets thumbnailUrl and inserts product_images gallery rows for every product.
 */
export async function seedProductImages(
    database: SeedDatabase,
    productMap: Map<string, ProductRef>,
): Promise<void> {
    const productList = [...productMap.values()];
    const imageRows: Array<{
        productId: string;
        url: string;
        altText: string;
        sortOrder: number;
        isPrimary: boolean;
    }> = [];

    for (let index = 0; index < productList.length; index += 1) {
        const product = productList[index];
        const domain = domainForProductCode(product.productCode);
        const urls = pickGalleryUrls(domain, index);
        const primaryUrl = urls[0];

        await database
            .update(products)
            .set({ thumbnailUrl: primaryUrl })
            .where(eq(products.id, product.id));

        for (let sortOrder = 0; sortOrder < urls.length; sortOrder += 1) {
            imageRows.push({
                productId: product.id,
                url: urls[sortOrder],
                altText: `${product.name} photo ${sortOrder + 1}`,
                sortOrder,
                isPrimary: sortOrder === 0,
            });
        }
    }

    if (imageRows.length > 0) {
        await database.insert(productImages).values(imageRows);
    }

    console.log(
        `Product images seeded: ${imageRows.length} gallery rows for ${productList.length} products.`,
    );
}
