import 'dotenv/config';

import { Pool } from 'pg';

/**
 * Creates the PostgreSQL extensions the schema depends on.
 *
 * `pg_trgm` backs the `gin_trgm_ops` indexes on products.name / search_document
 * and the `<%` word-similarity operator used by product search. drizzle-kit
 * cannot declare extensions, so this runs before `db:push` / `db:migrate`.
 */
const REQUIRED_EXTENSIONS = ['pg_trgm'] as const;

async function main(): Promise<void> {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is required to create database extensions.');
    }

    const pool = new Pool({ connectionString });

    try {
        for (const extension of REQUIRED_EXTENSIONS) {
            await pool.query(`CREATE EXTENSION IF NOT EXISTS "${extension}";`);
            console.log(`Extension "${extension}" is ready.`);
        }
    } finally {
        await pool.end();
    }
}

main().catch(error => {
    console.error('Failed to create database extensions:', error);
    process.exit(1);
});
