import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import schema from '../drizzle/drizzle.schema';

const HERO_SLIDE_SEEDS = [
  {
    title: 'Scratch & Win Dhamaka Offer',
    imageUrl: 'https://images.pexels.com/photos/7974/pexels-photo.jpg',
    linkUrl: '/offers/scratch-win',
    sortOrder: 0,
    altText: 'Scratch & Win Dhamaka Offer',
  },
  {
    title: 'Lenovo Laptop',
    imageUrl: 'https://images.pexels.com/photos/18105/pexels-photo.jpg',
    linkUrl: '/laptop-notebook',
    sortOrder: 1,
    altText: 'Lenovo laptop promotion',
  },
  {
    title: 'Washing Machine',
    imageUrl: 'https://images.pexels.com/photos/5591663/pexels-photo-5591663.jpeg',
    linkUrl: '/component',
    sortOrder: 2,
    altText: 'Washing machine promotion',
  },
  {
    title: 'Happy Hour',
    imageUrl: 'https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg',
    linkUrl: '/offers/happy-hour',
    sortOrder: 3,
    altText: 'Happy hour special deals',
  },
  {
    title: 'Galibs Tech App',
    imageUrl: 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg',
    linkUrl: '/',
    sortOrder: 4,
    altText: 'Download the Galibs Tech app',
  },
  {
    title: 'Lenovo AMD Laptop',
    imageUrl: 'https://images.pexels.com/photos/7974/pexels-photo.jpg',
    linkUrl: '/laptop-notebook',
    sortOrder: 5,
    altText: 'Lenovo AMD laptop promotion',
  },
] as const;

/**
 * Seeds promotional CMS content and sample offers after catalog data exists.
 */
export async function seedPromotionalData(
  database: NodePgDatabase<typeof schema>,
): Promise<void> {
  const existingHeroSlide = await database.query.heroSlides.findFirst();
  if (existingHeroSlide) {
    console.log('Promotional seed skipped: hero slides already exist.');
    return;
  }

  console.log('Seeding promotional content...');

  for (const slide of HERO_SLIDE_SEEDS) {
    await database.insert(schema.heroSlides).values({
      title: slide.title,
      imageUrl: slide.imageUrl,
      linkUrl: slide.linkUrl,
      sortOrder: slide.sortOrder,
      altText: slide.altText,
      isActive: true,
    });
  }

  const [happyHourOffer] = await database
    .insert(schema.offers)
    .values({
      name: 'Happy Hour Special Deals',
      slug: 'happy-hour',
      type: 'HAPPY_HOUR',
      description: 'Limited-time happy hour discounts on selected products.',
      showInPromotional: true,
      isActive: true,
      sortOrder: 0,
    })
    .returning();

  const products = await database.query.products.findMany({
    where: eq(schema.products.isActive, true),
    limit: 20,
    orderBy: (productsTable, { asc }) => [asc(productsTable.createdAt)],
  });

  for (const [index, product] of products.entries()) {
    await database
      .update(schema.products)
      .set({
        isFeatured: true,
        featuredSortOrder: index,
      })
      .where(eq(schema.products.id, product.id));
  }

  if (happyHourOffer && products.length > 0) {
    for (const [index, product] of products.slice(0, 8).entries()) {
      await database.insert(schema.offerProducts).values({
        offerId: happyHourOffer.id,
        productId: product.id,
        offerPrice:
          product.regularPrice && product.regularPrice > product.price
            ? product.price
            : Math.max(product.price - 500, 0),
        sortOrder: index,
      });
    }
  }

  console.log('Promotional content seeded successfully.');
}
