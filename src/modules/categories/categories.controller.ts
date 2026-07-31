import { Body, Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import type { Request as ExpressRequest } from 'express';

import { createApiResponse } from '../../shared/helpers/api-response.helper';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CategoriesService } from './categories.service';
import {
    CategoriesListQuerySchema, type CategoriesListQueryDto,
    CreateCategorySchema, type CreateCategoryDto,
    UpdateCategorySchema, type UpdateCategoryDto,
    CategoryApiResponseSchema, type CategoryApiResponse,
    CategoriesListApiResponseSchema, type CategoriesListApiResponse,
    DeleteCategoryApiResponseSchema, type DeleteCategoryApiResponse,
    type CategoryResponse
} from './schemas/categories.schema';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    async listCategories(
        @Req() request: ExpressRequest,
        @Query(new ZodValidationPipe(CategoriesListQuerySchema)) query: CategoriesListQueryDto,
    ): Promise<CategoriesListApiResponse> {
        const categories = await this.categoriesService.listCategories(query);
        return CategoriesListApiResponseSchema.parse(
            createApiResponse({
                statusCode: HttpStatus.OK,
                message: 'Categories fetched successfully',
                data: categories,
                path: request.url,
            })
        );
    }

    @Get('tree')
    async getCategoryTree(
        @Req() request: ExpressRequest,
    ): Promise<Record<string, unknown>> {
        const tree = await this.categoriesService.getCategoryTree();
        return createApiResponse({
            statusCode: HttpStatus.OK,
            message: 'Category tree fetched successfully',
            data: tree,
            path: request.url,
        });
    }

    @Get(':id')
    async getCategory(
        @Req() request: ExpressRequest,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<CategoryApiResponse> {
        const category = await this.categoriesService.getCategoryById(id);
        return this.categoryResponse(HttpStatus.OK, 'Category fetched successfully', category, request.url);
    }

    @Get('slug/:slug')
    async getCategoryBySlug(
        @Req() request: ExpressRequest,
        @Param('slug') slug: string,
    ): Promise<CategoryApiResponse> {
        const category = await this.categoriesService.getCategoryBySlug(slug);
        return this.categoryResponse(HttpStatus.OK, 'Category fetched successfully', category, request.url);
    }

    @Post()
    @UseGuards(AuthGuard)
    @Roles(['SUPER_ADMIN'])
    async createCategory(
        @Req() request: ExpressRequest,
        @Body(new ZodValidationPipe(CreateCategorySchema)) body: CreateCategoryDto,
    ): Promise<CategoryApiResponse> {
        const category = await this.categoriesService.createCategory(body);
        return this.categoryResponse(HttpStatus.CREATED, 'Category created successfully', category, request.url);
    }

    @Patch(':id')
    @UseGuards(AuthGuard)
    @Roles(['SUPER_ADMIN'])
    async updateCategory(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() request: ExpressRequest,
        @Body(new ZodValidationPipe(UpdateCategorySchema)) body: UpdateCategoryDto,
    ): Promise<CategoryApiResponse> {
        const category = await this.categoriesService.updateCategory(id, body);
        return this.categoryResponse(HttpStatus.OK, 'Category updated successfully', category, request.url);
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    @Roles(['SUPER_ADMIN'])
    async deleteCategory(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() request: ExpressRequest,
    ): Promise<DeleteCategoryApiResponse> {
        const result = await this.categoriesService.deleteCategory(id);
        return DeleteCategoryApiResponseSchema.parse(
            createApiResponse({
                statusCode: HttpStatus.OK,
                message: 'Category deleted successfully',
                data: result,
                path: request.url,
            })
        );
    }

    private categoryResponse(statusCode: HttpStatus, message: string, category: CategoryResponse, path: string): CategoryApiResponse {
        return CategoryApiResponseSchema.parse(
            createApiResponse({
                statusCode,
                message,
                data: category,
                path,
            })
        );
    }
}
