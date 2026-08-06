import { Injectable } from '@nestjs/common';

import { notFoundError } from '../../core/errors/domain-error';
import { CatalogRepository } from './catalog.repository';
import type {
  CatalogFacetGroup,
  CatalogFiltersResponse,
  CatalogProductsQueryDto,
  CatalogProductsResponse,
} from './schemas/catalog.schema';

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async getCategoryFilters(slug: string): Promise<CatalogFiltersResponse> {
    const category = await this.resolveCategoryBySlug(slug);
    const definitions =
      await this.catalogRepository.getCategoryFilterDefinitions(category.id);

    const candidateProductIds =
      await this.catalogRepository.findMatchingProductIds({
        categoryId: category.id,
        availability: [],
        filtersByAttribute: new Map(),
      });

    const allOptionIds = definitions.flatMap((definition) =>
      definition.options.map((option) => option.id),
    );

    const counts = await this.catalogRepository.countProductsByOptionIds({
      candidateProductIds,
      optionIds: allOptionIds,
    });

    return {
      categoryId: category.id,
      categorySlug: category.slug,
      facets: this.buildFacetGroups(definitions, counts),
    };
  }

  async getCategoryProducts(
    slug: string,
    query: CatalogProductsQueryDto,
  ): Promise<CatalogProductsResponse> {
    const category = await this.resolveCategoryBySlug(slug);
    const definitions =
      await this.catalogRepository.getCategoryFilterDefinitions(category.id);

    const filtersByAttribute = await this.groupFiltersByAttribute(
      query.filter,
    );

    const matchingProductIds =
      await this.catalogRepository.findMatchingProductIds({
        categoryId: category.id,
        priceMin: query.priceMin,
        priceMax: query.priceMax,
        availability: query.availability,
        filtersByAttribute,
      });

    const { items, total } = await this.catalogRepository.listProductsByIds({
      productIds: matchingProductIds,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    });

    const facets = await this.buildFacetsWithCounts({
      categoryId: category.id,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      availability: query.availability,
      filtersByAttribute,
      definitions,
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      facets,
    };
  }

  private async resolveCategoryBySlug(slug: string) {
    const category =
      await this.catalogRepository.findCategoryBySlug(slug);
    if (!category) {
      throw notFoundError('category_not_found', 'Category not found');
    }
    return category;
  }

  private async groupFiltersByAttribute(
    filterOptionIds: string[],
  ): Promise<Map<string, string[]>> {
    const uniqueIds = [...new Set(filterOptionIds)];
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const options =
      await this.catalogRepository.findAttributeOptionsByIds(uniqueIds);

    if (options.length !== uniqueIds.length) {
      throw notFoundError(
        'filter_option_not_found',
        'One or more filter options were not found',
      );
    }

    const grouped = new Map<string, string[]>();
    for (const option of options) {
      const existing = grouped.get(option.attributeId) ?? [];
      existing.push(option.id);
      grouped.set(option.attributeId, existing);
    }
    return grouped;
  }

  /**
   * Standard faceted UX: for each attribute group, counts ignore that group's
   * own selections but apply all other groups + price/availability/category.
   */
  private async buildFacetsWithCounts(params: {
    categoryId: string;
    priceMin?: number;
    priceMax?: number;
    availability: CatalogProductsQueryDto['availability'];
    filtersByAttribute: Map<string, string[]>;
    definitions: Awaited<
      ReturnType<CatalogRepository['getCategoryFilterDefinitions']>
    >;
  }): Promise<CatalogFacetGroup[]> {
    const facets: CatalogFacetGroup[] = [];

    for (const definition of params.definitions) {
      const filtersExcludingGroup = new Map(params.filtersByAttribute);
      filtersExcludingGroup.delete(definition.attributeId);

      const candidateProductIds =
        await this.catalogRepository.findMatchingProductIds({
          categoryId: params.categoryId,
          priceMin: params.priceMin,
          priceMax: params.priceMax,
          availability: params.availability,
          filtersByAttribute: filtersExcludingGroup,
        });

      const optionIds = definition.options.map((option) => option.id);
      const counts = await this.catalogRepository.countProductsByOptionIds({
        candidateProductIds,
        optionIds,
      });

      facets.push({
        attributeCode: definition.attributeCode,
        attributeName: definition.attributeName,
        options: definition.options.map((option) => ({
          id: option.id,
          label: option.label,
          count: counts.get(option.id) ?? 0,
        })),
      });
    }

    return facets;
  }

  private buildFacetGroups(
    definitions: Awaited<
      ReturnType<CatalogRepository['getCategoryFilterDefinitions']>
    >,
    counts: Map<string, number>,
  ): CatalogFacetGroup[] {
    return definitions.map((definition) => ({
      attributeCode: definition.attributeCode,
      attributeName: definition.attributeName,
      options: definition.options.map((option) => ({
        id: option.id,
        label: option.label,
        count: counts.get(option.id) ?? 0,
      })),
    }));
  }
}
