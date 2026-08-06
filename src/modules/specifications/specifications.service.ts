import { Injectable } from '@nestjs/common';

import { notFoundError } from '../../core/errors/domain-error';
import {
  CreateSpecFieldDto,
  CreateSpecGroupDto,
  UpsertProductSpecsDto,
} from './schemas/specifications.schema';
import { SpecificationsRepository } from './specifications.repository';

@Injectable()
export class SpecificationsService {
  constructor(
    private readonly specificationsRepository: SpecificationsRepository,
  ) {}

  async createGroup(data: CreateSpecGroupDto) {
    return this.specificationsRepository.createGroup(data);
  }

  async createField(groupId: string, data: CreateSpecFieldDto) {
    const group = await this.specificationsRepository.findGroupById(groupId);
    if (!group) {
      throw notFoundError('spec_group_not_found', 'Specification group not found');
    }

    return this.specificationsRepository.createField({
      ...data,
      groupId,
    });
  }

  async upsertProductSpecs(productId: string, data: UpsertProductSpecsDto) {
    await this.ensureProductExists(productId);
    await this.ensureFieldsExist(data.specs.map((spec) => spec.fieldId));

    await this.specificationsRepository.upsertProductSpecs(
      productId,
      data.specs,
    );

    return this.getGroupedProductSpecs(productId);
  }

  async getProductSpecs(productId: string) {
    await this.ensureProductExists(productId);
    return this.getGroupedProductSpecs(productId);
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const product =
      await this.specificationsRepository.findProductById(productId);
    if (!product) {
      throw notFoundError('product_not_found', 'Product not found');
    }
  }

  private async ensureFieldsExist(fieldIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(fieldIds)];
    if (uniqueIds.length === 0) {
      return;
    }

    const fields =
      await this.specificationsRepository.findFieldsByIds(uniqueIds);
    if (fields.length !== uniqueIds.length) {
      throw notFoundError(
        'spec_field_not_found',
        'One or more specification fields were not found',
      );
    }
  }

  private async getGroupedProductSpecs(productId: string) {
    const specs =
      await this.specificationsRepository.getProductSpecs(productId);

    const grouped = specs.reduce(
      (acc, current) => {
        const groupName = current.field.group.name;
        const sortOrder = current.field.group.sortOrder;

        if (!acc[groupName]) {
          acc[groupName] = {
            group: groupName,
            sortOrder,
            items: [],
          };
        }

        acc[groupName].items.push({
          name: current.field.name,
          value: current.value,
          sortOrder: current.field.sortOrder,
        });

        return acc;
      },
      {} as Record<
        string,
        {
          group: string;
          sortOrder: number;
          items: { name: string; value: string; sortOrder: number }[];
        }
      >,
    );

    const result = Object.values(grouped).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    result.forEach((group) => {
      group.items.sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return result.map((g) => ({
      group: g.group,
      items: g.items.map((i) => ({ name: i.name, value: i.value })),
    }));
  }
}
