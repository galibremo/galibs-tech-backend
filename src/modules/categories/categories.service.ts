import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { notFoundError, conflictError, isDatabaseUniqueViolation } from '../../core/errors/domain-error';
import type { CategoriesListQueryDto, CreateCategoryDto, UpdateCategoryDto, CategoryResponse, CategoriesListResponse, DeleteCategoryResponse } from './schemas/categories.schema';

export type CategoryTreeItem = CategoryResponse & {
    children: CategoryTreeItem[];
};

@Injectable()
export class CategoriesService {
    constructor(private readonly categoriesRepository: CategoriesRepository) { }

    async listCategories(query: CategoriesListQueryDto): Promise<CategoriesListResponse> {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const categories = await this.categoriesRepository.listCategories(page, pageSize);

        return {
            rows: categories.rows,
            total: categories.total,
            page: categories.page,
            pageSize: categories.pageSize,
        };
    }
    
    async getCategoryTree(): Promise<CategoryTreeItem[]> {
        const categories = await this.categoriesRepository.getAllCategories();
        
        // Build the tree in O(n) time
        const categoryMap = new Map<string, CategoryTreeItem>();
        const tree: CategoryTreeItem[] = [];

        // First pass: map all categories to the format and store by id
        for (const cat of categories) {
            categoryMap.set(cat.id, { ...cat, children: [] });
        }

        // Second pass: link children to their parents
        for (const cat of categories) {
            const mappedCat = categoryMap.get(cat.id)!;
            
            if (cat.parentId) {
                const parent = categoryMap.get(cat.parentId);
                if (parent) {
                    parent.children.push(mappedCat);
                } else {
                    // If parent is missing, we could attach it to root or handle it differently.
                    // For now, we'll attach to root to avoid losing orphaned categories.
                    tree.push(mappedCat);
                }
            } else {
                tree.push(mappedCat);
            }
        }

        return tree;
    }

    async getCategoryById(id: string): Promise<CategoryResponse> {
        const category = await this.categoriesRepository.findCategoryById(id);
        if (!category) throw notFoundError('category_not_found', 'Category not found');
        return category;
    }

    async getCategoryBySlug(slug: string): Promise<CategoryResponse> {
        const category = await this.categoriesRepository.findCategoryBySlug(slug);
        if (!category) throw notFoundError('category_not_found', 'Category not found');
        return category;
    }

    async createCategory(data: CreateCategoryDto): Promise<CategoryResponse> {
        try {
            const createdCategory = await this.categoriesRepository.createCategory({
                name: data.name,
                slug: data.slug,
                parentId: data.parentId ?? null,
                path: data.path,
                depth: data.depth,
                description: data.description ?? null,
                shortDescription: data.shortDescription ?? null,
                imageUrl: data.imageUrl ?? null,
                isActive: data.isActive,
                isFeatured: data.isFeatured,
                showInMenu: data.showInMenu,
                sortOrder: data.sortOrder,
                minPrice: data.minPrice ?? null,
                maxPrice: data.maxPrice ?? null,
                productCount: data.productCount,
                metaTitle: data.metaTitle ?? null,
                metaDescription: data.metaDescription ?? null,
                seoContent: data.seoContent ?? null,
            });

            if (!createdCategory) throw notFoundError('category_not_found', 'Category could not be created');
            return createdCategory;
        } catch (error) {
            if (isDatabaseUniqueViolation(error)) {
                throw conflictError('slug_already_exists', 'A category with this slug already exists.');
            }
            throw error;
        }
    }

    async updateCategory(id: string, data: UpdateCategoryDto): Promise<CategoryResponse> {
        const targetCategory = await this.getCategoryById(id);

        try {
            const updatedCategory = await this.categoriesRepository.updateCategory(targetCategory.id, data);
            if (!updatedCategory) throw notFoundError('category_not_found', 'Category not found after update');
            return updatedCategory;
        } catch (error) {
            if (isDatabaseUniqueViolation(error)) {
                throw conflictError('slug_already_exists', 'A category with this slug already exists.');
            }
            throw error;
        }
    }

    async deleteCategory(id: string): Promise<DeleteCategoryResponse> {
        const targetCategory = await this.getCategoryById(id);
        const deletedCategory = await this.categoriesRepository.deleteCategory(targetCategory.id);
        if (!deletedCategory) throw notFoundError('category_not_found', 'Category not found');
        
        return { deleted: true };
    }
}
