import { Module } from '@nestjs/common';

import { PromotionalController } from './promotional.controller';
import { PromotionalRepository } from './promotional.repository';
import { PromotionalService } from './promotional.service';

@Module({
  controllers: [PromotionalController],
  providers: [PromotionalService, PromotionalRepository],
})
export class PromotionalModule {}
