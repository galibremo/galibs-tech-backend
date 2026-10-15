import { Module } from '@nestjs/common';

import { NewsletterController } from './newsletter.controller';
import { NewsletterRepository } from './newsletter.repository';
import { NewsletterService } from './newsletter.service';

@Module({
  controllers: [NewsletterController],
  providers: [NewsletterService, NewsletterRepository],
})
export class NewsletterModule {}
