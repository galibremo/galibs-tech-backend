import { Body, Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { BrandsService } from './brands.service';
import { 
    BrandsListQuerySchema, type BrandsListQueryDto,
    CreateBrandSchema, type CreateBrandDto,
    UpdateBrandSchema, type UpdateBrandDto,
    BrandApiResponseSchema, type BrandApiResponse,
    BrandListApiResponseSchema, type BrandListApiResponse,
    DeleteBrandApiResponseSchema, type DeleteBrandApiResponse,
    type BrandResponse
} from './schemas/brands.schema';

@UseGuards(AuthGuard)
@Roles(['SUPER_ADMIN'])
@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) {}

    @Get()
    async listBrands(
        @Req() request: ExpressRequest,
        @Query(new ZodValidationPipe(BrandsListQuerySchema)) query: BrandsListQueryDto,
    ): Promise<BrandListApiResponse> {
        const brands = await this.brandsService.listBrands(query);
        return BrandListApiResponseSchema.parse(
            createApiResponse({
                statusCode: HttpStatus.OK,
                message: 'Brands fetched successfully',
                data: brands,
                path: request.url,
            })
        );
    }

    @Get(':id')
    async getBrand(
        @Req() request: ExpressRequest,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<BrandApiResponse> {
        const brand = await this.brandsService.getBrandById(id);
        return this.brandResponse(HttpStatus.OK, 'Brand fetched successfully', brand, request.url);
    }

    @Get('slug/:slug')
    async getBrandBySlug(
        @Req() request: ExpressRequest,
        @Param('slug') slug: string,
    ): Promise<BrandApiResponse> {
        const brand = await this.brandsService.getBrandBySlug(slug);
        return this.brandResponse(HttpStatus.OK, 'Brand fetched successfully', brand, request.url);
    }

    @Post()
    async createBrand(
        @Req() request: ExpressRequest,
        @Body(new ZodValidationPipe(CreateBrandSchema)) body: CreateBrandDto,
    ): Promise<BrandApiResponse> {
        const brand = await this.brandsService.createBrand(body);
        return this.brandResponse(HttpStatus.CREATED, 'Brand created successfully', brand, request.url);
    }

    @Patch(':id')
    async updateBrand(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() request: ExpressRequest,
        @Body(new ZodValidationPipe(UpdateBrandSchema)) body: UpdateBrandDto,
    ): Promise<BrandApiResponse> {
        const brand = await this.brandsService.updateBrand(id, body);
        return this.brandResponse(HttpStatus.OK, 'Brand updated successfully', brand, request.url);
    }

    @Delete(':id')
    async deleteBrand(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() request: ExpressRequest,
    ): Promise<DeleteBrandApiResponse> {
        const result = await this.brandsService.deleteBrand(id);
        return DeleteBrandApiResponseSchema.parse(
            createApiResponse({
                statusCode: HttpStatus.OK,
                message: 'Brand deleted successfully',
                data: result,
                path: request.url,
            })
        );
    }

    private brandResponse(statusCode: HttpStatus, message: string, brand: BrandResponse, path: string): BrandApiResponse {
        return BrandApiResponseSchema.parse(
            createApiResponse({
                statusCode,
                message,
                data: brand,
                path,
            })
        );
    }
}
