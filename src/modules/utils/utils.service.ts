import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
    generateSlug(text: string): string {
        return text
            .toString()
            .toLowerCase()
            .trim()
            // Replace spaces with -
            .replace(/\s+/g, '-')
            // Remove all non-word chars (except hyphens)
            .replace(/[^\w-]+/g, '')
            // Replace multiple - with single -
            .replace(/--+/g, '-')
            // Remove trailing -
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
}
