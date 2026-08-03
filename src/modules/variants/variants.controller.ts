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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import {
  CreateVariantSchema,
  type CreateVariantDto,
  DeleteVariantApiResponseSchema,
  type DeleteVariantApiResponse,
  SyncCacheApiResponseSchema,
  type SyncCacheApiResponse,
  UpdateVariantSchema,
  type UpdateVariantDto,
  VariantApiResponseSchema,
  type VariantApiResponse,
  VariantListApiResponseSchema,
  type VariantListApiResponse,
} from './schemas/variants.schema';
import { VariantsService } from './variants.service';

@Controller()
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post('products/:productId/variants')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateVariantSchema)) body: CreateVariantDto,
  ): Promise<VariantApiResponse> {
    const variant = await this.variantsService.createVariant(productId, body);
    return VariantApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Variant created successfully',
        data: variant,
        path: request.url,
      }),
    );
  }

  @Get('products/:productId/variants')
  async listVariants(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() request: ExpressRequest,
  ): Promise<VariantListApiResponse> {
    const variants = await this.variantsService.listVariants(productId);
    return VariantListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Variants fetched successfully',
        data: variants,
        path: request.url,
      }),
    );
  }

  @Post('products/:productId/variants/sync-cache')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async syncCaches(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() request: ExpressRequest,
  ): Promise<SyncCacheApiResponse> {
    const result = await this.variantsService.syncCaches(productId);
    return SyncCacheApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Product variant caches synced successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Get('variants/:id')
  async getVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<VariantApiResponse> {
    const variant = await this.variantsService.getVariantById(id);
    return VariantApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Variant fetched successfully',
        data: variant,
        path: request.url,
      }),
    );
  }

  @Patch('variants/:id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updateVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdateVariantSchema)) body: UpdateVariantDto,
  ): Promise<VariantApiResponse> {
    const variant = await this.variantsService.updateVariant(id, body);
    return VariantApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Variant updated successfully',
        data: variant,
        path: request.url,
      }),
    );
  }

  @Delete('variants/:id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async deleteVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<DeleteVariantApiResponse> {
    const result = await this.variantsService.deleteVariant(id);
    return DeleteVariantApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Variant deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }
}
