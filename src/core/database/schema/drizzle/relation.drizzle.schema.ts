import { relations } from 'drizzle-orm';
import { sessions, users } from './auth.drizzle.schema';

import { categories } from './category.drizzle.schema';
import { brands } from './brand.drizzle.schema';
import {
  attributes,
  attributeOptions,
  categoryAttributes,
  productAttributeValues,
} from './attribute.drizzle.schema';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));


export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent_category',
  }),
  children: many(categories, { relationName: 'parent_category' }),
  categoryAttributes: many(categoryAttributes),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  attributeOptions: many(attributeOptions),
}));

export const attributesRelations = relations(attributes, ({ many }) => ({
  options: many(attributeOptions),
  categoryAttributes: many(categoryAttributes),
  productValues: many(productAttributeValues),
}));

export const attributeOptionsRelations = relations(attributeOptions, ({ one, many }) => ({
  attribute: one(attributes, {
    fields: [attributeOptions.attributeId],
    references: [attributes.id],
  }),
  brand: one(brands, {
    fields: [attributeOptions.brandId],
    references: [brands.id],
  }),
  productValues: many(productAttributeValues),
}));

export const categoryAttributesRelations = relations(categoryAttributes, ({ one }) => ({
  category: one(categories, {
    fields: [categoryAttributes.categoryId],
    references: [categories.id],
  }),
  attribute: one(attributes, {
    fields: [categoryAttributes.attributeId],
    references: [attributes.id],
  }),
}));

export const productAttributeValuesRelations = relations(
  productAttributeValues,
  ({ one }) => ({
    // product: one(products, {
    //   fields: [productAttributeValues.productId],
    //   references: [products.id],
    // }), // TODO: Uncomment when products table is added
    attribute: one(attributes, {
      fields: [productAttributeValues.attributeId],
      references: [attributes.id],
    }),
    option: one(attributeOptions, {
      fields: [productAttributeValues.attributeOptionId],
      references: [attributeOptions.id],
    }),
  }),
);

