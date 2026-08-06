import { Injectable } from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';
import { z } from 'zod';

import { badRequestError } from '../../core/errors/domain-error';
import { AuthService } from '../auth/auth.service';

const UuidSchema = z.uuid();

export type ShopperContext =
  | {
      kind: 'user';
      userId: number;
      guestToken?: string;
    }
  | {
      kind: 'guest';
      guestToken: string;
    };

@Injectable()
export class CommerceShopperService {
  constructor(private readonly authService: AuthService) {}

  /**
   * Prefer authenticated session; otherwise require X-Guest-Token (UUID).
   * When both are present, return user context with guestToken for merge.
   */
  async resolveShopper(
    requestHeaders: IncomingHttpHeaders,
  ): Promise<ShopperContext> {
    const userId =
      await this.authService.tryGetSessionUserId(requestHeaders);
    const guestToken = this.readGuestToken(requestHeaders);

    if (userId != null) {
      return {
        kind: 'user',
        userId,
        guestToken,
      };
    }

    if (!guestToken) {
      throw badRequestError(
        'X-Guest-Token header is required when not logged in',
      );
    }

    return { kind: 'guest', guestToken };
  }

  async requireUser(
    requestHeaders: IncomingHttpHeaders,
  ): Promise<{ userId: number }> {
    const userId =
      await this.authService.tryGetSessionUserId(requestHeaders);

    if (userId == null) {
      throw badRequestError('Authentication is required');
    }

    return { userId };
  }

  private readGuestToken(
    requestHeaders: IncomingHttpHeaders,
  ): string | undefined {
    const raw = requestHeaders['x-guest-token'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) {
      return undefined;
    }

    const parsed = UuidSchema.safeParse(value);
    if (!parsed.success) {
      throw badRequestError('X-Guest-Token must be a valid UUID');
    }

    return parsed.data;
  }
}
