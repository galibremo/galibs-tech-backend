import { Injectable } from '@nestjs/common';
import { BrandsRepository } from './brands.repository';
import { notFoundError, conflictError, isDatabaseUniqueViolation } from '../../core/errors/domain-error';
import type { BrandsListQueryDto, CreateBrandDto, UpdateBrandDto, BrandResponse, BrandListResponse, DeleteBrandResponse } from './schemas/brands.schema';

@Injectable()
export class BrandsService {
    constructor(private readonly brandsRepository: BrandsRepository) { }

    async listBrands(query: BrandsListQueryDto): Promise<BrandListResponse> {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const brands = await this.brandsRepository.listBrands(page, pageSize);

        return {
            rows: brands.rows,
            total: brands.total,
            page: brands.page,
            pageSize: brands.pageSize,
        };
    }

    async getBrandById(id: string): Promise<BrandResponse> {
        const brand = await this.brandsRepository.findBrandById(id);
        if (!brand) throw notFoundError('brand_not_found', 'Brand not found');
        return brand;
    }

    async getBrandBySlug(slug: string): Promise<BrandResponse> {
        const brand = await this.brandsRepository.findBrandBySlug(slug);
        if (!brand) throw notFoundError('brand_not_found', 'Brand not found');
        return brand;
    }

    async createBrand(data: CreateBrandDto): Promise<BrandResponse> {
        try {
            const createdBrand = await this.brandsRepository.createBrand({
                name: data.name,
                slug: data.slug,
                logo: data.logo ?? null,
            });

            if (!createdBrand) throw notFoundError('brand_not_found', 'Brand could not be created');
            return createdBrand;
        } catch (error) {
            if (isDatabaseUniqueViolation(error)) {
                throw conflictError('slug_already_exists', 'A brand with this slug already exists.');
            }
            throw error;
        }
    }

    async updateBrand(id: string, data: UpdateBrandDto): Promise<BrandResponse> {
        const targetBrand = await this.getBrandById(id);

        try {
            const updatedBrand = await this.brandsRepository.updateBrand(targetBrand.id, data);
            if (!updatedBrand) throw notFoundError('brand_not_found', 'Brand not found after update');
            return updatedBrand;
        } catch (error) {
            if (isDatabaseUniqueViolation(error)) {
                throw conflictError('slug_already_exists', 'A brand with this slug already exists.');
            }
            throw error;
        }
    }

    async deleteBrand(id: string): Promise<DeleteBrandResponse> {
        const targetBrand = await this.getBrandById(id);
        const deletedBrand = await this.brandsRepository.deleteBrand(targetBrand.id);
        if (!deletedBrand) throw notFoundError('brand_not_found', 'Brand not found');
        
        return { deleted: true };
    }
}
