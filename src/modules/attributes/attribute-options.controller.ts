import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { AttributesService } from './attributes.service';
import {
  AttributeOptionApiResponseSchema,
  type AttributeOptionApiResponse,
  DeleteAttributeOptionApiResponseSchema,
  type DeleteAttributeOptionApiResponse,
  UpdateAttributeOptionSchema,
  type UpdateAttributeOptionDto,
} from './schemas/attributes.schema';

@Controller('attribute-options')
export class AttributeOptionsController {
  constructor(private readonly attributesService: AttributesService) {}

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updateOption(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdateAttributeOptionSchema))
    body: UpdateAttributeOptionDto,
  ): Promise<AttributeOptionApiResponse> {
    const option = await this.attributesService.updateOption(id, body);
    return AttributeOptionApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Attribute option updated successfully',
        data: option,
        path: request.url,
      }),
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async deleteOption(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<DeleteAttributeOptionApiResponse> {
    const result = await this.attributesService.deleteOption(id);
    return DeleteAttributeOptionApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Attribute option deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }
}
