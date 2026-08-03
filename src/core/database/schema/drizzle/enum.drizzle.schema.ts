import { pgEnum } from 'drizzle-orm/pg-core';

// =======================
// Enums
// =======================
export const roleTypeEnum = pgEnum('role_type', ['CUSTOMER', 'AGENT', 'SUPER_ADMIN']);

export const stockStatusEnum = pgEnum('stock_status', ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK', 'PRE_ORDER', 'UPCOMING']);

export const productTypeEnum = pgEnum('product_type', ['SIMPLE', 'VARIABLE']);

export const attributeInputTypeEnum = pgEnum("attribute_input_type", [
    "MULTI_SELECT",
    "SINGLE_SELECT",
    "BOOLEAN",
    "RANGE",
]);

export const attributeDataTypeEnum = pgEnum("attribute_data_type", [
    "STRING",
    "NUMBER",
    "BOOLEAN",
]);