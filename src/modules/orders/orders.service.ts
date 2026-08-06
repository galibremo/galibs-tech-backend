import { Injectable } from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';

import {
  badRequestError,
  forbiddenError,
} from '../../core/errors/domain-error';
import { CartService } from '../cart/cart.service';
import { CommerceCatalogService } from '../commerce/commerce-catalog.service';
import { CommerceShopperService } from '../commerce/commerce-shopper.service';
import { OrdersRepository } from './orders.repository';
import type {
  CheckoutDto,
  InvoiceResponse,
  OrderListResponse,
  OrderResponse,
  UpdatePaymentStatusDto,
} from './schemas/orders.schema';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartService: CartService,
    private readonly shopperService: CommerceShopperService,
    private readonly catalogService: CommerceCatalogService,
  ) {}

  async checkout(
    headers: IncomingHttpHeaders,
    body: CheckoutDto,
  ): Promise<OrderResponse> {
    const shopper = await this.shopperService.resolveShopper(headers);
    const cart = await this.cartService.getOrCreateCartWithMerge(headers);

    if (!cart.items.length) {
      throw badRequestError('Cart is empty');
    }

    const orderItems: {
      productId: string;
      variantId: string | null;
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (const item of cart.items) {
      const line = await this.catalogService.resolvePurchasable({
        productId: item.productId,
        variantId: item.variantId,
      });
      this.catalogService.assertInStock(line, item.quantity);

      orderItems.push({
        productId: line.productId,
        variantId: line.variantId,
        name: line.name,
        sku: line.sku,
        quantity: item.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.unitPrice * item.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const userId = shopper.kind === 'user' ? shopper.userId : null;
    const guestToken = shopper.kind === 'guest' ? shopper.guestToken : null;

    const orderId = await this.ordersRepository.createOrderWithPayment({
      userId,
      guestToken,
      guestEmail: body.shippingAddress.email,
      guestPhone: body.shippingAddress.phone,
      shippingAddress: {
        fullName: body.shippingAddress.fullName,
        phone: body.shippingAddress.phone,
        email: body.shippingAddress.email,
        addressLine1: body.shippingAddress.addressLine1,
        addressLine2: body.shippingAddress.addressLine2 ?? null,
        city: body.shippingAddress.city,
        district: body.shippingAddress.district,
        postalCode: body.shippingAddress.postalCode ?? null,
      },
      notes: body.notes ?? null,
      subtotal,
      shippingFee,
      total,
      items: orderItems,
      cartId: cart.id,
    });

    const order = this.ordersRepository.ensureOrderFound(
      await this.ordersRepository.findOrderById(orderId),
    );

    return this.ordersRepository.mapOrderToResponse(order);
  }

  async listOrders(headers: IncomingHttpHeaders): Promise<OrderListResponse> {
    const { userId } = await this.shopperService.requireUser(headers);
    const orders = await this.ordersRepository.listOrdersByUserId(userId);

    return {
      rows: orders.map((order) =>
        this.ordersRepository.mapOrderToResponse(order),
      ),
      total: orders.length,
    };
  }

  async getOrder(
    headers: IncomingHttpHeaders,
    orderId: string,
  ): Promise<OrderResponse> {
    const order = await this.requireAccessibleOrder(headers, orderId);
    return this.ordersRepository.mapOrderToResponse(order);
  }

  async getInvoice(
    headers: IncomingHttpHeaders,
    orderId: string,
  ): Promise<InvoiceResponse> {
    const order = await this.requireAccessibleOrder(headers, orderId);
    const mapped = this.ordersRepository.mapOrderToResponse(order);

    return {
      invoiceNumber: `INV-${mapped.orderNumber}`,
      issuedAt: new Date().toISOString(),
      order: mapped,
    };
  }

  async updatePaymentStatus(
    orderId: string,
    body: UpdatePaymentStatusDto,
  ): Promise<OrderResponse> {
    const order = this.ordersRepository.ensureOrderFound(
      await this.ordersRepository.findOrderById(orderId),
    );

    if (order.paymentStatus !== 'PENDING') {
      throw badRequestError('Only pending payments can be updated');
    }

    await this.ordersRepository.updatePaymentStatus({
      orderId,
      paymentStatus: body.paymentStatus,
    });

    const updated = this.ordersRepository.ensureOrderFound(
      await this.ordersRepository.findOrderById(orderId),
    );

    return this.ordersRepository.mapOrderToResponse(updated);
  }

  private async requireAccessibleOrder(
    headers: IncomingHttpHeaders,
    orderId: string,
  ) {
    const shopper = await this.shopperService.resolveShopper(headers);
    const order = this.ordersRepository.ensureOrderFound(
      await this.ordersRepository.findOrderById(orderId),
    );

    const access =
      shopper.kind === 'user'
        ? { userId: shopper.userId, guestToken: shopper.guestToken }
        : { guestToken: shopper.guestToken };

    if (!this.ordersRepository.canAccessOrder(order, access)) {
      throw forbiddenError(
        'order_access_denied',
        'You do not have access to this order',
      );
    }

    return order;
  }
}
