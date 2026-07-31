import { z } from 'zod';
import { validateString } from '../../../core/validators/common.schema';

export const GenerateSlugSchema = z
  .object({
    text: validateString('Text', { max: 500 }),
  })
  .strict();

export const GenerateSlugResponseSchema = z.object({
  slug: validateString('Slug'),
});

export type GenerateSlugDto = z.infer<typeof GenerateSlugSchema>;
export type GenerateSlugResponse = z.infer<typeof GenerateSlugResponseSchema>;
