import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import {
  AddWishlistItemSchema,
  type AddWishlistItemDto,
  WishlistApiResponseSchema,
  type WishlistApiResponse,
} from './schemas/wishlist.schema';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(
    @Req() request: ExpressRequest,
  ): Promise<WishlistApiResponse> {
    const wishlist = await this.wishlistService.getWishlist(request.headers);
    return WishlistApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Wishlist fetched successfully',
        data: wishlist,
        path: request.url,
      }),
    );
  }

  @Post('items')
  async addItem(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(AddWishlistItemSchema))
    body: AddWishlistItemDto,
  ): Promise<WishlistApiResponse> {
    const wishlist = await this.wishlistService.addItem(
      request.headers,
      body,
    );
    return WishlistApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Item added to wishlist successfully',
        data: wishlist,
        path: request.url,
      }),
    );
  }

  @Delete('items/:id')
  async removeItem(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WishlistApiResponse> {
    const wishlist = await this.wishlistService.removeItem(
      request.headers,
      id,
    );
    return WishlistApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Wishlist item removed successfully',
        data: wishlist,
        path: request.url,
      }),
    );
  }

  @Post('items/:id/move-to-cart')
  async moveToCart(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WishlistApiResponse> {
    const wishlist = await this.wishlistService.moveToCart(
      request.headers,
      id,
    );
    return WishlistApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Item moved to cart successfully',
        data: wishlist,
        path: request.url,
      }),
    );
  }
}
