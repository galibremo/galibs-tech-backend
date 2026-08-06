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
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CartService } from './cart.service';
import {
  AddCartItemSchema,
  type AddCartItemDto,
  CartApiResponseSchema,
  type CartApiResponse,
  UpdateCartItemSchema,
  type UpdateCartItemDto,
} from './schemas/cart.schema';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() request: ExpressRequest): Promise<CartApiResponse> {
    const cart = await this.cartService.getCart(request.headers);
    return CartApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Cart fetched successfully',
        data: cart,
        path: request.url,
      }),
    );
  }

  @Post('items')
  async addItem(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(AddCartItemSchema)) body: AddCartItemDto,
  ): Promise<CartApiResponse> {
    const cart = await this.cartService.addItem(request.headers, body);
    return CartApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Item added to cart successfully',
        data: cart,
        path: request.url,
      }),
    );
  }

  @Patch('items/:id')
  async updateItem(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateCartItemSchema)) body: UpdateCartItemDto,
  ): Promise<CartApiResponse> {
    const cart = await this.cartService.updateItem(request.headers, id, body);
    return CartApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Cart item updated successfully',
        data: cart,
        path: request.url,
      }),
    );
  }

  @Delete('items/:id')
  async removeItem(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CartApiResponse> {
    const cart = await this.cartService.removeItem(request.headers, id);
    return CartApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Cart item removed successfully',
        data: cart,
        path: request.url,
      }),
    );
  }

  @Delete()
  async clearCart(@Req() request: ExpressRequest): Promise<CartApiResponse> {
    const cart = await this.cartService.clearCart(request.headers);
    return CartApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Cart cleared successfully',
        data: cart,
        path: request.url,
      }),
    );
  }
}
