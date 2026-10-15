import { z } from 'zod';

import { createApiResponseSchema } from '../../../core/validators/api-response.schema';
import {
  validateBoolean,
  validateEmail,
  validateEnum,
  validateString,
} from '../../../core/validators/common.schema';

export const NEWSLETTER_STATUSES = ['SUBSCRIBED', 'UNSUBSCRIBED'] as const;

export const SubscribeNewsletterSchema = z.object({
  email: validateEmail,
  /** Where the signup came from, e.g. "home_footer". */
  source: validateString('Source', { max: 64 }).optional(),
});

export const NewsletterSubscribeResponseSchema = z.object({
  email: validateEmail,
  status: validateEnum('Status', NEWSLETTER_STATUSES),
  /** False when the address was already subscribed. */
  isNew: validateBoolean('Is New'),
});

export const NewsletterSubscribeApiResponseSchema = createApiResponseSchema(
  NewsletterSubscribeResponseSchema,
);

export type SubscribeNewsletterDto = z.infer<typeof SubscribeNewsletterSchema>;
export type NewsletterSubscribeResponse = z.infer<
  typeof NewsletterSubscribeResponseSchema
>;
export type NewsletterSubscribeApiResponse = z.infer<
  typeof NewsletterSubscribeApiResponseSchema
>;
