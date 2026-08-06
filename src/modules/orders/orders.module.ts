import { Module } from '@nestjs/common';

import { CartModule } from '../cart/cart.module';
import { CommerceModule } from '../commerce/commerce.module';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [CommerceModule, CartModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
