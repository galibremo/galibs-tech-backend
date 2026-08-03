import { Injectable } from '@nestjs/common';

import {
  badRequestError,
  conflictError,
  isDatabaseUniqueViolation,
  notFoundError,
} from '../../core/errors/domain-error';
import { buildOptionFingerprint } from './helpers/build-option-fingerprint';
import { buildVariantTitle } from './helpers/build-variant-title';
import type {
  CreateOptionGroupDto,
  CreateOptionValueDto,
  CreateVariantDto,
  DeleteVariantResponse,
  OptionGroupResponse,
  OptionValueResponse,
  SyncCacheResponse,
  UpdateOptionValueDto,
  UpdateVariantDto,
  VariantResponse,
} from './schemas/variants.schema';
import { VariantsRepository } from './variants.repository';

@Injectable()
export class VariantsService {
  constructor(private readonly variantsRepository: VariantsRepository) {}

  async createOptionGroup(
    productId: string,
    data: CreateOptionGroupDto,
  ): Promise<OptionGroupResponse> {
    await this.ensureVariableProduct(productId);

    try {
      const created = await this.variantsRepository.createOptionGroup({
        productId,
        name: data.name,
        code: data.code,
        sortOrder: data.sortOrder,
      });

      if (!created) {
        throw notFoundError(
          'option_group_not_found',
          'Option group could not be created',
        );
      }

      return { ...created, values: [] };
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'option_group_code_exists',
          'An option group with this code already exists for the product.',
        );
      }
      throw error;
    }
  }

  async listOptionGroups(productId: string): Promise<OptionGroupResponse[]> {
    await this.ensureProductExists(productId);
    const groups =
      await this.variantsRepository.listOptionGroupsByProductId(productId);

    return groups.map((group) => ({
      id: group.id,
      productId: group.productId,
      name: group.name,
      code: group.code,
      sortOrder: group.sortOrder,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      values: group.values.map((value) => this.mapOptionValue(value)),
    }));
  }

  async createOptionValue(
    groupId: string,
    data: CreateOptionValueDto,
  ): Promise<OptionValueResponse> {
    const group = await this.variantsRepository.findOptionGroupById(groupId);
    if (!group) {
      throw notFoundError('option_group_not_found', 'Option group not found');
    }

    await this.ensureVariableProduct(group.productId);

    if (data.attributeOptionId) {
      const options = await this.variantsRepository.findAttributeOptionsByIds([
        data.attributeOptionId,
      ]);
      if (options.length === 0) {
        throw notFoundError(
          'attribute_option_not_found',
          'Attribute option not found',
        );
      }
    }

    try {
      const created = await this.variantsRepository.createOptionValue({
        groupId,
        label: data.label,
        slug: data.slug,
        swatchValue: data.swatchValue ?? null,
        attributeOptionId: data.attributeOptionId ?? null,
        sortOrder: data.sortOrder,
      });

      if (!created) {
        throw notFoundError(
          'option_value_not_found',
          'Option value could not be created',
        );
      }

      return this.mapOptionValue(created);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'option_value_slug_exists',
          'An option value with this slug already exists in the group.',
        );
      }
      throw error;
    }
  }

  async updateOptionValue(
    id: string,
    data: UpdateOptionValueDto,
  ): Promise<OptionValueResponse> {
    const existing = await this.variantsRepository.findOptionValueById(id);
    if (!existing) {
      throw notFoundError('option_value_not_found', 'Option value not found');
    }

    if (data.attributeOptionId) {
      const options = await this.variantsRepository.findAttributeOptionsByIds([
        data.attributeOptionId,
      ]);
      if (options.length === 0) {
        throw notFoundError(
          'attribute_option_not_found',
          'Attribute option not found',
        );
      }
    }

    try {
      const updated = await this.variantsRepository.updateOptionValue(id, data);
      if (!updated) {
        throw notFoundError(
          'option_value_not_found',
          'Option value not found after update',
        );
      }
      return this.mapOptionValue(updated);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'option_value_slug_exists',
          'An option value with this slug already exists in the group.',
        );
      }
      throw error;
    }
  }

  async deleteOptionGroup(id: string): Promise<DeleteVariantResponse> {
    const group = await this.variantsRepository.findOptionGroupById(id);
    if (!group) {
      throw notFoundError('option_group_not_found', 'Option group not found');
    }

    const usageCount =
      await this.variantsRepository.countVariantsUsingOptionGroup(id);
    if (usageCount > 0) {
      throw conflictError(
        'option_group_in_use',
        'Cannot delete option group while variants still use its values.',
      );
    }

    const deleted = await this.variantsRepository.deleteOptionGroup(id);
    if (!deleted) {
      throw notFoundError('option_group_not_found', 'Option group not found');
    }

    return { deleted: true };
  }

  async createVariant(
    productId: string,
    data: CreateVariantDto,
  ): Promise<VariantResponse> {
    await this.ensureVariableProduct(productId);

    const optionValues = await this.variantsRepository.findOptionValuesByIds(
      data.optionValueIds,
    );
    if (optionValues.length !== data.optionValueIds.length) {
      throw badRequestError('One or more option value IDs are invalid');
    }

    for (const value of optionValues) {
      if (value.group.productId !== productId) {
        throw badRequestError(
          'Option values must belong to this product option groups',
        );
      }
    }

    const groups =
      await this.variantsRepository.listOptionGroupsByProductId(productId);
    if (groups.length === 0) {
      throw badRequestError(
        'Create option groups before creating variants',
      );
    }

    const selectedGroupIds = new Set(
      optionValues.map((value) => value.groupId),
    );
    if (selectedGroupIds.size !== optionValues.length) {
      throw badRequestError(
        'Exactly one option value per option group is required',
      );
    }
    if (selectedGroupIds.size !== groups.length) {
      throw badRequestError(
        'A value must be selected for every option group',
      );
    }

    const fingerprint = buildOptionFingerprint(data.optionValueIds);
    const existingFingerprint =
      await this.variantsRepository.findVariantByFingerprint(
        productId,
        fingerprint,
      );
    if (existingFingerprint) {
      throw conflictError(
        'variant_combination_exists',
        'A variant with this option combination already exists.',
      );
    }

    const labelsByGroupOrder = groups.map((group) => {
      const value = optionValues.find((item) => item.groupId === group.id);
      return value?.label ?? '';
    });
    const title = buildVariantTitle(labelsByGroupOrder);

    const linkedAttributeOptionIds = [
      ...new Set([
        ...data.attributeOptionIds,
        ...optionValues
          .map((value) => value.attributeOptionId)
          .filter((id): id is string => Boolean(id)),
      ]),
    ];

    const attributeOptions =
      await this.variantsRepository.findAttributeOptionsByIds(
        linkedAttributeOptionIds,
      );
    if (attributeOptions.length !== linkedAttributeOptionIds.length) {
      throw badRequestError('One or more attribute option IDs are invalid');
    }

    try {
      const created = await this.variantsRepository.createVariant({
        variant: {
          productId,
          sku: data.sku,
          title,
          fingerprint,
          price: data.price,
          regularPrice: data.regularPrice ?? null,
          stockQty: data.stockQty,
          availability: data.availability,
          isDefault: data.isDefault,
          thumbnailUrl: data.thumbnailUrl ?? null,
        },
        optionValueIds: data.optionValueIds,
        attributeValues: attributeOptions.map((option) => ({
          attributeId: option.attributeId,
          attributeOptionId: option.id,
        })),
        unsetOtherDefaults: data.isDefault,
      });

      if (!created) {
        throw notFoundError(
          'variant_not_found',
          'Variant could not be created',
        );
      }

      return {
        ...created,
        optionValueIds: data.optionValueIds,
      };
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'variant_already_exists',
          'A variant with this SKU or option combination already exists.',
        );
      }
      throw error;
    }
  }

  async listVariants(productId: string): Promise<VariantResponse[]> {
    await this.ensureProductExists(productId);
    const variants =
      await this.variantsRepository.listVariantsByProductId(productId);

    return variants.map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      title: variant.title,
      fingerprint: variant.fingerprint,
      price: variant.price,
      regularPrice: variant.regularPrice,
      stockQty: variant.stockQty,
      availability: variant.availability,
      isDefault: variant.isDefault,
      thumbnailUrl: variant.thumbnailUrl,
      deletedAt: variant.deletedAt,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
      optionValueIds: variant.optionValues.map((link) => link.optionValueId),
    }));
  }

  async getVariantById(id: string): Promise<VariantResponse> {
    const variant = await this.variantsRepository.findVariantById(id);
    if (!variant) {
      throw notFoundError('variant_not_found', 'Variant not found');
    }

    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      title: variant.title,
      fingerprint: variant.fingerprint,
      price: variant.price,
      regularPrice: variant.regularPrice,
      stockQty: variant.stockQty,
      availability: variant.availability,
      isDefault: variant.isDefault,
      thumbnailUrl: variant.thumbnailUrl,
      deletedAt: variant.deletedAt,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
      optionValueIds: variant.optionValues.map((link) => link.optionValueId),
    };
  }

  async updateVariant(
    id: string,
    data: UpdateVariantDto,
  ): Promise<VariantResponse> {
    const existing = await this.variantsRepository.findVariantById(id);
    if (!existing) {
      throw notFoundError('variant_not_found', 'Variant not found');
    }

    try {
      const updated = await this.variantsRepository.updateVariant(
        id,
        existing.productId,
        data,
      );
      if (!updated) {
        throw notFoundError(
          'variant_not_found',
          'Variant not found after update',
        );
      }

      return {
        ...updated,
        optionValueIds: existing.optionValues.map(
          (link) => link.optionValueId,
        ),
      };
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflictError(
          'variant_sku_exists',
          'A variant with this SKU already exists.',
        );
      }
      throw error;
    }
  }

  async deleteVariant(id: string): Promise<DeleteVariantResponse> {
    const existing = await this.variantsRepository.findVariantById(id);
    if (!existing) {
      throw notFoundError('variant_not_found', 'Variant not found');
    }

    const deleted = await this.variantsRepository.softDeleteVariant(
      id,
      existing.productId,
    );
    if (!deleted) {
      throw notFoundError('variant_not_found', 'Variant not found');
    }

    return { deleted: true };
  }

  async syncCaches(productId: string): Promise<SyncCacheResponse> {
    await this.ensureVariableProduct(productId);
    await this.variantsRepository.syncProductCaches(productId);
    return { synced: true };
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const product = await this.variantsRepository.findProductById(productId);
    if (!product) {
      throw notFoundError('product_not_found', 'Product not found');
    }
  }

  private async ensureVariableProduct(productId: string): Promise<void> {
    const product = await this.variantsRepository.findProductById(productId);
    if (!product) {
      throw notFoundError('product_not_found', 'Product not found');
    }
    if (product.type !== 'VARIABLE') {
      throw badRequestError(
        'Variants are only supported on VARIABLE products',
      );
    }
  }

  private mapOptionValue(value: {
    id: string;
    groupId: string;
    label: string;
    slug: string;
    swatchValue: string | null;
    attributeOptionId: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }): OptionValueResponse {
    return {
      id: value.id,
      groupId: value.groupId,
      label: value.label,
      slug: value.slug,
      swatchValue: value.swatchValue,
      attributeOptionId: value.attributeOptionId,
      sortOrder: value.sortOrder,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  }
}
