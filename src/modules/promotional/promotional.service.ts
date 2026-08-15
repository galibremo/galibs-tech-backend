import { Injectable } from '@nestjs/common';

import schema from 'src/core/database/drizzle/drizzle.schema';
import { notFoundError } from '../../core/errors/domain-error';
import { OffersService } from '../offers/offers.service';
import { PromotionalRepository } from './promotional.repository';
import type {
  CreateHeroSlideDto,
  DeletePromotionalItemResponse,
  HeroSlideResponse,
  PromotionalContentResponse,
  UpdateHeroSlideDto,
} from './schemas/promotional.schema';

type HeroSlideRow = typeof schema.heroSlides.$inferSelect;

@Injectable()
export class PromotionalService {
  constructor(
    private readonly promotionalRepository: PromotionalRepository,
    private readonly offersService: OffersService,
  ) {}

  async getPublicContent(): Promise<PromotionalContentResponse> {
    const [heroSlides, offers] = await Promise.all([
      this.promotionalRepository.listActiveHeroSlides(),
      this.offersService.listActivePromotionalOffers(),
    ]);

    return {
      heroSlides: heroSlides.map((row) => this.mapHeroSlide(row)),
      offers,
    };
  }

  async listHeroSlidesAdmin(): Promise<HeroSlideResponse[]> {
    const rows = await this.promotionalRepository.listAllHeroSlides();
    return rows.map((row) => this.mapHeroSlide(row));
  }

  async createHeroSlide(data: CreateHeroSlideDto): Promise<HeroSlideResponse> {
    const created = await this.promotionalRepository.createHeroSlide({
      title: data.title ?? null,
      subtitle: data.subtitle ?? null,
      imageUrl: data.imageUrl,
      mobileImageUrl: data.mobileImageUrl ?? null,
      linkUrl: data.linkUrl ?? null,
      linkTarget: data.linkTarget,
      altText: data.altText ?? null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    });

    if (!created) {
      throw notFoundError(
        'hero_slide_not_created',
        'Hero slide could not be created',
      );
    }

    return this.mapHeroSlide(created);
  }

  async updateHeroSlide(
    id: string,
    data: UpdateHeroSlideDto,
  ): Promise<HeroSlideResponse> {
    await this.getHeroSlideById(id);
    const updated = await this.promotionalRepository.updateHeroSlide(id, data);
    if (!updated) {
      throw notFoundError('hero_slide_not_found', 'Hero slide not found');
    }
    return this.mapHeroSlide(updated);
  }

  async deleteHeroSlide(id: string): Promise<DeletePromotionalItemResponse> {
    await this.getHeroSlideById(id);
    const deleted = await this.promotionalRepository.deleteHeroSlide(id);
    if (!deleted) {
      throw notFoundError('hero_slide_not_found', 'Hero slide not found');
    }
    return { deleted: true };
  }

  async getHeroSlideById(id: string): Promise<HeroSlideResponse> {
    const row = await this.promotionalRepository.findHeroSlideById(id);
    if (!row) {
      throw notFoundError('hero_slide_not_found', 'Hero slide not found');
    }
    return this.mapHeroSlide(row);
  }

  private mapHeroSlide(row: HeroSlideRow): HeroSlideResponse {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      imageUrl: row.imageUrl,
      mobileImageUrl: row.mobileImageUrl,
      linkUrl: row.linkUrl,
      linkTarget: row.linkTarget,
      altText: row.altText,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
