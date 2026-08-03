import { Injectable } from '@nestjs/common';

import {
  conflictError,
  isDatabaseUniqueViolation,
  notFoundError,
} from '../../core/errors/domain-error';
import { AttributesRepository } from './attributes.repository';
import type {
  AssignCategoryAttributeDto,
  AttributeListResponse,
  AttributeOptionListResponse,
  AttributeOptionResponse,
  AttributeResponse,
  AttributesListQueryDto,
  AttributeWithOptionsResponse,
  CategoryAttributeResponse,
  CategoryFiltersResponse,
  CreateAttributeDto,
  CreateAttributeOptionDto,
  DeleteAttributeOptionResponse,
  UpdateAttributeDto,
  UpdateAttributeOptionDto,
  UpdateCategoryAttributeDto,
} from './schemas/attributes.schema';

@Injectable()
export class AttributesService {
  constructor(private readonly attributesRepository: AttributesRepository) {}

  async listAttributes(
    query: AttributesListQueryDto,
  ): Promise<AttributeListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const attributes = await this.attributesRepository.listAttributes(
      page,
      pageSize,
    );

    return {
      rows: attributes.rows,
      total: attributes.total,
      page: attributes.page,
      pageSize: attributes.pageSize,
    };
  }

  async getAttributeById(id: string): Promise<AttributeWithOptionsResponse> {
    const attribute =
      await this.attributesRepository.findAttributeWithOptions(id);
    if (!attribute) {
      throw notFoundError('attribute_not_found', 'Attribute not found');
    }
    return attribute;
  }

  async getAttributeByCode(
    code: string,
  ): Promise<AttributeWithOptionsResponse> {
    const attribute =
      await this.attributesRepository.findAttributeWithOptionsByCode(code);
    if (!attribute) {
      throw notFoundError('attribute_not_found', 'Attribute not found');
    }
    return attribute;
  }

  async createAttribute(data: CreateAttributeDto): Promise<AttributeResponse> {
    try {
      const created = await this.attributesRepository.createAttribute({
        code: data.code,
        name: data.name,
        inputType: data.inputType,
        dataType: data.dataType,
        unit: data.unit ?? null,
        description: data.description ?? null,
        isFilterable: data.isFilterable,
        isBrandAttribute: data.isBrandAttribute,
        sortOrder: data.sortOrder,
      });

      if (!created) {
        throw notFoundError(
          'attribute_not_found',
          'Attribute could not be created',
        );
      }
      return created;
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'code_already_exists',
          'An attribute with this code already exists.',
        );
      }
      throw error;
    }
  }

  async updateAttribute(
    id: string,
    data: UpdateAttributeDto,
  ): Promise<AttributeResponse> {
    const target = await this.attributesRepository.findAttributeById(id);
    if (!target) {
      throw notFoundError('attribute_not_found', 'Attribute not found');
    }

    try {
      const updated = await this.attributesRepository.updateAttribute(
        target.id,
        data,
      );
      if (!updated) {
        throw notFoundError(
          'attribute_not_found',
          'Attribute not found after update',
        );
      }
      return updated;
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'code_already_exists',
          'An attribute with this code already exists.',
        );
      }
      throw error;
    }
  }

  async listOptions(
    attributeId: string,
  ): Promise<AttributeOptionListResponse> {
    const attribute =
      await this.attributesRepository.findAttributeById(attributeId);
    if (!attribute) {
      throw notFoundError('attribute_not_found', 'Attribute not found');
    }

    const rows =
      await this.attributesRepository.listOptionsByAttributeId(attributeId);
    return { rows, total: rows.length };
  }

  async createOption(
    attributeId: string,
    data: CreateAttributeOptionDto,
  ): Promise<AttributeOptionResponse> {
    const attribute =
      await this.attributesRepository.findAttributeById(attributeId);
    if (!attribute) {
      throw notFoundError('attribute_not_found', 'Attribute not found');
    }

    if (data.brandId) {
      await this.ensureBrandExists(data.brandId);
    }

    const slug = data.slug ?? this.generateSlug(data.label);

    try {
      const created = await this.attributesRepository.createOption({
        attributeId,
        label: data.label,
        slug,
        brandId: data.brandId ?? null,
        sortValue: data.sortValue ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      });

      if (!created) {
        throw notFoundError(
          'attribute_option_not_found',
          'Attribute option could not be created',
        );
      }
      return created;
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'option_slug_already_exists',
          'An option with this slug already exists for this attribute.',
        );
      }
      throw error;
    }
  }

  async updateOption(
    id: string,
    data: UpdateAttributeOptionDto,
  ): Promise<AttributeOptionResponse> {
    const target = await this.attributesRepository.findOptionById(id);
    if (!target) {
      throw notFoundError(
        'attribute_option_not_found',
        'Attribute option not found',
      );
    }

    if (data.brandId) {
      await this.ensureBrandExists(data.brandId);
    }

    const payload: UpdateAttributeOptionDto = { ...data };
    if (data.label && !data.slug) {
      payload.slug = this.generateSlug(data.label);
    }

    try {
      const updated = await this.attributesRepository.updateOption(
        target.id,
        payload,
      );
      if (!updated) {
        throw notFoundError(
          'attribute_option_not_found',
          'Attribute option not found after update',
        );
      }
      return updated;
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'option_slug_already_exists',
          'An option with this slug already exists for this attribute.',
        );
      }
      throw error;
    }
  }

  async deleteOption(id: string): Promise<DeleteAttributeOptionResponse> {
    const target = await this.attributesRepository.findOptionById(id);
    if (!target) {
      throw notFoundError(
        'attribute_option_not_found',
        'Attribute option not found',
      );
    }

    const deleted = await this.attributesRepository.deactivateOption(
      target.id,
    );
    if (!deleted) {
      throw notFoundError(
        'attribute_option_not_found',
        'Attribute option not found',
      );
    }

    return { deleted: true };
  }

  async assignCategoryAttribute(
    categoryId: string,
    data: AssignCategoryAttributeDto,
  ): Promise<CategoryAttributeResponse> {
    await this.ensureCategoryExists(categoryId);

    const attribute = await this.attributesRepository.findAttributeById(
      data.attributeId,
    );
    if (!attribute) {
      throw notFoundError('attribute_not_found', 'Attribute not found');
    }

    const existing = await this.attributesRepository.findCategoryAttribute(
      categoryId,
      data.attributeId,
    );
    if (existing) {
      throw conflictError(
        'category_attribute_already_assigned',
        'This attribute is already assigned to the category.',
      );
    }

    try {
      const created = await this.attributesRepository.assignCategoryAttribute({
        categoryId,
        attributeId: data.attributeId,
        sortOrder: data.sortOrder,
        isCollapsed: data.isCollapsed,
        showProductCount: data.showProductCount,
      });

      if (!created) {
        throw notFoundError(
          'category_attribute_not_found',
          'Category attribute could not be assigned',
        );
      }
      return created;
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'category_attribute_already_assigned',
          'This attribute is already assigned to the category.',
        );
      }
      throw error;
    }
  }

  async updateCategoryAttribute(
    categoryId: string,
    attributeId: string,
    data: UpdateCategoryAttributeDto,
  ): Promise<CategoryAttributeResponse> {
    await this.ensureCategoryExists(categoryId);

    const existing = await this.attributesRepository.findCategoryAttribute(
      categoryId,
      attributeId,
    );
    if (!existing) {
      throw notFoundError(
        'category_attribute_not_found',
        'Category attribute assignment not found',
      );
    }

    const updated = await this.attributesRepository.updateCategoryAttribute(
      categoryId,
      attributeId,
      data,
    );
    if (!updated) {
      throw notFoundError(
        'category_attribute_not_found',
        'Category attribute assignment not found after update',
      );
    }
    return updated;
  }

  async getCategoryFilters(
    categoryId: string,
  ): Promise<CategoryFiltersResponse> {
    await this.ensureCategoryExists(categoryId);

    const mappings =
      await this.attributesRepository.getCategoryFilters(categoryId);

    return {
      categoryId,
      filters: mappings.map((mapping) => ({
        attributeId: mapping.attribute.id,
        code: mapping.attribute.code,
        name: mapping.attribute.name,
        inputType: mapping.attribute.inputType,
        dataType: mapping.attribute.dataType,
        unit: mapping.attribute.unit,
        sortOrder: mapping.sortOrder,
        isCollapsed: mapping.isCollapsed,
        showProductCount: mapping.showProductCount,
        options: mapping.attribute.options.map((option) => ({
          id: option.id,
          label: option.label,
          slug: option.slug,
          brandId: option.brandId,
          sortValue: option.sortValue,
          sortOrder: option.sortOrder,
        })),
      })),
    };
  }

  private async ensureBrandExists(brandId: string): Promise<void> {
    const brand = await this.attributesRepository.findBrandById(brandId);
    if (!brand) {
      throw notFoundError('brand_not_found', 'Brand not found');
    }
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const category =
      await this.attributesRepository.findCategoryById(categoryId);
    if (!category) {
      throw notFoundError('category_not_found', 'Category not found');
    }
  }

  private generateSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}
