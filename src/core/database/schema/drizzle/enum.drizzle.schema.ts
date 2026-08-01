import { pgEnum } from 'drizzle-orm/pg-core';

// =======================
// Enums
// =======================
export const roleTypeEnum = pgEnum('role_type', ['CUSTOMER', 'AGENT', 'SUPER_ADMIN']);

export const stockStatusEnum = pgEnum('stock_status', ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK', 'PRE_ORDER', 'UPCOMING']);

