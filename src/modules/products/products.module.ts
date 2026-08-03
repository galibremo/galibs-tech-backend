import { Module } from '@nestjs/common';

import { ProductAttributesController } from './product-attributes.controller';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductImagesController } from './product-images.controller';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  controllers: [
    ProductsController,
    ProductImagesController,
    ProductCategoriesController,
    ProductAttributesController,
  ],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
