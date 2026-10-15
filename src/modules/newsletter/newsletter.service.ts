import { Injectable } from '@nestjs/common';

import { NewsletterRepository } from './newsletter.repository';
import type {
  NewsletterSubscribeResponse,
  SubscribeNewsletterDto,
} from './schemas/newsletter.schema';

export interface SubscribeContext {
  ipAddress: string | null;
  userAgent: string | null;
}

@Injectable()
export class NewsletterService {
  constructor(private readonly newsletterRepository: NewsletterRepository) {}

  async subscribe(
    data: SubscribeNewsletterDto,
    context: SubscribeContext,
  ): Promise<NewsletterSubscribeResponse> {
    const email = data.email.trim().toLowerCase();

    const existing = await this.newsletterRepository.findByEmail(email);
    const isNew = !existing || existing.status !== 'SUBSCRIBED';

    const row = await this.newsletterRepository.upsertSubscribed({
      email,
      source: data.source ?? null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { email: row.email, status: row.status, isNew };
  }
}
