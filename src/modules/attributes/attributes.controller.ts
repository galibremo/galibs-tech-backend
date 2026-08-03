import {
  Body,
  Controller,
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
import { AttributesService } from './attributes.service';
import {
  AttributeApiResponseSchema,
  type AttributeApiResponse,
  AttributeListApiResponseSchema,
  type AttributeListApiResponse,
  AttributeOptionApiResponseSchema,
  type AttributeOptionApiResponse,
  AttributeOptionListApiResponseSchema,
  type AttributeOptionListApiResponse,
  AttributeWithOptionsApiResponseSchema,
  type AttributeWithOptionsApiResponse,
  AttributesListQuerySchema,
  type AttributesListQueryDto,
  CreateAttributeOptionSchema,
  type CreateAttributeOptionDto,
  CreateAttributeSchema,
  type CreateAttributeDto,
  UpdateAttributeSchema,
  type UpdateAttributeDto,
  type AttributeResponse,
  type AttributeWithOptionsResponse,
} from './schemas/attributes.schema';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  async listAttributes(
    @Req() request: ExpressRequest,
    @Query(new ZodValidationPipe(AttributesListQuerySchema))
    query: AttributesListQueryDto,
  ): Promise<AttributeListApiResponse> {
    const attributes = await this.attributesService.listAttributes(query);
    return AttributeListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Attributes fetched successfully',
        data: attributes,
        path: request.url,
      }),
    );
  }

  @Get('code/:code')
  async getAttributeByCode(
    @Req() request: ExpressRequest,
    @Param('code') code: string,
  ): Promise<AttributeWithOptionsApiResponse> {
    const attribute = await this.attributesService.getAttributeByCode(code);
    return this.attributeWithOptionsResponse(
      HttpStatus.OK,
      'Attribute fetched successfully',
      attribute,
      request.url,
    );
  }

  @Get(':id')
  async getAttribute(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttributeWithOptionsApiResponse> {
    const attribute = await this.attributesService.getAttributeById(id);
    return this.attributeWithOptionsResponse(
      HttpStatus.OK,
      'Attribute fetched successfully',
      attribute,
      request.url,
    );
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createAttribute(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateAttributeSchema)) body: CreateAttributeDto,
  ): Promise<AttributeApiResponse> {
    const attribute = await this.attributesService.createAttribute(body);
    return this.attributeResponse(
      HttpStatus.CREATED,
      'Attribute created successfully',
      attribute,
      request.url,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updateAttribute(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdateAttributeSchema)) body: UpdateAttributeDto,
  ): Promise<AttributeApiResponse> {
    const attribute = await this.attributesService.updateAttribute(id, body);
    return this.attributeResponse(
      HttpStatus.OK,
      'Attribute updated successfully',
      attribute,
      request.url,
    );
  }

  @Get(':attributeId/options')
  async listOptions(
    @Req() request: ExpressRequest,
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
  ): Promise<AttributeOptionListApiResponse> {
    const options = await this.attributesService.listOptions(attributeId);
    return AttributeOptionListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Attribute options fetched successfully',
        data: options,
        path: request.url,
      }),
    );
  }

  @Post(':attributeId/options')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createOption(
    @Req() request: ExpressRequest,
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Body(new ZodValidationPipe(CreateAttributeOptionSchema))
    body: CreateAttributeOptionDto,
  ): Promise<AttributeOptionApiResponse> {
    const option = await this.attributesService.createOption(
      attributeId,
      body,
    );
    return AttributeOptionApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Attribute option created successfully',
        data: option,
        path: request.url,
      }),
    );
  }

  private attributeResponse(
    statusCode: HttpStatus,
    message: string,
    attribute: AttributeResponse,
    path: string,
  ): AttributeApiResponse {
    return AttributeApiResponseSchema.parse(
      createApiResponse({
        statusCode,
        message,
        data: attribute,
        path,
      }),
    );
  }

  private attributeWithOptionsResponse(
    statusCode: HttpStatus,
    message: string,
    attribute: AttributeWithOptionsResponse,
    path: string,
  ): AttributeWithOptionsApiResponse {
    return AttributeWithOptionsApiResponseSchema.parse(
      createApiResponse({
        statusCode,
        message,
        data: attribute,
        path,
      }),
    );
  }
}
