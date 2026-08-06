import { Injectable } from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';

import { conflictError, notFoundError } from '../../core/errors/domain-error';
import { CommerceCatalogService } from '../commerce/commerce-catalog.service';
import { CommerceShopperService } from '../commerce/commerce-shopper.service';
import { CartService } from '../cart/cart.service';
import type {
  AddWishlistItemDto,
  WishlistResponse,
} from './schemas/wishlist.schema';
import { WishlistRepository } from './wishlist.repository';

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly shopperService: CommerceShopperService,
    private readonly catalogService: CommerceCatalogService,
    private readonly cartService: CartService,
  ) {}

  async getWishlist(headers: IncomingHttpHeaders): Promise<WishlistResponse> {
    const wishlist = await this.getOrCreateWishlistWithMerge(headers);
    return this.wishlistRepository.mapToResponse(wishlist);
  }

  async addItem(
    headers: IncomingHttpHeaders,
    body: AddWishlistItemDto,
  ): Promise<WishlistResponse> {
    const wishlist = await this.getOrCreateWishlistWithMerge(headers);
    const line = await this.catalogService.resolvePurchasable({
      productId: body.productId,
      variantId: body.variantId,
    });

    const existing = await this.wishlistRepository.findLine({
      wishlistId: wishlist.id,
      productId: line.productId,
      variantId: line.variantId,
    });

    if (existing) {
      throw conflictError(
        'wishlist_item_exists',
        'Item already exists in wishlist',
      );
    }

    await this.wishlistRepository.insertItem({
      wishlistId: wishlist.id,
      productId: line.productId,
      variantId: line.variantId,
    });

    return this.getWishlist(headers);
  }

  async removeItem(
    headers: IncomingHttpHeaders,
    itemId: string,
  ): Promise<WishlistResponse> {
    const wishlist = await this.getOrCreateWishlistWithMerge(headers);
    const item = await this.wishlistRepository.findItem(wishlist.id, itemId);
    if (!item) {
      throw notFoundError('wishlist_item_not_found', 'Wishlist item not found');
    }

    await this.wishlistRepository.deleteItem(item.id);
    return this.getWishlist(headers);
  }

  async moveToCart(
    headers: IncomingHttpHeaders,
    itemId: string,
  ): Promise<WishlistResponse> {
    const wishlist = await this.getOrCreateWishlistWithMerge(headers);
    const item = await this.wishlistRepository.findItem(wishlist.id, itemId);
    if (!item) {
      throw notFoundError('wishlist_item_not_found', 'Wishlist item not found');
    }

    await this.cartService.addItem(headers, {
      productId: item.productId,
      variantId: item.variantId,
      quantity: 1,
    });

    await this.wishlistRepository.deleteItem(item.id);
    return this.getWishlist(headers);
  }

  private async getOrCreateWishlistWithMerge(headers: IncomingHttpHeaders) {
    const shopper = await this.shopperService.resolveShopper(headers);

    if (shopper.kind === 'user' && shopper.guestToken) {
      await this.wishlistRepository.mergeGuestWishlistIntoUser({
        userId: shopper.userId,
        guestToken: shopper.guestToken,
      });
    }

    let wishlist =
      await this.wishlistRepository.findWishlistForShopper(shopper);

    if (!wishlist) {
      await this.wishlistRepository.createWishlist(shopper);
      wishlist =
        await this.wishlistRepository.findWishlistForShopper(shopper);
    }

    return this.wishlistRepository.ensureFound(
      wishlist,
      'wishlist_not_found',
      'Wishlist not found',
    );
  }
}
