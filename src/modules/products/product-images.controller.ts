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
  AddProductImageSchema,
  type AddProductImageDto,
  ProductImageApiResponseSchema,
  type ProductImageApiResponse,
} from './schemas/products.schema';

@Controller('products')
export class ProductImagesController {
  constructor(private readonly productsService: ProductsService) {}

  @Post(':id/images')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async addProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(AddProductImageSchema))
    body: AddProductImageDto,
  ): Promise<ProductImageApiResponse> {
    const image = await this.productsService.addProductImage(id, body);
    return ProductImageApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Product image added successfully',
        data: image,
        path: request.url,
      }),
    );
  }
}
