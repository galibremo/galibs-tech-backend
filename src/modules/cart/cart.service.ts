import { Injectable } from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';

import { notFoundError } from '../../core/errors/domain-error';
import { CommerceCatalogService } from '../commerce/commerce-catalog.service';
import { CommerceShopperService } from '../commerce/commerce-shopper.service';
import { CartRepository } from './cart.repository';
import type {
  AddCartItemDto,
  CartResponse,
  UpdateCartItemDto,
} from './schemas/cart.schema';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly shopperService: CommerceShopperService,
    private readonly catalogService: CommerceCatalogService,
  ) {}

  async getCart(headers: IncomingHttpHeaders): Promise<CartResponse> {
    const cart = await this.getOrCreateCartWithMerge(headers);
    return this.cartRepository.mapCartToResponse(cart);
  }

  async addItem(
    headers: IncomingHttpHeaders,
    body: AddCartItemDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCartWithMerge(headers);
    const line = await this.catalogService.resolvePurchasable({
      productId: body.productId,
      variantId: body.variantId,
    });

    const existing = await this.cartRepository.findLineByProductVariant({
      cartId: cart.id,
      productId: line.productId,
      variantId: line.variantId,
    });

    const nextQty = (existing?.quantity ?? 0) + body.quantity;
    this.catalogService.assertInStock(line, nextQty);

    if (existing) {
      await this.cartRepository.updateItemQuantity(
        existing.id,
        nextQty,
        line.unitPrice,
      );
    } else {
      await this.cartRepository.insertItem({
        cartId: cart.id,
        productId: line.productId,
        variantId: line.variantId,
        quantity: body.quantity,
        unitPrice: line.unitPrice,
      });
    }

    return this.getCart(headers);
  }

  async updateItem(
    headers: IncomingHttpHeaders,
    itemId: string,
    body: UpdateCartItemDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCartWithMerge(headers);
    const item = await this.cartRepository.findCartItem(cart.id, itemId);
    if (!item) {
      throw notFoundError('cart_item_not_found', 'Cart item not found');
    }

    const line = await this.catalogService.resolvePurchasable({
      productId: item.productId,
      variantId: item.variantId,
    });
    this.catalogService.assertInStock(line, body.quantity);

    await this.cartRepository.updateItemQuantity(
      item.id,
      body.quantity,
      line.unitPrice,
    );

    return this.getCart(headers);
  }

  async removeItem(
    headers: IncomingHttpHeaders,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCartWithMerge(headers);
    const item = await this.cartRepository.findCartItem(cart.id, itemId);
    if (!item) {
      throw notFoundError('cart_item_not_found', 'Cart item not found');
    }

    await this.cartRepository.deleteItem(item.id);
    return this.getCart(headers);
  }

  async clearCart(headers: IncomingHttpHeaders): Promise<CartResponse> {
    const cart = await this.getOrCreateCartWithMerge(headers);
    await this.cartRepository.clearItems(cart.id);
    return this.getCart(headers);
  }

  /**
   * Used by wishlist move-to-cart and checkout.
   */
  async getOrCreateCartWithMerge(headers: IncomingHttpHeaders) {
    const shopper = await this.shopperService.resolveShopper(headers);

    if (shopper.kind === 'user' && shopper.guestToken) {
      await this.cartRepository.mergeGuestCartIntoUser({
        userId: shopper.userId,
        guestToken: shopper.guestToken,
      });
    }

    let cart =
      await this.cartRepository.findActiveCartForShopper(shopper);

    if (!cart) {
      await this.cartRepository.createActiveCart(shopper);
      cart = await this.cartRepository.findActiveCartForShopper(shopper);
    }

    return this.cartRepository.ensureCartFound(cart);
  }
}
