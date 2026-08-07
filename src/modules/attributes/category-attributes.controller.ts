import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { AttributesService } from './attributes.service';
import {
  AssignCategoryAttributeSchema,
  type AssignCategoryAttributeDto,
  CategoryAttributeApiResponseSchema,
  type CategoryAttributeApiResponse,
  CategoryFiltersApiResponseSchema,
  type CategoryFiltersApiResponse,
  UpdateCategoryAttributeSchema,
  type UpdateCategoryAttributeDto,
} from './schemas/attributes.schema';

@Controller('categories')
export class CategoryAttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  // Static `id/` segment so slug-based Catalog `/:slug/filters` can coexist
  @Get('id/:categoryId/filters')
  async getCategoryFilters(
    @Req() request: ExpressRequest,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<CategoryFiltersApiResponse> {
    const filters =
      await this.attributesService.getCategoryFilters(categoryId);
    return CategoryFiltersApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Category filters fetched successfully',
        data: filters,
        path: request.url,
      }),
    );
  }

  @Post(':categoryId/attributes')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async assignCategoryAttribute(
    @Req() request: ExpressRequest,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body(new ZodValidationPipe(AssignCategoryAttributeSchema))
    body: AssignCategoryAttributeDto,
  ): Promise<CategoryAttributeApiResponse> {
    const assignment = await this.attributesService.assignCategoryAttribute(
      categoryId,
      body,
    );
    return CategoryAttributeApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Attribute assigned to category successfully',
        data: assignment,
        path: request.url,
      }),
    );
  }

  @Patch(':categoryId/attributes/:attributeId')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updateCategoryAttribute(
    @Req() request: ExpressRequest,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Body(new ZodValidationPipe(UpdateCategoryAttributeSchema))
    body: UpdateCategoryAttributeDto,
  ): Promise<CategoryAttributeApiResponse> {
    const assignment = await this.attributesService.updateCategoryAttribute(
      categoryId,
      attributeId,
      body,
    );
    return CategoryAttributeApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Category attribute updated successfully',
        data: assignment,
        path: request.url,
      }),
    );
  }
}
