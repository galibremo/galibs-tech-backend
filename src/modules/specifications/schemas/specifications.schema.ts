import { z } from 'zod';
import {
  validateString,
  validateNumber,
  validateUUID,
} from '../../../core/validators/common.schema';

export const CreateSpecGroupSchema = z.object({
  name: validateString('Name', { max: 120 }),
  sortOrder: validateNumber('Sort Order').optional().default(0),
});

export const CreateSpecFieldSchema = z.object({
  name: validateString('Name', { max: 120 }),
  sortOrder: validateNumber('Sort Order').optional().default(0),
});

export const UpsertProductSpecsSchema = z.object({
  specs: z.array(
    z.object({
      fieldId: validateUUID('Field ID'),
      value: validateString('Value'),
    }),
  ),
});

export type CreateSpecGroupDto = z.infer<typeof CreateSpecGroupSchema>;
export type CreateSpecFieldDto = z.infer<typeof CreateSpecFieldSchema>;
export type UpsertProductSpecsDto = z.infer<typeof UpsertProductSpecsSchema>;
