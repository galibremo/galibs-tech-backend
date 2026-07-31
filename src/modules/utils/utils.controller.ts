import { Controller, Post, Body, Req, HttpStatus } from '@nestjs/common';
import { UtilsService } from './utils.service';

import { GenerateSlugSchema, type GenerateSlugDto } from './schemas/utils.schema';
import { type Request as ExpressRequest } from 'express';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';

@Controller('utils')
export class UtilsController {
    constructor(private readonly utilsService: UtilsService) { }

    @Post('generate-slug')
    generateSlug(
        @Req() request: ExpressRequest,
        @Body(new ZodValidationPipe(GenerateSlugSchema)) body: GenerateSlugDto,
    ) {
        const slug = this.utilsService.generateSlug(body.text);

        return {
            success: true,
            statusCode: HttpStatus.OK,
            message: 'Slug generated successfully',
            data: { slug },
            timestamp: new Date().toISOString(),
            path: request.url,
        };
    }
}
