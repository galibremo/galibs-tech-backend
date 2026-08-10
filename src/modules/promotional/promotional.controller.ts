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
import { PromotionalService } from './promotional.service';
import {
  CreateHeroSlideSchema,
  type CreateHeroSlideDto,
  CreatePromoNavLinkSchema,
  type CreatePromoNavLinkDto,
  DeletePromotionalItemApiResponseSchema,
  type DeletePromotionalItemApiResponse,
  HeroSlideApiResponseSchema,
  type HeroSlideApiResponse,
  type HeroSlideResponse,
  HeroSlidesListApiResponseSchema,
  type HeroSlidesListApiResponse,
  PromotionalContentApiResponseSchema,
  type PromotionalContentApiResponse,
  PromoNavLinkApiResponseSchema,
  type PromoNavLinkApiResponse,
  type PromoNavLinkResponse,
  PromoNavLinksListApiResponseSchema,
  type PromoNavLinksListApiResponse,
  UpdateHeroSlideSchema,
  type UpdateHeroSlideDto,
  UpdatePromoNavLinkSchema,
  type UpdatePromoNavLinkDto,
} from './schemas/promotional.schema';

@Controller('promotional')
export class PromotionalController {
  constructor(private readonly promotionalService: PromotionalService) {}

  @Get()
  async getPromotionalContent(
    @Req() request: ExpressRequest,
  ): Promise<PromotionalContentApiResponse> {
    const content = await this.promotionalService.getPublicContent();
    return PromotionalContentApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Promotional content fetched successfully',
        data: content,
        path: request.url,
      }),
    );
  }

  @Get('hero-slides')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async listHeroSlides(
    @Req() request: ExpressRequest,
  ): Promise<HeroSlidesListApiResponse> {
    const heroSlides = await this.promotionalService.listHeroSlidesAdmin();
    return HeroSlidesListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Hero slides fetched successfully',
        data: heroSlides,
        path: request.url,
      }),
    );
  }

  @Post('hero-slides')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createHeroSlide(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreateHeroSlideSchema)) body: CreateHeroSlideDto,
  ): Promise<HeroSlideApiResponse> {
    const heroSlide = await this.promotionalService.createHeroSlide(body);
    return this.heroSlideResponse(
      HttpStatus.CREATED,
      'Hero slide created successfully',
      heroSlide,
      request.url,
    );
  }

  @Patch('hero-slides/:id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updateHeroSlide(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdateHeroSlideSchema)) body: UpdateHeroSlideDto,
  ): Promise<HeroSlideApiResponse> {
    const heroSlide = await this.promotionalService.updateHeroSlide(id, body);
    return this.heroSlideResponse(
      HttpStatus.OK,
      'Hero slide updated successfully',
      heroSlide,
      request.url,
    );
  }

  @Delete('hero-slides/:id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async deleteHeroSlide(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<DeletePromotionalItemApiResponse> {
    const result = await this.promotionalService.deleteHeroSlide(id);
    return DeletePromotionalItemApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Hero slide deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  @Get('promo-nav-links')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async listPromoNavLinks(
    @Req() request: ExpressRequest,
  ): Promise<PromoNavLinksListApiResponse> {
    const promoNavLinks =
      await this.promotionalService.listPromoNavLinksAdmin();
    return PromoNavLinksListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Promo nav links fetched successfully',
        data: promoNavLinks,
        path: request.url,
      }),
    );
  }

  @Post('promo-nav-links')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async createPromoNavLink(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CreatePromoNavLinkSchema))
    body: CreatePromoNavLinkDto,
  ): Promise<PromoNavLinkApiResponse> {
    const promoNavLink = await this.promotionalService.createPromoNavLink(body);
    return this.promoNavLinkResponse(
      HttpStatus.CREATED,
      'Promo nav link created successfully',
      promoNavLink,
      request.url,
    );
  }

  @Patch('promo-nav-links/:id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updatePromoNavLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(UpdatePromoNavLinkSchema))
    body: UpdatePromoNavLinkDto,
  ): Promise<PromoNavLinkApiResponse> {
    const promoNavLink = await this.promotionalService.updatePromoNavLink(
      id,
      body,
    );
    return this.promoNavLinkResponse(
      HttpStatus.OK,
      'Promo nav link updated successfully',
      promoNavLink,
      request.url,
    );
  }

  @Delete('promo-nav-links/:id')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async deletePromoNavLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: ExpressRequest,
  ): Promise<DeletePromotionalItemApiResponse> {
    const result = await this.promotionalService.deletePromoNavLink(id);
    return DeletePromotionalItemApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Promo nav link deleted successfully',
        data: result,
        path: request.url,
      }),
    );
  }

  private heroSlideResponse(
    statusCode: HttpStatus,
    message: string,
    heroSlide: HeroSlideResponse,
    path: string,
  ): HeroSlideApiResponse {
    return HeroSlideApiResponseSchema.parse(
      createApiResponse({
        statusCode,
        message,
        data: heroSlide,
        path,
      }),
    );
  }

  private promoNavLinkResponse(
    statusCode: HttpStatus,
    message: string,
    promoNavLink: PromoNavLinkResponse,
    path: string,
  ): PromoNavLinkApiResponse {
    return PromoNavLinkApiResponseSchema.parse(
      createApiResponse({
        statusCode,
        message,
        data: promoNavLink,
        path,
      }),
    );
  }
}
