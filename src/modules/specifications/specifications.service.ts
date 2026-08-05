import { Injectable } from "@nestjs/common";
import { SpecificationsRepository } from "./specifications.repository";
import { CreateSpecGroupDto, CreateSpecFieldDto, UpsertProductSpecsDto } from "./schemas/specifications.schema";

@Injectable()
export class SpecificationsService {
    constructor(private readonly specificationsRepository: SpecificationsRepository) { }

    async createGroup(data: CreateSpecGroupDto) {
        return this.specificationsRepository.createGroup(data);
    }

    async createField(groupId: string, data: CreateSpecFieldDto) {
        return this.specificationsRepository.createField({
            ...data,
            groupId,
        });
    }

    async upsertProductSpecs(productId: string, data: UpsertProductSpecsDto) {
        return this.specificationsRepository.upsertProductSpecs(productId, data.specs);
    }

    async getProductSpecs(productId: string) {
        const specs = await this.specificationsRepository.getProductSpecs(productId);

        // Group the specs by specificationGroup
        const grouped = specs.reduce((acc, current) => {
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
        }, {} as Record<string, { group: string, sortOrder: number, items: { name: string, value: string, sortOrder: number }[] }>);

        // Convert the record to an array and sort by group sortOrder
        const result = Object.values(grouped).sort((a, b) => a.sortOrder - b.sortOrder);

        // Sort items inside each group by field sortOrder
        result.forEach(group => {
            group.items.sort((a, b) => a.sortOrder - b.sortOrder);
            // Optionally remove sortOrder from the final response if not needed by frontend, 
            // but we can leave it or map it out. We will map it out for exact shape matching.
        });

        return result.map(g => ({
            group: g.group,
            items: g.items.map(i => ({ name: i.name, value: i.value }))
        }));
    }
}
