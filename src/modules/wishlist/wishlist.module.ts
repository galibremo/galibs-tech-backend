import { Module } from '@nestjs/common';

import { CartModule } from '../cart/cart.module';
import { CommerceModule } from '../commerce/commerce.module';
import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './wishlist.repository';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [CommerceModule, CartModule],
  controllers: [WishlistController],
  providers: [WishlistService, WishlistRepository],
})
export class WishlistModule {}
