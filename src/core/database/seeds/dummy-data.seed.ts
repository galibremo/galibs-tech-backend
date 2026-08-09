import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import schema from '../drizzle/drizzle.schema';
import { seedAttributes } from './attributes.seed';
import { seedBrands } from './brands.seed';
import { seedCategories } from './categories.seed';
import { seedProducts } from './products.seed';
import { seedSpecifications } from './specifications.seed';

/**
 * Seeds StarTech-style core PC shop dummy catalog for local testing.
 * Skips when any product already exists — wipe products (or reset DB) before re-running.
 */
export async function seedDummyData(
    database: NodePgDatabase<typeof schema>,
): Promise<void> {
    const existingProducts = await database.query.products.findFirst();
    if (existingProducts) {
        console.log('Dummy data seed skipped: Products already exist.');
        return;
    }

    console.log('Seeding StarTech-style core catalog...');

    const brands = await seedBrands(database);
    const categories = await seedCategories(database);
    const { options } = await seedAttributes(database, brands, categories);
    const products = await seedProducts(
        database,
        brands,
        categories,
        options,
    );
    await seedSpecifications(database, products);

    console.log('Dummy catalog seeded successfully.');
}
