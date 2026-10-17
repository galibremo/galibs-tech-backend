import { HttpStatus, Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { DomainError, notFoundError, conflictError, getDatabaseUniqueViolation } from '../../core/errors/domain-error';
import type { CategoriesListQueryDto, CreateCategoryDto, UpdateCategoryDto, CategoryResponse, CategoriesListResponse, DeleteCategoryResponse } from './schemas/categories.schema';

export type CategoryTreeItem = CategoryResponse & {
    children: CategoryTreeItem[];
};

@Injectable()
export class CategoriesService {
    constructor(private readonly categoriesRepository: CategoriesRepository) { }

    async listCategories(query: CategoriesListQueryDto): Promise<CategoriesListResponse> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const categories = await this.categoriesRepository.listCategories({
            page,
            limit,
            search: query.search,
            isActive: query.isActive,
            sort: query.sort,
            dir: query.dir,
        });

        return {
            rows: categories.rows,
            total: categories.total,
            page: categories.page,
            limit: categories.limit,
        };
    }
    
    /**
     * Storefront menu tree: active categories with `showInMenu`, ordered by
     * `sortOrder` then name at every level. A category whose parent is hidden
     * (inactive or not in the menu) is dropped along with its subtree rather
     * than promoted to the root.
     */
    async getCategoryTree(): Promise<CategoryTreeItem[]> {
        const categories = await this.categoriesRepository.getMenuCategories();

        const categoryMap = new Map<string, CategoryTreeItem>();
        for (const cat of categories) {
            categoryMap.set(cat.id, { ...cat, children: [] });
        }

        const tree: CategoryTreeItem[] = [];
        for (const cat of categories) {
            const mappedCat = categoryMap.get(cat.id)!;
            if (!cat.parentId) {
                tree.push(mappedCat);
                continue;
            }
            const parent = categoryMap.get(cat.parentId);
            if (parent) {
                parent.children.push(mappedCat);
            }
            // else: parent hidden, so this branch is hidden too.
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
        const parent = await this.resolveParent(data.parentId ?? null);
        const { path, depth } = this.buildPathAndDepth(parent, data.slug);

        try {
            const createdCategory = await this.categoriesRepository.createCategory({
                name: data.name,
                slug: data.slug,
                parentId: parent?.id ?? null,
                path,
                depth,
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
            throw this.mapUniqueViolation(error);
        }
    }

    async updateCategory(id: string, data: UpdateCategoryDto): Promise<CategoryResponse> {
        const targetCategory = await this.getCategoryById(id);

        const nextSlug = data.slug ?? targetCategory.slug;
        const nextParentId = data.parentId === undefined ? targetCategory.parentId : data.parentId;
        const hierarchyChanged = nextSlug !== targetCategory.slug || nextParentId !== targetCategory.parentId;

        try {
            if (!hierarchyChanged) {
                const updatedCategory = await this.categoriesRepository.updateCategory(targetCategory.id, data);
                if (!updatedCategory) throw notFoundError('category_not_found', 'Category not found after update');
                return updatedCategory;
            }

            if (nextParentId === targetCategory.id) {
                throw this.invalidParentError('A category cannot be its own parent');
            }

            const parent = await this.resolveParent(nextParentId);
            if (parent && this.isSameOrDescendantPath(parent.path, targetCategory.path)) {
                throw this.invalidParentError('A category cannot be moved under one of its own descendants');
            }

            const { path, depth } = this.buildPathAndDepth(parent, nextSlug);
            const updatedCategory = await this.categoriesRepository.updateCategoryAndSubtree(
                targetCategory.id,
                { ...data, slug: nextSlug, parentId: parent?.id ?? null, path, depth },
                targetCategory.path,
                path,
                depth - targetCategory.depth,
            );
            if (!updatedCategory) throw notFoundError('category_not_found', 'Category not found after update');
            return updatedCategory;
        } catch (error) {
            throw this.mapUniqueViolation(error);
        }
    }

    async deleteCategory(id: string): Promise<DeleteCategoryResponse> {
        const targetCategory = await this.getCategoryById(id);
        const deletedCategory = await this.categoriesRepository.deleteCategory(targetCategory.id);
        if (!deletedCategory) throw notFoundError('category_not_found', 'Category not found');
        
        return { deleted: true };
    }

    /** Loads the parent row for a `parentId`, or null for a root category. */
    private async resolveParent(parentId: string | null): Promise<CategoryResponse | null> {
        if (!parentId) return null;
        const parent = await this.categoriesRepository.findCategoryById(parentId);
        if (!parent) throw notFoundError('parent_category_not_found', 'Parent category not found');
        return parent;
    }

    /** path = parent.path + "/" + slug (or just slug for a root); depth = parent.depth + 1 (0 for a root). */
    private buildPathAndDepth(parent: CategoryResponse | null, slug: string): { path: string; depth: number } {
        return parent
            ? { path: `${parent.path}/${slug}`, depth: parent.depth + 1 }
            : { path: slug, depth: 0 };
    }

    /** True when `candidatePath` is `ancestorPath` itself or lies somewhere below it. */
    private isSameOrDescendantPath(candidatePath: string, ancestorPath: string): boolean {
        return candidatePath === ancestorPath || candidatePath.startsWith(`${ancestorPath}/`);
    }

    private invalidParentError(message: string): DomainError {
        return new DomainError('invalid_parent', message, HttpStatus.BAD_REQUEST);
    }

    /**
     * Translates a Postgres unique violation into a 409 that names the field
     * (`categories_path_uidx` -> computed path, otherwise slug). Any other error
     * is returned unchanged so the caller can rethrow it.
     */
    private mapUniqueViolation(error: unknown): unknown {
        const violation = getDatabaseUniqueViolation(error);
        if (!violation) return error;

        if (violation.constraint === 'categories_path_uidx') {
            return conflictError('path_already_exists', 'A category with this computed path already exists.');
        }
        return conflictError('slug_already_exists', 'A category with this slug already exists.');
    }
}
