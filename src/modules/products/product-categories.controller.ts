import {
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { ProductsService } from './products.service';
import {
  AddProductCategoriesSchema,
  type AddProductCategoriesDto,
  ProductApiResponseSchema,
  type ProductApiResponse,
} from './schemas/products.schema';

@UseGuards(AuthGuard)
@Roles(['SUPER_ADMIN'])
@Controller('products')
export class ProductCategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  @Post(':id/categories')
  async addProductCategories(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(AddProductCategoriesSchema))
    body: AddProductCategoriesDto,
  ): Promise<ProductApiResponse> {
    const product = await this.productsService.addProductCategories(id, body);
    return ProductApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Product categories linked successfully',
        data: product,
        path: request.url,
      }),
    );
  }
}
