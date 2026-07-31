import { pgEnum } from 'drizzle-orm/pg-core';

// =======================
// Enums
// =======================
export const roleTypeEnum = pgEnum('role_type', ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']);

