import { Module } from '@nestjs/common';

import { OffersModule } from '../offers/offers.module';
import { PromotionalController } from './promotional.controller';
import { PromotionalRepository } from './promotional.repository';
import { PromotionalService } from './promotional.service';

@Module({
  imports: [OffersModule],
  controllers: [PromotionalController],
  providers: [PromotionalService, PromotionalRepository],
})
export class PromotionalModule {}
