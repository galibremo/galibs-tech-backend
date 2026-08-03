import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { ProductsService } from './products.service';
import {
  DeleteProductAttributeApiResponseSchema,
  type DeleteProductAttributeApiResponse,
  ProductAttributeOptionsSchema,
  type ProductAttributeOptionsDto,
  ProductAttributesApiResponseSchema,
  type ProductAttributesApiResponse,
} from './schemas/products.schema';

@Controller('products')
export class ProductAttributesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id/attributes')
  async getProductAttributes(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<ProductAttributesApiResponse> {
    const attributes = await this.productsService.getProductAttributes(id);
    return ProductAttributesApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Product attributes fetched successfully',
        data: attributes,
        path: request.url,
      }),
    );
  }

  @Put(':id/attributes')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async replaceProductAttributes(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(ProductAttributeOptionsSchema))
    body: ProductAttributeOptionsDto,
  ): Promise<ProductAttributesApiResponse> {
    const attributes = await this.productsService.replaceProductAttributes(
      id,
      body,
    );
    return ProductAttributesApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Product attributes replaced successfully',
        data: attributes,
        path: request.url,
      }),
    );
  }

  @Post(':id/attributes')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async addProductAttributes(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(ProductAttributeOptionsSchema))
    body: ProductAttributeOptionsDto,
  ): Promise<ProductAttributesApiResponse> {
    const attributes = await this.productsService.addProductAttributes(
      id,
      body,
    );
    return ProductAttributesApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Product attributes added successfully',
        data: attributes,
        path: request.url,
      }),
    );
  }

  @Delete(':id/attributes/:optionId')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async removeProductAttribute(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('optionId', ParseUUIDPipe) optionId: string,
    @Req() request: ExpressRequest,
  ): Promise<DeleteProductAttributeApiResponse> {
    const result = await this.productsService.removeProductAttribute(
      id,
      optionId,
    );
    return DeleteProductAttributeApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Product attribute removed successfully',
        data: result,
        path: request.url,
      }),
    );
  }
}
