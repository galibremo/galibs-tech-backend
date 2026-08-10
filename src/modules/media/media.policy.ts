import { unauthorizedError } from '../../core/errors/domain-error';

const RESTRICTED_UPLOAD_FOLDERS = new Set(['hero', 'promotions', 'offers']);

export class MediaPolicy {
  static assertCanUpload(actor?: CurrentUser, folder?: string): void {
    if (!actor) {
      throw unauthorizedError('You must be logged in to upload media.');
    }

    if (
      folder &&
      RESTRICTED_UPLOAD_FOLDERS.has(folder) &&
      actor.role !== 'SUPER_ADMIN'
    ) {
      throw unauthorizedError(
        'Only administrators can upload to promotional folders.',
      );
    }
  }
}
