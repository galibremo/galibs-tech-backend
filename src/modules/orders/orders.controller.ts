import {
  Body,
  Controller,
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
import { OrdersService } from './orders.service';
import {
  CheckoutSchema,
  type CheckoutDto,
  InvoiceApiResponseSchema,
  type InvoiceApiResponse,
  OrderApiResponseSchema,
  type OrderApiResponse,
  OrderListApiResponseSchema,
  type OrderListApiResponse,
  UpdatePaymentStatusSchema,
  type UpdatePaymentStatusDto,
} from './schemas/orders.schema';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(CheckoutSchema)) body: CheckoutDto,
  ): Promise<OrderApiResponse> {
    const order = await this.ordersService.checkout(request.headers, body);
    return OrderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.CREATED,
        message: 'Order placed successfully',
        data: order,
        path: request.url,
      }),
    );
  }

  @Get('orders')
  async listOrders(
    @Req() request: ExpressRequest,
  ): Promise<OrderListApiResponse> {
    const orders = await this.ordersService.listOrders(request.headers);
    return OrderListApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Orders fetched successfully',
        data: orders,
        path: request.url,
      }),
    );
  }

  @Get('orders/:id')
  async getOrder(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderApiResponse> {
    const order = await this.ordersService.getOrder(request.headers, id);
    return OrderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Order fetched successfully',
        data: order,
        path: request.url,
      }),
    );
  }

  @Get('orders/:id/invoice')
  async getInvoice(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceApiResponse> {
    const invoice = await this.ordersService.getInvoice(request.headers, id);
    return InvoiceApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Invoice fetched successfully',
        data: invoice,
        path: request.url,
      }),
    );
  }

  @Patch('orders/:id/payment-status')
  @UseGuards(AuthGuard)
  @Roles(['SUPER_ADMIN'])
  async updatePaymentStatus(
    @Req() request: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdatePaymentStatusSchema))
    body: UpdatePaymentStatusDto,
  ): Promise<OrderApiResponse> {
    const order = await this.ordersService.updatePaymentStatus(id, body);
    return OrderApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: 'Payment status updated successfully',
        data: order,
        path: request.url,
      }),
    );
  }
}
