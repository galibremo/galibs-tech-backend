import { Body, Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { SpecificationsService } from './specifications.service';
import {
    CreateSpecGroupSchema, type CreateSpecGroupDto,
    CreateSpecFieldSchema, type CreateSpecFieldDto,
    UpsertProductSpecsSchema, type UpsertProductSpecsDto,
} from './schemas/specifications.schema';

@Controller()
export class SpecificationsController {
    constructor(private readonly specificationsService: SpecificationsService) { }

    @Post('spec-groups')
    @UseGuards(AuthGuard)
    @Roles(['SUPER_ADMIN'])
    async createSpecGroup(
        @Req() request: ExpressRequest,
        @Body(new ZodValidationPipe(CreateSpecGroupSchema)) body: CreateSpecGroupDto,
    ) {
        const group = await this.specificationsService.createGroup(body);
        return createApiResponse({
            statusCode: HttpStatus.CREATED,
            message: 'Specification group created successfully',
            data: group,
            path: request.url,
        });
    }

    @Post('spec-groups/:id/fields')
    @UseGuards(AuthGuard)
    @Roles(['SUPER_ADMIN'])
    async createSpecField(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() request: ExpressRequest,
        @Body(new ZodValidationPipe(CreateSpecFieldSchema)) body: CreateSpecFieldDto,
    ) {
        const field = await this.specificationsService.createField(id, body);
        return createApiResponse({
            statusCode: HttpStatus.CREATED,
            message: 'Specification field created successfully',
            data: field,
            path: request.url,
        });
    }

    @Put('products/:id/specifications')
    @UseGuards(AuthGuard)
    @Roles(['SUPER_ADMIN'])
    async upsertProductSpecs(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() request: ExpressRequest,
        @Body(new ZodValidationPipe(UpsertProductSpecsSchema)) body: UpsertProductSpecsDto,
    ) {
        await this.specificationsService.upsertProductSpecs(id, body);
        return createApiResponse({
            statusCode: HttpStatus.OK,
            message: 'Product specifications updated successfully',
            data: null,
            path: request.url,
        });
    }

    @Get('products/:id/specifications')
    async getProductSpecs(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() request: ExpressRequest,
    ) {
        const specs = await this.specificationsService.getProductSpecs(id);
        return createApiResponse({
            statusCode: HttpStatus.OK,
            message: 'Product specifications fetched successfully',
            data: specs,
            path: request.url,
        });
    }
}
