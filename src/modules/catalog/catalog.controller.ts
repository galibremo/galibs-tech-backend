import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CatalogService } from './catalog.service';
import {
  CatalogFiltersApiResponseSchema,
  type CatalogFiltersApiResponse,
  CatalogProductsApiResponseSchema,
  type CatalogProductsApiResponse,
  CatalogProductsQuerySchema,
  type CatalogProductsQueryDto,
} from './schemas/catalog.schema';

@Controller('categories')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':slug/filters')
  async getCategoryFilters(
    @Req() request: ExpressRequest,
    @Param('slug') slug: string,
  ): Promise<CatalogFiltersApiResponse> {
    const filters = await this.catalogService.getCategoryFilters(slug);
    return CatalogFiltersApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Category filters fetched successfully',
        data: filters,
        path: request.url,
      }),
    );
  }

  @Get(':slug/products')
  async getCategoryProducts(
    @Req() request: ExpressRequest,
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(CatalogProductsQuerySchema))
    query: CatalogProductsQueryDto,
  ): Promise<CatalogProductsApiResponse> {
    const products = await this.catalogService.getCategoryProducts(
      slug,
      query,
    );
    return CatalogProductsApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Category products fetched successfully',
        data: products,
        path: request.url,
      }),
    );
  }
}
