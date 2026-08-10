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
import { OffersService } from './offers.service';
import {
  AttachOfferProductSchema,
  type AttachOfferProductDto,
  CreateOfferSchema,
  type CreateOfferDto,
  DeleteOfferApiResponseSchema,
  type DeleteOfferApiResponse,
  DeleteOfferProductApiResponseSchema,
  type DeleteOfferProductApiResponse,
  DetachOfferProductSchema,
  type DetachOfferProductDto,
  OfferApiResponseSchema,
  type OfferApiResponse,
  OfferProductApiResponseSchema,
  type OfferProductApiResponse,
  type OfferResponse,
  OffersActiveListApiResponseSchema,
  type OffersActiveListApiResponse,
  OffersListApiResponseSchema,
  type OffersListApiResponse,
  OffersListQuerySchema,
  type OffersListQueryDto,
  UpdateOfferSchema,
  type UpdateOfferDto,
} from './schemas/offers.schema';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('active')
  async listActiveOffers(
    @Req() request: ExpressRequest,
  ): Promise<OffersActiveListApiResponse> {
    const offers = await this.offersService.listActiveOffers();
    return OffersActiveListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Active offers fetched successfully',
        data: offers,
        path: request.url,
      }),
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async listOffers(
    @Req() request: ExpressRequest,
    @Query(new ZodValidationPipe(OffersListQuerySchema)) query: OffersListQueryDto,
  ): Promise<OffersListApiResponse> {
    const offers = await this.offersService.listOffers(query);
    return OffersListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Offers fetched successfully',
        data: offers,
        path: request.url,
      }),
    );
  }

  @Get(':slug')
  async getOfferBySlug(
    @Req() request: ExpressRequest,
    @Param('slug') slug: string,
  ): Promise<OfferApiResponse> {
    const offer = await this.offersService.getOfferBySlug(slug);
    return this.offerResponse(
      HttpStatus.OK,
      'Offer fetched successfully',
      offer,
      request.url,
    );
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createOffer(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateOfferSchema)) body: CreateOfferDto,
  ): Promise<OfferApiResponse> {
    const offer = await this.offersService.createOffer(body);
    return this.offerResponse(
      HttpStatus.CREATED,
      'Offer created successfully',
      offer,
      request.url,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updateOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdateOfferSchema)) body: UpdateOfferDto,
  ): Promise<OfferApiResponse> {
    const offer = await this.offersService.updateOffer(id, body);
    return this.offerResponse(
      HttpStatus.OK,
      'Offer updated successfully',
      offer,
      request.url,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async deleteOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<DeleteOfferApiResponse> {
    const result = await this.offersService.deleteOffer(id);
    return DeleteOfferApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Offer deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Post(':id/products')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async attachOfferProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(AttachOfferProductSchema))
    body: AttachOfferProductDto,
  ): Promise<OfferProductApiResponse> {
    const product = await this.offersService.attachProduct(id, body);
    return OfferProductApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Product attached to offer successfully',
        data: product,
        path: request.url,
      }),
    );
  }

  @Delete(':id/products')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async detachOfferProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(DetachOfferProductSchema))
    body: DetachOfferProductDto,
  ): Promise<DeleteOfferProductApiResponse> {
    const result = await this.offersService.detachProduct(id, body);
    return DeleteOfferProductApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Product detached from offer successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  private offerResponse(
    statusCode: HttpStatus,
    message: string,
    offer: OfferResponse,
    path: string,
  ): OfferApiResponse {
    return OfferApiResponseSchema.parse(
      createApiResponse({
        statusCode,
        message,
        data: offer,
        path,
      }),
    );
  }
}
