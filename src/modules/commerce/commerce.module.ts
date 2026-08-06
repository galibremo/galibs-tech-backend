import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CommerceCatalogService } from './commerce-catalog.service';
import { CommerceShopperService } from './commerce-shopper.service';

@Module({
  imports: [AuthModule],
  providers: [CommerceShopperService, CommerceCatalogService],
  exports: [CommerceShopperService, CommerceCatalogService],
})
export class CommerceModule {}
