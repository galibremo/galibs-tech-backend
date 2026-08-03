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
  CreateOptionGroupSchema,
  type CreateOptionGroupDto,
  CreateOptionValueSchema,
  type CreateOptionValueDto,
  DeleteOptionGroupApiResponseSchema,
  type DeleteOptionGroupApiResponse,
  OptionGroupApiResponseSchema,
  type OptionGroupApiResponse,
  OptionGroupListApiResponseSchema,
  type OptionGroupListApiResponse,
  OptionValueApiResponseSchema,
  type OptionValueApiResponse,
  UpdateOptionValueSchema,
  type UpdateOptionValueDto,
} from './schemas/variants.schema';
import { VariantsService } from './variants.service';

@Controller()
export class OptionGroupsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post('products/:productId/option-groups')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createOptionGroup(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateOptionGroupSchema))
    body: CreateOptionGroupDto,
  ): Promise<OptionGroupApiResponse> {
    const group = await this.variantsService.createOptionGroup(
      productId,
      body,
    );
    return OptionGroupApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Option group created successfully',
        data: group,
        path: request.url,
      }),
    );
  }

  @Get('products/:productId/option-groups')
  async listOptionGroups(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() request: ExpressRequest,
  ): Promise<OptionGroupListApiResponse> {
    const groups = await this.variantsService.listOptionGroups(productId);
    return OptionGroupListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Option groups fetched successfully',
        data: groups,
        path: request.url,
      }),
    );
  }

  @Post('option-groups/:groupId/values')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createOptionValue(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateOptionValueSchema))
    body: CreateOptionValueDto,
  ): Promise<OptionValueApiResponse> {
    const value = await this.variantsService.createOptionValue(groupId, body);
    return OptionValueApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Option value created successfully',
        data: value,
        path: request.url,
      }),
    );
  }

  @Patch('option-values/:id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updateOptionValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdateOptionValueSchema))
    body: UpdateOptionValueDto,
  ): Promise<OptionValueApiResponse> {
    const value = await this.variantsService.updateOptionValue(id, body);
    return OptionValueApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Option value updated successfully',
        data: value,
        path: request.url,
      }),
    );
  }

  @Delete('option-groups/:id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async deleteOptionGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<DeleteOptionGroupApiResponse> {
    const result = await this.variantsService.deleteOptionGroup(id);
    return DeleteOptionGroupApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Option group deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }
}
