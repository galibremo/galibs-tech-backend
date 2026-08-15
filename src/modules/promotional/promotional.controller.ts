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
  DeletePromotionalItemApiResponseSchema,
  type DeletePromotionalItemApiResponse,
  HeroSlideApiResponseSchema,
  type HeroSlideApiResponse,
  type HeroSlideResponse,
  HeroSlidesListApiResponseSchema,
  type HeroSlidesListApiResponse,
  PromotionalContentApiResponseSchema,
  type PromotionalContentApiResponse,
  UpdateHeroSlideSchema,
  type UpdateHeroSlideDto,
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
}
