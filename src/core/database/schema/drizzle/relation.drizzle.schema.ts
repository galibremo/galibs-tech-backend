import { relations } from 'drizzle-orm';
import { sessions, users } from './auth.drizzle.schema';

import { categories } from './category.drizzle.schema';
import { brands } from './brand.drizzle.schema';
import {
  attributes,
  attributeOptions,
  categoryAttributes,
  productAttributeValues,
  productNumericAttributes,
} from './attribute.drizzle.schema';
import {
  productCategories,
  productImages,
  products,
} from './product.drizzle.schema';
import {
  productOptionGroups,
  productOptionValues,
  productVariantAttributeValues,
  productVariantOptionValues,
  productVariants,
} from './variant.drizzle.schema';
import {
  specificationGroups,
  specificationFields,
  productSpecifications,
} from './specification.drizzle.schema';
import {
  carts,
  cartItems,
  wishlists,
  wishlistItems,
  orders,
  orderItems,
  payments,
} from './commerce.drizzle.schema';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  carts: many(carts),
  wishlists: many(wishlists),
  orders: many(orders),
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
  productCategories: many(productCategories),
  primaryProducts: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  attributeOptions: many(attributeOptions),
  products: many(products),
}));

export const attributesRelations = relations(attributes, ({ many }) => ({
  options: many(attributeOptions),
  categoryAttributes: many(categoryAttributes),
  productValues: many(productAttributeValues),
  productNumericValues: many(productNumericAttributes),
  variantAttributeValues: many(productVariantAttributeValues),
}));

export const attributeOptionsRelations = relations(
  attributeOptions,
  ({ one, many }) => ({
    attribute: one(attributes, {
      fields: [attributeOptions.attributeId],
      references: [attributes.id],
    }),
    brand: one(brands, {
      fields: [attributeOptions.brandId],
      references: [brands.id],
    }),
    productValues: many(productAttributeValues),
    optionValues: many(productOptionValues),
    variantAttributeValues: many(productVariantAttributeValues),
  }),
);

export const categoryAttributesRelations = relations(
  categoryAttributes,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoryAttributes.categoryId],
      references: [categories.id],
    }),
    attribute: one(attributes, {
      fields: [categoryAttributes.attributeId],
      references: [attributes.id],
    }),
  }),
);

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  primaryCategory: one(categories, {
    fields: [products.primaryCategoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  categories: many(productCategories),
  optionGroups: many(productOptionGroups),
  variants: many(productVariants),
  attributeValues: many(productAttributeValues),
  numericAttributes: many(productNumericAttributes),
  specifications: many(productSpecifications),
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const productAttributeValuesRelations = relations(
  productAttributeValues,
  ({ one }) => ({
    product: one(products, {
      fields: [productAttributeValues.productId],
      references: [products.id],
    }),
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

export const productNumericAttributesRelations = relations(
  productNumericAttributes,
  ({ one }) => ({
    product: one(products, {
      fields: [productNumericAttributes.productId],
      references: [products.id],
    }),
    attribute: one(attributes, {
      fields: [productNumericAttributes.attributeId],
      references: [attributes.id],
    }),
  }),
);

export const productOptionGroupsRelations = relations(
  productOptionGroups,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productOptionGroups.productId],
      references: [products.id],
    }),
    values: many(productOptionValues),
  }),
);

export const productOptionValuesRelations = relations(
  productOptionValues,
  ({ one, many }) => ({
    group: one(productOptionGroups, {
      fields: [productOptionValues.groupId],
      references: [productOptionGroups.id],
    }),
    attributeOption: one(attributeOptions, {
      fields: [productOptionValues.attributeOptionId],
      references: [attributeOptions.id],
    }),
    variantLinks: many(productVariantOptionValues),
  }),
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    optionValues: many(productVariantOptionValues),
    attributeValues: many(productVariantAttributeValues),
    images: many(productImages),
    cartItems: many(cartItems),
    wishlistItems: many(wishlistItems),
    orderItems: many(orderItems),
  }),
);

export const productVariantOptionValuesRelations = relations(
  productVariantOptionValues,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [productVariantOptionValues.variantId],
      references: [productVariants.id],
    }),
    optionValue: one(productOptionValues, {
      fields: [productVariantOptionValues.optionValueId],
      references: [productOptionValues.id],
    }),
  }),
);

export const productVariantAttributeValuesRelations = relations(
  productVariantAttributeValues,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [productVariantAttributeValues.variantId],
      references: [productVariants.id],
    }),
    attribute: one(attributes, {
      fields: [productVariantAttributeValues.attributeId],
      references: [attributes.id],
    }),
    option: one(attributeOptions, {
      fields: [productVariantAttributeValues.attributeOptionId],
      references: [attributeOptions.id],
    }),
  }),
);

export const specificationGroupsRelations = relations(
  specificationGroups,
  ({ many }) => ({
    fields: many(specificationFields),
  }),
);

export const specificationFieldsRelations = relations(
  specificationFields,
  ({ one, many }) => ({
    group: one(specificationGroups, {
      fields: [specificationFields.groupId],
      references: [specificationGroups.id],
    }),
    productSpecifications: many(productSpecifications),
  }),
);

export const productSpecificationsRelations = relations(
  productSpecifications,
  ({ one }) => ({
    product: one(products, {
      fields: [productSpecifications.productId],
      references: [products.id],
    }),
    field: one(specificationFields, {
      fields: [productSpecifications.fieldId],
      references: [specificationFields.id],
    }),
  }),
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  items: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  wishlist: one(wishlists, {
    fields: [wishlistItems.wishlistId],
    references: [wishlists.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [wishlistItems.variantId],
    references: [productVariants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
