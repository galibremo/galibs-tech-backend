import { Injectable } from '@nestjs/common';

import schema from 'src/core/database/drizzle/drizzle.schema';
import {
  badRequestError,
  conflictError,
  isDatabaseUniqueViolation,
  notFoundError,
} from '../../core/errors/domain-error';
import { computeProductSavings } from '../../shared/helpers/product-pricing.helper';
import { ProductsRepository } from '../products/products.repository';
import { OffersRepository } from './offers.repository';
import type {
  AttachOfferProductDto,
  CreateOfferDto,
  DetachOfferProductDto,
  OfferProductResponse,
  OfferResponse,
  OffersListQueryDto,
  OffersListResponse,
  UpdateOfferDto,
} from './schemas/offers.schema';

type OfferRow = typeof schema.offers.$inferSelect;

@Injectable()
export class OffersService {
  constructor(
    private readonly offersRepository: OffersRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async listActiveOffers(): Promise<OfferResponse[]> {
    const rows = await this.offersRepository.listActiveOffers();
    return rows.map((row) => this.mapOffer(row));
  }

  async listOffers(query: OffersListQueryDto): Promise<OffersListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const result = await this.offersRepository.listOffers(page, pageSize);

    return {
      rows: result.rows.map((row) => this.mapOffer(row)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async getOfferBySlug(slug: string): Promise<OfferResponse> {
    const offer = await this.offersRepository.findOfferBySlug(slug);
    if (!offer || !offer.isActive) {
      throw notFoundError('offer_not_found', 'Offer not found');
    }

    const now = new Date();
    if (offer.startsAt && offer.startsAt > now) {
      throw notFoundError('offer_not_found', 'Offer not found');
    }
    if (offer.endsAt && offer.endsAt < now) {
      throw notFoundError('offer_not_found', 'Offer not found');
    }

    const products = await this.offersRepository.listOfferProducts(offer.id);
    return {
      ...this.mapOffer(offer),
      products: products.map((row) => this.mapOfferProduct(row)),
    };
  }

  async getOfferById(id: string): Promise<OfferResponse> {
    const offer = await this.offersRepository.findOfferById(id);
    if (!offer) {
      throw notFoundError('offer_not_found', 'Offer not found');
    }

    const products = await this.offersRepository.listOfferProducts(offer.id);
    return {
      ...this.mapOffer(offer),
      products: products.map((row) => this.mapOfferProduct(row)),
    };
  }

  async createOffer(data: CreateOfferDto): Promise<OfferResponse> {
    try {
      const created = await this.offersRepository.createOffer({
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description ?? null,
        bannerImageUrl: data.bannerImageUrl ?? null,
        isActive: data.isActive,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        sortOrder: data.sortOrder,
      });

      if (!created) {
        throw notFoundError('offer_not_created', 'Offer could not be created');
      }

      return this.mapOffer(created);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError('slug_already_exists', 'Offer slug already exists');
      }
      throw error;
    }
  }

  async updateOffer(id: string, data: UpdateOfferDto): Promise<OfferResponse> {
    await this.getOfferById(id);

    try {
      const updated = await this.offersRepository.updateOffer(id, data);
      if (!updated) {
        throw notFoundError('offer_not_found', 'Offer not found');
      }
      return this.mapOffer(updated);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError('slug_already_exists', 'Offer slug already exists');
      }
      throw error;
    }
  }

  async deleteOffer(id: string): Promise<{ deleted: boolean }> {
    await this.getOfferById(id);
    const deleted = await this.offersRepository.deleteOffer(id);
    if (!deleted) {
      throw notFoundError('offer_not_found', 'Offer not found');
    }
    return { deleted: true };
  }

  async attachProduct(
    offerId: string,
    data: AttachOfferProductDto,
  ): Promise<OfferProductResponse> {
    await this.getOfferById(offerId);

    const product = await this.productsRepository.findProductById(data.productId);
    if (!product) {
      throw notFoundError('product_not_found', 'Product not found');
    }

    try {
      const attached = await this.offersRepository.attachOfferProduct({
        offerId,
        productId: data.productId,
        variantId: data.variantId ?? null,
        offerPrice: data.offerPrice ?? null,
        sortOrder: data.sortOrder,
      });

      if (!attached) {
        throw badRequestError('offer_product_not_attached');
      }

      const attachedRow = (
        await this.offersRepository.listOfferProducts(offerId)
      ).find((item) => item.id === attached.id);

      if (!attachedRow) {
        throw notFoundError('offer_product_not_found', 'Offer product not found');
      }

      return this.mapOfferProduct(attachedRow);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'offer_product_exists',
          'Product is already attached to this offer',
        );
      }
      throw error;
    }
  }

  async detachProduct(
    offerId: string,
    data: DetachOfferProductDto,
  ): Promise<{ deleted: boolean }> {
    await this.getOfferById(offerId);

    const detached = await this.offersRepository.detachOfferProduct(
      offerId,
      data.productId,
      data.variantId ?? null,
    );

    if (!detached) {
      throw notFoundError('offer_product_not_found', 'Offer product not found');
    }

    return { deleted: true };
  }

  private mapOffer(row: OfferRow): OfferResponse {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      description: row.description,
      bannerImageUrl: row.bannerImageUrl,
      isActive: row.isActive,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapOfferProduct(row: {
    id: string;
    productId: string;
    variantId: string | null;
    offerPrice: number | null;
    sortOrder: number;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
    price: number;
    regularPrice: number | null;
    earnPoints: number;
    availability:
      | 'IN_STOCK'
      | 'OUT_OF_STOCK'
      | 'LOW_STOCK'
      | 'PRE_ORDER'
      | 'UPCOMING';
  }): OfferProductResponse {
    const effectivePrice = row.offerPrice ?? row.price;
    const regularPrice = row.regularPrice ?? row.price;
    const { saveAmount, savePercent } = computeProductSavings(
      effectivePrice,
      regularPrice,
    );

    return {
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      offerPrice: row.offerPrice,
      sortOrder: row.sortOrder,
      name: row.name,
      slug: row.slug,
      thumbnailUrl: row.thumbnailUrl,
      price: effectivePrice,
      regularPrice,
      saveAmount,
      savePercent,
      earnPoints: row.earnPoints,
      availability: row.availability,
    };
  }
}
