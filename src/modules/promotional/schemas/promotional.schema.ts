import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateBoolean,
  validateDate,
  validateNumber,
  validateString,
  validateUUID,
} from '../../../core/validators/common.schema';

export const LINK_TARGETS = ['_self', '_blank'] as const;

export const CreateHeroSlideSchema = z
  .object({
    title: validateString('Title', { max: 255 }).nullable().optional(),
    subtitle: validateString('Subtitle').nullable().optional(),
    imageUrl: validateString('Image URL'),
    mobileImageUrl: validateString('Mobile Image URL').nullable().optional(),
    linkUrl: validateString('Link URL').nullable().optional(),
    linkTarget: z.enum(LINK_TARGETS).optional().default('_self'),
    altText: validateString('Alt Text', { max: 255 }).nullable().optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
    isActive: validateBoolean('Is Active').optional().default(true),
    startsAt: validateDate('Starts At').nullable().optional(),
    endsAt: validateDate('Ends At').nullable().optional(),
  })
  .strict();

export const UpdateHeroSlideSchema = CreateHeroSlideSchema.partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const HeroSlideResponseSchema = z.object({
  id: validateUUID('Hero Slide ID'),
  title: validateString('Title').nullable(),
  subtitle: validateString('Subtitle').nullable(),
  imageUrl: validateString('Image URL'),
  mobileImageUrl: validateString('Mobile Image URL').nullable(),
  linkUrl: validateString('Link URL').nullable(),
  linkTarget: z.enum(LINK_TARGETS),
  altText: validateString('Alt Text').nullable(),
  sortOrder: validateNumber('Sort Order'),
  isActive: validateBoolean('Is Active'),
  startsAt: validateDate('Starts At').nullable(),
  endsAt: validateDate('Ends At').nullable(),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const CreatePromoNavLinkSchema = z
  .object({
    label: validateString('Label', { max: 100 }),
    sublabel: validateString('Sublabel', { max: 100 }).nullable().optional(),
    icon: validateString('Icon', { max: 50 }).nullable().optional(),
    linkUrl: validateString('Link URL'),
    badge: validateString('Badge', { max: 50 }).nullable().optional(),
    sortOrder: validateNumber('Sort Order', { int: true }).optional().default(0),
    isActive: validateBoolean('Is Active').optional().default(true),
    offerId: validateUUID('Offer ID').nullable().optional(),
  })
  .strict();

export const UpdatePromoNavLinkSchema = CreatePromoNavLinkSchema.partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const PromoNavLinkResponseSchema = z.object({
  id: validateUUID('Promo Nav Link ID'),
  label: validateString('Label'),
  sublabel: validateString('Sublabel').nullable(),
  icon: validateString('Icon').nullable(),
  linkUrl: validateString('Link URL'),
  badge: validateString('Badge').nullable(),
  sortOrder: validateNumber('Sort Order'),
  isActive: validateBoolean('Is Active'),
  offerId: validateUUID('Offer ID').nullable(),
  createdAt: validateDate('Created At'),
  updatedAt: validateDate('Updated At'),
});

export const PromotionalContentResponseSchema = z.object({
  heroSlides: z.array(HeroSlideResponseSchema),
  promoNavLinks: z.array(PromoNavLinkResponseSchema),
});

export const DeletePromotionalItemResponseSchema = z.object({
  deleted: z.boolean(),
});

export const HeroSlideApiResponseSchema = createApiResponseSchema(
  HeroSlideResponseSchema,
);
export const PromoNavLinkApiResponseSchema = createApiResponseSchema(
  PromoNavLinkResponseSchema,
);
export const PromotionalContentApiResponseSchema = createApiResponseSchema(
  PromotionalContentResponseSchema,
);
export const HeroSlidesListApiResponseSchema = createApiResponseSchema(
  z.array(HeroSlideResponseSchema),
);
export const PromoNavLinksListApiResponseSchema = createApiResponseSchema(
  z.array(PromoNavLinkResponseSchema),
);
export const DeletePromotionalItemApiResponseSchema = createApiResponseSchema(
  DeletePromotionalItemResponseSchema,
);

export type CreateHeroSlideDto = z.infer<typeof CreateHeroSlideSchema>;
export type UpdateHeroSlideDto = z.infer<typeof UpdateHeroSlideSchema>;
export type HeroSlideResponse = z.infer<typeof HeroSlideResponseSchema>;
export type CreatePromoNavLinkDto = z.infer<typeof CreatePromoNavLinkSchema>;
export type UpdatePromoNavLinkDto = z.infer<typeof UpdatePromoNavLinkSchema>;
export type PromoNavLinkResponse = z.infer<typeof PromoNavLinkResponseSchema>;
export type PromotionalContentResponse = z.infer<
  typeof PromotionalContentResponseSchema
>;
export type HeroSlideApiResponse = z.infer<typeof HeroSlideApiResponseSchema>;
export type PromoNavLinkApiResponse = z.infer<
  typeof PromoNavLinkApiResponseSchema
>;
export type PromotionalContentApiResponse = z.infer<
  typeof PromotionalContentApiResponseSchema
>;
export type HeroSlidesListApiResponse = z.infer<
  typeof HeroSlidesListApiResponseSchema
>;
export type PromoNavLinksListApiResponse = z.infer<
  typeof PromoNavLinksListApiResponseSchema
>;
export type DeletePromotionalItemResponse = z.infer<
  typeof DeletePromotionalItemResponseSchema
>;
export type DeletePromotionalItemApiResponse = z.infer<
  typeof DeletePromotionalItemApiResponseSchema
>;
