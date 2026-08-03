import { Module } from '@nestjs/common';

import { AttributeOptionsController } from './attribute-options.controller';
import { AttributesController } from './attributes.controller';
import { AttributesRepository } from './attributes.repository';
import { AttributesService } from './attributes.service';
import { CategoryAttributesController } from './category-attributes.controller';

@Module({
  controllers: [
    AttributesController,
    AttributeOptionsController,
    CategoryAttributesController,
  ],
  providers: [AttributesService, AttributesRepository],
  exports: [AttributesService],
})
export class AttributesModule {}
