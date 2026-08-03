import { Module } from '@nestjs/common';

import { OptionGroupsController } from './option-groups.controller';
import { VariantsController } from './variants.controller';
import { VariantsRepository } from './variants.repository';
import { VariantsService } from './variants.service';

@Module({
  controllers: [OptionGroupsController, VariantsController],
  providers: [VariantsService, VariantsRepository],
  exports: [VariantsService],
})
export class VariantsModule {}
