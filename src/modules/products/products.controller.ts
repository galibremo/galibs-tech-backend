import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { ProductsService } from './products.service';
import {
  CreateProductSchema,
  type CreateProductDto,
  DeleteProductApiResponseSchema,
  type DeleteProductApiResponse,
  ProductApiResponseSchema,
  type ProductApiResponse,
  FeaturedProductListApiResponseSchema,
  type FeaturedProductListApiResponse,
  ProductListApiResponseSchema,
  type ProductListApiResponse,
  ProductsListQuerySchema,
  type ProductsListQueryDto,
  UpdateProductSchema,
  type UpdateProductDto,
  type ProductResponse,
} from './schemas/products.schema';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async listProducts(
    @Req() request: ExpressRequest,
    @Query(new ZodValidationPipe(ProductsListQuerySchema))
    query: ProductsListQueryDto,
  ): Promise<ProductListApiResponse | FeaturedProductListApiResponse> {
    const products = await this.productsService.listProducts(query);
    const schema = query.featured
      ? FeaturedProductListApiResponseSchema
      : ProductListApiResponseSchema;

    return schema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: query.featured
          ? 'Featured products fetched successfully'
          : 'Products fetched successfully',
        data: products,
        path: request.url,
      }),
    );
  }

  @Get(':slug')
  async getProductBySlug(
    @Req() request: ExpressRequest,
    @Param('slug') slug: string,
  ): Promise<ProductApiResponse> {
    const product = await this.productsService.getProductBySlug(slug);
    return this.productResponse(
      HttpStatus.OK,
      'Product fetched successfully',
      product,
      request.url,
    );
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createProduct(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateProductSchema)) body: CreateProductDto,
  ): Promise<ProductApiResponse> {
    const product = await this.productsService.createProduct(body);
    return this.productResponse(
      HttpStatus.CREATED,
      'Product created successfully',
      product,
      request.url,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdateProductSchema)) body: UpdateProductDto,
  ): Promise<ProductApiResponse> {
    const product = await this.productsService.updateProduct(id, body);
    return this.productResponse(
      HttpStatus.OK,
      'Product updated successfully',
      product,
      request.url,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async deleteProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<DeleteProductApiResponse> {
    const result = await this.productsService.deleteProduct(id);
    return DeleteProductApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Product deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  private productResponse(
    statusCode: HttpStatus,
    message: string,
    product: ProductResponse,
    path: string,
  ): ProductApiResponse {
    return ProductApiResponseSchema.parse(
      createApiResponse({
        statusCode,
        message,
        data: product,
        path,
      }),
    );
  }
}
