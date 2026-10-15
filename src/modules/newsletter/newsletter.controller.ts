import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { NewsletterService } from './newsletter.service';
import {
  NewsletterSubscribeApiResponseSchema,
  type NewsletterSubscribeApiResponse,
  SubscribeNewsletterSchema,
  type SubscribeNewsletterDto,
} from './schemas/newsletter.schema';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /** Public. Tighter than the global throttle since it writes on every call. */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 2, ttl: 1000 }, long: { limit: 10, ttl: 60000 } })
  async subscribe(
    @Req() request: ExpressRequest,
    @Body(new ZodValidationPipe(SubscribeNewsletterSchema))
    body: SubscribeNewsletterDto,
  ): Promise<NewsletterSubscribeApiResponse> {
    const result = await this.newsletterService.subscribe(body, {
      ipAddress: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    });

    return NewsletterSubscribeApiResponseSchema.parse(
      createApiResponse({
        statusCode: HttpStatus.OK,
        message: result.isNew
          ? 'Subscribed to the newsletter'
          : 'Already subscribed to the newsletter',
        data: result,
        path: request.url,
      }),
    );
  }
}
