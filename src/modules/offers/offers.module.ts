import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module';
import { OffersController } from './offers.controller';
import { OffersRepository } from './offers.repository';
import { OffersService } from './offers.service';

@Module({
  imports: [ProductsModule],
  controllers: [OffersController],
  providers: [OffersService, OffersRepository],
})
export class OffersModule {}
